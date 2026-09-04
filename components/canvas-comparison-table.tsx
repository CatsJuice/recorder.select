'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { useI18n } from '../lib/i18n';
import { createComparisonModel, type ModelOptions, type TableRow } from '../lib/comparison-table-model';
import { CanvasTablePainter, type PaintScene } from '../lib/canvas-table-painter';
import { HEADER_HEIGHT, LABEL_WIDTH, MOBILE_SUMMARY_HEIGHT, mobileStickyHeaders, columnWidth, visibleRange, rowAt, type CellAddress } from '../lib/canvas-table-layout';
import { CanvasTableMotion, motionHitTest } from '../lib/canvas-table-motion';
import { CanvasScrollEdge } from '../lib/canvas-scroll-edge';
import { attachTableGesture } from '../lib/canvas-table-gesture';
import { focusRecorderEvent } from '../lib/comparison-table-events';

type Props = Omit<ModelOptions, 'locale' | 't' | 'fieldLabel' | 'fieldUnit' | 'groupLabel' | 'mobile'> & {
  animationsEnabled: boolean;
  scores: Record<string, number>;
  selected: string[];
  bottomSafeArea: number;
  onToggleProduct: (id: string) => void;
  onToggleGroup: (id: string) => void;
  onWeightChange: (key: string, weight: number) => void;
  onResetWeights: () => void;
};
type FocusedCell = { rowId: string | null; productId: string | null };
type WindowRange = { firstColumn: number; endColumn: number; firstRow: number; endRow: number; cellWidth: number; columns?: number[]; stickyRows?: number[] };
const SCROLL_EDGE_WIDTH = 80;
const sameAddress = (a: CellAddress | null, b: CellAddress | null) => a?.row === b?.row && a?.column === b?.column;

export function CanvasComparisonTable(props: Props) {
  const { animationsEnabled, products, compareMode, hideIdentical, identicalFieldKeys, expandedGroups, subjectiveReviewsExpanded, performanceProfiles, performanceStatus, fieldWeights, scores, selected, bottomSafeArea } = props;
  const { locale, t, fieldLabel, fieldUnit, groupLabel } = useI18n();
  const [mobile, setMobile] = useState(false);
  useLayoutEffect(() => {
    const query = matchMedia('(max-width: 760px)');
    const sync = () => setMobile(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  const model = useMemo(() => createComparisonModel({ mobile, products, compareMode, hideIdentical, identicalFieldKeys, expandedGroups, subjectiveReviewsExpanded, performanceProfiles, performanceStatus, fieldWeights, locale, t, fieldLabel, fieldUnit, groupLabel }), [mobile, products, compareMode, hideIdentical, identicalFieldKeys, expandedGroups, subjectiveReviewsExpanded, performanceProfiles, performanceStatus, fieldWeights, locale, t, fieldLabel, fieldUnit, groupLabel]);
  const scene = useMemo<PaintScene>(() => ({ mobile, products, rows: model.rows, scores, selected: new Set(selected), title: t('recorders', { count: products.length }), subtitle: t(compareMode ? 'selectedRecorders' : 'selectToCompare'), resetLabel: t('resetWeights'), scoreLabel: t('score'), emptyLabel: t('noMatches') }), [mobile, products, model.rows, scores, selected, compareMode, t]);
  const [focused, setFocused] = useState<FocusedCell>({ rowId: null, productId: null });
  const [hasFocus, setHasFocus] = useState(false);
  const keyboardInputRef = useRef(true);
  const [windowRange, setWindowRange] = useState<WindowRange>({ firstColumn: 0, endColumn: 0, firstRow: 0, endRow: 0, cellWidth: 148 });
  const [editor, setEditor] = useState<{ rowId: string; productId: string | null } | null>(null);
  const [weightEditor, setWeightEditor] = useState<{ rowId: string; focusInput: boolean; open: boolean } | null>(null);
  const weightPopoverRef = useRef<HTMLDivElement>(null);
  const weightCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const weightDragging = useRef(false);
  const syncWeightRef = useRef<() => void>(() => {});
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const edgeRef = useRef<HTMLCanvasElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scheduleRef = useRef<() => void>(() => {});
  const paintedSceneRef = useRef<PaintScene | null>(null);
  const instantRef = useRef(false);
  const syncLinksRef = useRef<() => void>(() => {});
  const hoverRef = useRef<CellAddress | null>(null);
  const pointerRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const highlightRef = useRef<string | null>(null);
  const active = useMemo<CellAddress>(() => ({ row: focused.rowId === null ? -1 : model.rows.findIndex(row => row.id === focused.rowId), column: focused.productId === null ? -1 : products.findIndex(product => product.id === focused.productId) }), [focused, model.rows, products]);
  const currentRef = useRef({ scene, totalHeight: model.totalHeight, bottomSafeArea, active, hasFocus, animationsEnabled });
  const gridId = useId();
  useEffect(() => {
    const pointer = () => { keyboardInputRef.current = false; setHasFocus(false); };
    const keyboard = () => {
      keyboardInputRef.current = true;
      if (scrollerRef.current?.contains(document.activeElement)) setHasFocus(true);
    };
    document.addEventListener('pointerdown', pointer, true);
    document.addEventListener('keydown', keyboard, true);
    return () => {
      document.removeEventListener('pointerdown', pointer, true);
      document.removeEventListener('keydown', keyboard, true);
    };
  }, []);
  const cellId = (row: number, column: number) => `${gridId}-${row + 1}-${column + 1}`;
  const weightRow = weightEditor && model.rows.find(row => row.id === weightEditor.rowId && row.weightKey);
  const cancelWeightClose = useCallback(() => {
    if (weightCloseTimer.current !== null) clearTimeout(weightCloseTimer.current);
    weightCloseTimer.current = null;
  }, []);
  const closeWeight = useCallback(() => {
    cancelWeightClose();
    if (weightPopoverRef.current?.contains(document.activeElement)) scrollerRef.current?.focus({ preventScroll: true });
    weightDragging.current = false;
    setWeightEditor(current => current?.open ? { ...current, open: false } : current);
  }, [cancelWeightClose]);
  const deferWeightClose = useCallback(() => {
    cancelWeightClose();
    // A small grace period bridges the label and panel without trapping hover after a drag.
    weightCloseTimer.current = setTimeout(() => {
      weightCloseTimer.current = null;
      const panel = weightPopoverRef.current;
      if (weightDragging.current || panel?.matches(':hover') || (weightEditor?.focusInput && panel?.contains(document.activeElement))) return;
      closeWeight();
    }, 160);
  }, [cancelWeightClose, closeWeight, weightEditor?.focusInput]);
  const openWeight = (rowId: string, focusInput: boolean) => {
    cancelWeightClose();
    if (!focusInput && (weightDragging.current || (weightEditor?.focusInput && weightPopoverRef.current?.contains(document.activeElement)))) return;
    setWeightEditor(current => current?.open && current.rowId === rowId && current.focusInput === focusInput ? current : { rowId, focusInput, open: true });
  };
  useLayoutEffect(() => {
    const panel = weightPopoverRef.current!;
    if (!weightEditor?.open || !weightRow) {
      if (weightEditor?.open && !weightRow) closeWeight();
      if (panel.matches(':popover-open')) panel.hidePopover();
      syncWeightRef.current = () => {};
      return;
    }
    const place = () => {
      const scroller = scrollerRef.current!;
      const row = (paintedSceneRef.current ?? currentRef.current.scene).rows.find(candidate => candidate.id === weightRow.id);
      if (!row || row.targetIndex === -1 || row.height <= 0 || row.top + (currentRef.current.scene.mobile ? row.labelHeight ?? row.height : row.height) <= scroller.scrollTop || HEADER_HEIGHT + row.top - scroller.scrollTop >= scroller.clientHeight) { closeWeight(); return; }
      const rect = scroller.getBoundingClientRect();
      const mobile = currentRef.current.scene.mobile;
      const center = rect.top + HEADER_HEIGHT + row.top - scroller.scrollTop + (mobile ? row.labelHeight ?? 40 : row.height) / 2;
      panel.style.left = `${Math.max(8, Math.min(rect.left + (mobile ? scroller.clientWidth - panel.offsetWidth - 8 : LABEL_WIDTH - 8), window.innerWidth - panel.offsetWidth - 8))}px`;
      panel.style.top = `${Math.max(8, Math.min(mobile ? Math.min(center + 20, rect.bottom - panel.offsetHeight - 8) : center - panel.offsetHeight / 2, window.innerHeight - panel.offsetHeight - 8))}px`;
    };
    if (!panel.matches(':popover-open')) panel.showPopover();
    syncWeightRef.current = place;
    place();
    if (weightEditor?.focusInput) panel.querySelector('input')?.focus({ preventScroll: true });
    return () => { syncWeightRef.current = () => {}; };
  }, [weightRow, weightEditor?.open, weightEditor?.focusInput, closeWeight]);
  useEffect(() => {
    if (!weightEditor?.open) return;
    const outside = (event: globalThis.PointerEvent) => {
      if (!weightPopoverRef.current?.contains(event.target as Node)) closeWeight();
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeWeight(); }
    };
    const endDrag = () => { weightDragging.current = false; deferWeightClose(); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerup', endDrag);
    document.addEventListener('pointercancel', endDrag);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerup', endDrag);
      document.removeEventListener('pointercancel', endDrag);
      cancelWeightClose();
    };
  }, [weightEditor, closeWeight, deferWeightClose, cancelWeightClose]);
  useEffect(() => cancelWeightClose, [cancelWeightClose]);

  useLayoutEffect(() => {
    currentRef.current = { scene, totalHeight: model.totalHeight, bottomSafeArea, active, hasFocus, animationsEnabled };
    hoverRef.current = null;
    scheduleRef.current();
  }, [scene, model.totalHeight, bottomSafeArea, active, hasFocus, animationsEnabled]);

  useLayoutEffect(() => { syncLinksRef.current(); }, [windowRange, products]);

  useLayoutEffect(() => {
    const root = rootRef.current!;
    const scroller = scrollerRef.current!;
    const canvas = canvasRef.current!;
    const spacer = spacerRef.current!;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    let frame = 0;
    let disposed = false;
    let lastWidth = 0;
    let lastHeight = 0;
    const schedule = () => { if (!frame && !disposed) frame = requestAnimationFrame(draw); };
    const gesture = attachTableGesture(root, scroller, schedule, () => { pointerRef.current = null; });
    const painter = new CanvasTablePainter(schedule);
    const edgePainter = new CanvasScrollEdge();
    const motion = new CanvasTableMotion();
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let linkPositions = new Map<string, { left: number; width: number; opacity: number }>();
    let linksKey = '';
    let spacerWidth = 0;
    let spacerHeight = 0;
    const syncLinks = () => {
      linksRef.current?.querySelectorAll<HTMLAnchorElement>('a[data-product-id]').forEach(anchor => {
        const slot = linkPositions.get(anchor.dataset.productId!);
        anchor.style.visibility = slot ? 'visible' : 'hidden';
        if (!slot) return;
        anchor.style.left = `${slot.left + 12}px`;
        anchor.style.width = `${Math.max(0, slot.width - 24)}px`;
        anchor.style.opacity = String(slot.opacity);
        anchor.style.pointerEvents = slot.width > 24 ? 'auto' : 'none';
      });
    };
    syncLinksRef.current = syncLinks;
    const configure = () => {
      painter.configure(getComputedStyle(root).fontFamily, document.documentElement.dataset.theme === 'dark');
      schedule();
    };
    const draw = () => {
      frame = 0;
      const current = currentRef.current;
      // The spacer provides native scrollbars; backing-store size is only the viewport.
      const width = scroller.clientWidth;
      const height = scroller.clientHeight;
      const now = performance.now();
      const scrolling = gesture.update(now);
      motion.update(current.scene, width, now, reducedMotion.matches);
      if (!current.animationsEnabled || instantRef.current) { motion.finish(); instantRef.current = false; }
      const animated = motion.sample(now);
      paintedSceneRef.current = animated.scene;
      const nextWidth = Math.max(width, animated.totalWidth);
      const nextHeight = Math.max(height, HEADER_HEIGHT + animated.totalHeight + current.bottomSafeArea);
      if (spacerWidth !== nextWidth) { spacerWidth = nextWidth; spacer.style.width = `${nextWidth}px`; }
      if (spacerHeight !== nextHeight) { spacerHeight = nextHeight; spacer.style.height = `${nextHeight}px`; }
      const dpr = window.devicePixelRatio || 1;
      const physicalWidth = Math.max(1, Math.round(width * dpr));
      const physicalHeight = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== physicalWidth || canvas.height !== physicalHeight) {
        canvas.width = physicalWidth; canvas.height = physicalHeight;
        canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const paintRange = painter.draw(ctx, animated.scene, { width, height, left: scroller.scrollLeft, top: scroller.scrollTop }, current.hasFocus ? current.active : null, hoverRef.current, highlightRef.current);
      const edge = edgeRef.current;
      if (edge) {
        const remaining = Math.max(0, scroller.scrollWidth - width - scroller.scrollLeft);
        edge.hidden = remaining <= 1;
        edge.style.right = `${scroller.offsetWidth - width}px`;
        edge.style.height = `${height}px`;

        // Blur only horizontally scrolling content; fixed mobile labels stay crisp.
        const excluded: Array<[number, number]> = [];
        if (animated.scene.mobile) {
          excluded.push([0, MOBILE_SUMMARY_HEIGHT]);
          for (let index = paintRange.firstRow; index < paintRange.endRow; index++) {
            const row = animated.scene.rows[index];
            const y = HEADER_HEIGHT + row.top - scroller.scrollTop;
            excluded.push([Math.max(HEADER_HEIGHT, y), y + Math.min(row.height, row.labelHeight ?? 0)]);
          }
          for (const header of mobileStickyHeaders(animated.scene.rows, scroller.scrollTop)) {
            excluded.push([Math.max(header.top, header.clipTop), header.top + header.height]);
          }
        }
        const bands: Array<[number, number]> = [];
        for (const [start, end] of excluded.sort((a, b) => a[0] - b[0])) {
          const bottom = Math.min(height, end);
          if (bottom <= start) continue;
          const last = bands.at(-1);
          if (last && start <= last[1]) last[1] = Math.max(last[1], bottom);
          else bands.push([start, bottom]);
        }
        edgePainter.draw(edge, canvas, SCROLL_EDGE_WIDTH, height, dpr, edge.hidden ? 0 : Math.min(1, remaining / SCROLL_EDGE_WIDTH), bands);
      }
      // ARIA references the live model; link hit regions follow the actual painted columns.
      const range: WindowRange = visibleRange(current.scene.rows, current.scene.products.length, width, height, scroller.scrollLeft, scroller.scrollTop, current.scene.mobile);
      const columns: number[] = [];
      linkPositions = new Map();
      for (let column = paintRange.firstColumn; column < paintRange.endColumn; column++) {
        const slot = animated.scene.columns?.[column];
        const targetIndex = slot?.targetIndex ?? column;
        if (targetIndex < 0) continue;
        columns.push(targetIndex);
        linkPositions.set(animated.scene.products[column].id, { left: slot?.top ?? column * range.cellWidth, width: slot?.width ?? range.cellWidth, opacity: slot?.opacity ?? 1 });
      }
      range.columns = columns;
      range.stickyRows = current.scene.mobile ? mobileStickyHeaders(current.scene.rows, scroller.scrollTop).map(header => header.row) : [];
      if (linksRef.current) {
        linksRef.current.style.transform = `translateX(${-scroller.scrollLeft}px)`;
        linksRef.current.parentElement!.style.left = `${current.scene.mobile ? 0 : LABEL_WIDTH}px`;
        linksRef.current.parentElement!.style.width = `${Math.max(0, width - (current.scene.mobile ? 0 : LABEL_WIDTH))}px`;
      }
      const nextLinksKey = [...linkPositions].map(([id, slot]) => `${id}:${slot.left}:${slot.width}:${slot.opacity}`).join('|');
      if (nextLinksKey !== linksKey) { linksKey = nextLinksKey; syncLinks(); }
      syncWeightRef.current();
      setWindowRange(previous => previous.firstColumn === range.firstColumn && previous.endColumn === range.endColumn && previous.firstRow === range.firstRow && previous.endRow === range.endRow && previous.cellWidth === range.cellWidth && previous.columns?.length === columns.length && previous.columns.every((column, index) => column === columns[index]) && previous.stickyRows?.length === range.stickyRows!.length && previous.stickyRows.every((row, index) => row === range.stickyRows![index]) ? previous : range);
      if (animated.running || scrolling) schedule();
      // A new scrollbar can reduce the viewport by its own width/height.
      if (lastWidth !== width || lastHeight !== height) { lastWidth = width; lastHeight = height; schedule(); }
    };
    scheduleRef.current = schedule;
    const observer = new ResizeObserver(schedule);
    observer.observe(scroller);
    const themeObserver = new MutationObserver(configure);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    let resolution: MediaQueryList;
    const resolutionChanged = () => {
      resolution?.removeEventListener('change', resolutionChanged);
      resolution = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      resolution.addEventListener('change', resolutionChanged);
      schedule();
    };
    resolutionChanged();
    const fontsChanged = () => { painter.clearTextCache(); configure(); };
    document.fonts.ready.then(() => { if (!disposed) fontsChanged(); });
    document.fonts.addEventListener('loadingdone', fontsChanged);
    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    reducedMotion.addEventListener('change', schedule);
    configure();
    return () => {
      disposed = true;
      gesture.dispose();
      cancelAnimationFrame(frame);
      scheduleRef.current = () => {};
      observer.disconnect(); themeObserver.disconnect();
      resolution.removeEventListener('change', resolutionChanged);
      document.fonts.removeEventListener('loadingdone', fontsChanged);
      scroller.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      reducedMotion.removeEventListener('change', schedule);
      syncLinksRef.current = () => {};
      painter.dispose();
      edgePainter.dispose();
    };
  }, []);

  const focusCell = useCallback((address: CellAddress, reveal = false) => {
    const row = model.rows[address.row];
    if (mobile && row?.height === row?.labelHeight && row) address = { ...address, column: -1 };
    const product = products[address.column];
    setFocused({ rowId: row?.id ?? null, productId: product?.id ?? null });
    const scroller = scrollerRef.current!;
    if (reveal) {
      const width = columnWidth(scroller.clientWidth, products.length, mobile);
      const labelWidth = mobile ? 0 : LABEL_WIDTH;
      if (product) {
        const left = address.column * width;
        if (left < scroller.scrollLeft) scroller.scrollLeft = left;
        else if (left + width > scroller.scrollLeft + scroller.clientWidth - labelWidth) scroller.scrollLeft = Math.max(left, left + width - scroller.clientWidth + labelWidth);
      }
      if (row) {
        const pinned = mobile ? mobileStickyHeaders(model.rows, scroller.scrollTop) : [];
        if (address.column === -1 && pinned.some(header => header.row === address.row)) return;
        const covered = pinned.reduce((bottom, header) => Math.max(bottom, header.top + header.height - HEADER_HEIGHT), 0);
        if (row.top < scroller.scrollTop + covered) {
          const ancestors = mobile ? mobileStickyHeaders(model.rows, row.top).filter(header => header.row < address.row) : [];
          scroller.scrollTop = Math.max(0, row.top - ancestors.reduce((sum, header) => sum + header.height, 0));
        }
        else if (row.top + row.height > scroller.scrollTop + scroller.clientHeight - HEADER_HEIGHT) scroller.scrollTop = Math.min(row.top, row.top + row.height - scroller.clientHeight + HEADER_HEIGHT);
      }
    }
  }, [model.rows, products, mobile]);
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const onFocus = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      const column = products.findIndex(product => product.id === id);
      if (column < 0) return;
      focusCell({ row: -1, column }, true);
      highlightRef.current = id;
      scheduleRef.current();
      clearTimeout(timeout);
      timeout = setTimeout(() => { highlightRef.current = null; scheduleRef.current(); }, 1800);
    };
    window.addEventListener(focusRecorderEvent, onFocus);
    return () => { window.removeEventListener(focusRecorderEvent, onFocus); clearTimeout(timeout); highlightRef.current = null; };
  }, [products, focusCell]);

  const activate = (address: CellAddress) => {
    focusCell(address);
    if (address.row === -1) {
      if (address.column === -1) props.onResetWeights();
      else props.onToggleProduct(products[address.column].id);
      return;
    }
    const row = model.rows[address.row];
    if (row.expanded !== undefined) {
      const scroller = scrollerRef.current!;
      if (mobile && row.expanded) {
        const painted = paintedSceneRef.current ?? scene;
        const pinned = mobileStickyHeaders(painted.rows, scroller.scrollTop).find(header => painted.rows[header.row].id === row.id);
        // Keep a collapsed section within reach instead of retaining an offset deep inside its removed content.
        if (pinned) scroller.scrollTop = Math.max(0, row.top - (pinned.clipTop - HEADER_HEIGHT));
      }
      props.onToggleGroup(row.id);
    }
    else if (address.column === -1 && row.weightKey) openWeight(row.id, true);
    else if (address.column >= 0) setEditor({ rowId: row.id, productId: products[address.column]?.id ?? null });
  };
  const addressAt = (event: PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current!;
    const rect = scroller.getBoundingClientRect();
    return motionHitTest(paintedSceneRef.current ?? scene, scroller.clientWidth, scroller.clientHeight, scroller.scrollLeft, scroller.scrollTop, event.clientX - rect.left, event.clientY - rect.top);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;
    const address = addressAt(event);
    if (sameAddress(address, hoverRef.current)) return;
    hoverRef.current = address;
    const row = address && model.rows[address.row];
    if (address?.column === -1 && row?.weightKey && window.matchMedia('(any-hover: hover)').matches) openWeight(row.id, false);
    else deferWeightClose();
    event.currentTarget.style.cursor = address && (address.row === -1 || row?.expanded !== undefined || row?.weightKey || address.column >= 0) ? 'pointer' : 'default';
    event.currentTarget.title = row?.weightKey && address?.column === -1 ? '' : address && address.column >= 0 && row ? row.cell(address.column).text : row?.label ?? '';
    scheduleRef.current();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const next = { ...active };
    if (event.key === 'ArrowRight') next.column++;
    else if (event.key === 'ArrowLeft') next.column--;
    else if (event.key === 'ArrowDown') next.row++;
    else if (event.key === 'ArrowUp') next.row--;
    else if (event.key === 'Home') { next.column = -1; if (event.ctrlKey || event.metaKey) next.row = -1; }
    else if (event.key === 'End') { next.column = products.length - 1; if (event.ctrlKey || event.metaKey) next.row = model.rows.length - 1; }
    else if (event.key === 'PageDown' || event.key === 'PageUp') {
      const row = model.rows[active.row];
      const delta = Math.max(60, scrollerRef.current!.clientHeight - HEADER_HEIGHT) * (event.key === 'PageDown' ? 1 : -1);
      next.row = rowAt(model.rows, Math.max(0, (row?.top ?? 0) + delta));
    } else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); instantRef.current = true; activate(active); return; }
    else return;
    event.preventDefault();
    instantRef.current = true;
    next.row = Math.max(-1, Math.min(model.rows.length - 1, next.row));
    next.column = Math.max(-1, Math.min(products.length - 1, next.column));
    focusCell(next, true);
  };
  const editorRow = editor && model.rows.find(row => row.id === editor.rowId);
  const editorColumn = editor ? products.findIndex(product => product.id === editor.productId) : -1;
  const editorCell = editorRow && editorColumn >= 0 ? editorRow.cell(editorColumn) : null;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (editorRow && !dialog.open) dialog.showModal();
    else if (!editorRow && dialog.open) dialog.close();
  }, [editorRow]);

  const visibleColumns = (windowRange.columns ?? []).filter(index => index < products.length);
  const accessibleColumns = [...new Set([-1, ...visibleColumns, active.column])].sort((a, b) => a - b);
  const accessibleRows = [...new Set([-1, ...(windowRange.stickyRows ?? []), ...Array.from({ length: windowRange.endRow - windowRange.firstRow }, (_, index) => index + windowRange.firstRow), active.row])].filter(index => index < model.rows.length).sort((a, b) => a - b);
  const labelFor = (row: TableRow | undefined, column: number) => {
    if (!row) return column < 0 ? `${scene.title}, ${scene.resetLabel}` : `${products[column].name}, ${scores[products[column].id]?.toFixed(1)} ${t('score')}`;
    if (column < 0) return row.weightKey ? `${row.label}, ${t('weight')} ${row.weight}` : row.label;
    const cell = row.cell(column);
    return `${products[column].name}, ${row.label}: ${cell.text}${cell.secondary ? `, ${cell.secondary}` : ''}`;
  };

  return <div className={`canvas-comparison comparison-surface${mobile ? ' is-mobile' : ''}`} ref={rootRef}>
    <div className="canvas-table-scroll" ref={scrollerRef} role="grid" tabIndex={0} data-keyboard-focus={hasFocus} aria-label={scene.title} aria-rowcount={model.rows.length + 1} aria-colcount={products.length + 1} aria-multiselectable="true" aria-activedescendant={cellId(active.row, active.column)} aria-describedby={`${gridId}-help`}
      onFocus={() => setHasFocus(keyboardInputRef.current)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false); }} onKeyDown={onKeyDown}
      onCopy={event => { event.clipboardData.setData('text/plain', labelFor(model.rows[active.row], active.column)); event.preventDefault(); }}
      onPointerMove={onPointerMove} onPointerLeave={() => { hoverRef.current = null; deferWeightClose(); scheduleRef.current(); }}
      onPointerDown={event => { if (event.button !== 0 || !event.isPrimary) return; pointerRef.current = { x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop }; }}
      onPointerCancel={() => { pointerRef.current = null; }}
      onPointerUp={event => {
        const start = pointerRef.current; pointerRef.current = null;
        if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6 || Math.abs(event.currentTarget.scrollLeft - start.left) > 2 || Math.abs(event.currentTarget.scrollTop - start.top) > 2) return;
        const address = addressAt(event);
        if (!address) return;
        event.currentTarget.focus({ preventScroll: true });
        // Only the actual reset button in the corner is clickable.
        if (address.row === -1 && address.column === -1) {
          const rect = event.currentTarget.getBoundingClientRect();
          const y = event.clientY - rect.top;
          const x = event.clientX - rect.left;
          if (mobile ? y >= MOBILE_SUMMARY_HEIGHT || x < event.currentTarget.clientWidth * .6 : y < 112 || y > 146) { focusCell(address); return; }
        }
        activate(address);
      }}>
      <div ref={spacerRef} aria-hidden="true" />
      <div className="canvas-table-a11y">
        <p id={`${gridId}-help`}>{t('tableKeyboardHelp')}</p>
        {accessibleRows.map(rowIndex => {
          const row = model.rows[rowIndex];
          return <div role="row" aria-rowindex={rowIndex + 2} key={row?.id ?? 'header'}>{accessibleColumns.map(column => {
            const label = labelFor(row, column);
            const actionable = !row || row.expanded !== undefined || column >= 0 || !!row.weightKey;
            return <div key={products[column]?.id ?? 'label'} id={cellId(rowIndex, column)} role={rowIndex === -1 ? 'columnheader' : column === -1 ? 'rowheader' : 'gridcell'} aria-colindex={column + 2} aria-label={label} aria-selected={column >= 0 ? selected.includes(products[column].id) : undefined}>
              {actionable ? <button type="button" tabIndex={-1} aria-label={label} aria-expanded={row?.expanded} aria-pressed={!row && column >= 0 ? selected.includes(products[column].id) : undefined} onClick={() => activate({ row: rowIndex, column })}>{!row && column < 0 ? t('resetWeights') : label}</button> : label}
            </div>;
          })}</div>;
        })}
      </div>
    </div>
    <canvas ref={canvasRef} className="canvas-table-surface" aria-hidden="true" />
    <canvas ref={edgeRef} className="canvas-scroll-edge" style={{ width: SCROLL_EDGE_WIDTH }} aria-hidden="true" hidden />
    <div className="canvas-table-links-clip"><div className="canvas-table-links" ref={linksRef}>{visibleColumns.map(column => <a key={products[column].id} data-product-id={products[column].id} href={products[column].website} target="_blank" rel="noreferrer" style={{ left: column * windowRange.cellWidth + 12, width: windowRange.cellWidth - 24 }} aria-label={t('visitWebsite', { name: products[column].name })} title={t('visitWebsite', { name: products[column].name })} onFocus={() => focusCell({ row: -1, column }, true)} />)}</div></div>
    <div ref={weightPopoverRef} popover="manual" role="dialog" aria-labelledby={`${gridId}-weight-title`} className="field-weight-panel canvas-weight-popover"
      onPointerEnter={cancelWeightClose} onPointerLeave={deferWeightClose}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) deferWeightClose(); }}>
      {weightRow && <>
        <div id={`${gridId}-weight-title`} className="canvas-weight-title">{weightRow.label}</div>
        <header><span>{t('weight')}</span><strong>{weightRow.weight}</strong></header>
        <div className="weight-anchor-labels" aria-hidden="true">{Array.from({ length: 11 }, (_, value) => <span key={value} style={{ gridColumnStart: value + 1 }}>{value}</span>)}</div>
        <input type="range" min="0" max="10" step="0.5" value={weightRow.weight} style={{ '--weight-progress': `${(weightRow.weight ?? 5) * 10}%` } as CSSProperties}
          aria-label={`${weightRow.label} ${t('weight')}`} onPointerDown={() => { cancelWeightClose(); weightDragging.current = true; }}
          onChange={event => props.onWeightChange(weightRow.weightKey!, Number(event.target.value))} />
      </>}
    </div>
    <dialog ref={dialogRef} className="canvas-table-dialog" aria-label={editorRow?.label} onClose={() => { setEditor(null); scrollerRef.current?.focus({ preventScroll: true }); }} onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
      <div><header><strong>{editorRow?.label}</strong><button type="button" aria-label={t('close')} onClick={() => dialogRef.current?.close()}>×</button></header>
        <small>{products[editorColumn]?.name}</small><p className="canvas-cell-detail">{editorCell?.text}</p>{editorCell?.secondary && <small>{editorCell.secondary}</small>}
      </div>
    </dialog>
  </div>;
}
