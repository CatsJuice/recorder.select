import { hasRecorderWarning } from './recorder-warnings';
import { faApple, faWindows, faLinux, faSwift } from '@fortawesome/free-brands-svg-icons';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { electronPath, tauriPath } from './technology-icon-paths';
import { displayDomain, type Recorder } from './recorders';
import type { TableCell, TableRow } from './comparison-table-model';
import { HEADER_HEIGHT, LABEL_WIDTH, MIN_COLUMN_WIDTH, MOBILE_SUMMARY_HEIGHT, mobileStickyHeaders, rowAt, visibleRange, type CellAddress } from './canvas-table-layout';

export type PaintRow = TableRow & { opacity?: number; contentHeight?: number; expandedProgress?: number; targetIndex?: number; cellLayers?: (column: number) => Array<{ cell: TableCell; opacity: number }> };
export type PaintColumn = { id: string; top: number; height: number; width: number; contentWidth: number; opacity: number; targetIndex: number };
export type PaintScene = {
  mobile?: boolean;
  products: Recorder[];
  rows: PaintRow[];
  columns?: PaintColumn[];
  scores: Record<string, number>;
  selected: Set<string>;
  title: string;
  subtitle: string;
  resetLabel: string;
  scoreLabel: string;
  emptyLabel: string;
};
export type Viewport = { width: number; height: number; left: number; top: number };
const light = { background: '#ffffff', label: '#fcfcfc', group: '#f7f7f7', ink: '#111111', muted: '#767676', line: '#e8e8e8', selected: '#f2f2f2', best: '#eff8ef', bar: '#e8f0fd', freePrice: '#16804a', low: '#e6f4ed', high: '#fff0ed', outlier: '#f4b4ae', focus: '#3678e8', highlight: '#fff4cd', heat: ['#29956c', '#80a536', '#c29a25', '#df7835', '#d64c4c'] };
const dark = { background: '#0e0e0e', label: '#111111', group: '#181818', ink: '#f2f2f2', muted: '#a0a0a0', line: '#2a2a2a', selected: '#222222', best: '#18291c', bar: '#18273c', freePrice: '#63cda0', low: '#132c24', high: '#342019', outlier: '#782e2a', focus: '#7aaaff', highlight: '#3b331c', heat: ['#63cda0', '#afd36c', '#e8c65b', '#f6a362', '#f47c7c'] };
const iconDefinitions = { mac: faApple, win: faWindows, linux: faLinux, native: faSwift, warning: faTriangleExclamation };

/** Retained resource caches; the only per-frame work is the visible rectangle. */
export class CanvasTablePainter {
  private images = new Map<string, HTMLImageElement>();
  private textCache = new Map<string, string[]>();
  private textWidthCache = new Map<string, number>();
  private textCenterCache = new Map<string, number>();
  private paths = new Map<string, { paths: Path2D[]; width: number; height: number }>();
  private font = 'Arial, sans-serif';
  private palette = light;
  private disposed = false;
  constructor(private invalidate: () => void) {}

  configure(font: string, isDark: boolean) {
    if (this.font !== font) this.clearTextCache();
    this.font = font;
    this.palette = isDark ? dark : light;
  }
  clearTextCache() { this.textCache.clear(); this.textWidthCache.clear(); this.textCenterCache.clear(); }
  dispose() {
    this.disposed = true;
    for (const image of this.images.values()) image.onload = image.onerror = null;
    this.images.clear();
    this.clearTextCache();
  }
  private image(src: string) {
    let image = this.images.get(src);
    if (!image) {
      if (this.images.size >= 128) {
        const oldest = this.images.keys().next().value!;
        const evicted = this.images.get(oldest)!;
        evicted.onload = evicted.onerror = null;
        this.images.delete(oldest);
      }
      image = new Image();
      image.onload = () => { if (!this.disposed) this.invalidate(); };
      image.onerror = () => { if (!this.disposed) this.invalidate(); };
      image.src = src;
      this.images.set(src, image);
    }
    // Keep recently visible icons resident, with a bounded decoded-image cache.
    this.images.delete(src);
    this.images.set(src, image);
    return image.complete && image.naturalWidth > 0 ? image : null;
  }
  private lines(ctx: CanvasRenderingContext2D, text: string, width: number, maxLines: number) {
    const key = `${ctx.font}|${width}|${maxLines}|${text}`;
    const cached = this.textCache.get(key);
    if (cached) return cached;
    const lines: string[] = [];
    let line = '';
    // Unicode code points preserve surrogate pairs and allow CJK line breaking.
    const characters = Array.from(text);
    for (let index = 0; index < characters.length; index++) {
      const character = characters[index];
      if (character !== '\n' && ctx.measureText(line + character).width <= width) { line += character; continue; }
      if (lines.length === maxLines - 1) {
        while (line && ctx.measureText(line + '…').width > width) line = Array.from(line).slice(0, -1).join('');
        lines.push(line + '…');
        line = '';
        break;
      }
      lines.push(line);
      line = character === '\n' ? '' : character;
    }
    if (line || !lines.length) lines.push(line);
    if (this.textCache.size >= 6000) this.textCache.clear();
    this.textCache.set(key, lines);
    return lines;
  }
  private text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, width: number, options: { size?: number; weight?: number; color?: string; align?: CanvasTextAlign; lines?: number; lineHeight?: number; visualCenter?: boolean } = {}) {
    ctx.font = `${options.weight ?? 500} ${options.size ?? 13}px ${this.font}`;
    ctx.fillStyle = options.color ?? this.palette.ink;
    ctx.textAlign = options.align ?? 'left';
    ctx.textBaseline = 'middle';
    const lines = this.lines(ctx, value, Math.max(1, width), options.lines ?? 1);
    const lineHeight = options.lineHeight ?? 18;
    if (options.visualCenter) {
      // Canvas "middle" centers the em box, not the visible glyphs. Align the
      // ink bounds of the whole label (including wrapped lines) with the icon.
      const key = `${ctx.font}|${JSON.stringify(lines)}`;
      let offset = this.textCenterCache.get(key);
      if (offset === undefined) {
        const first = ctx.measureText(lines[0]);
        const last = lines.length === 1 ? first : ctx.measureText(lines[lines.length - 1]);
        offset = ((first.actualBoundingBoxAscent ?? 0) - (last.actualBoundingBoxDescent ?? 0)) / 2;
        if (this.textCenterCache.size >= 512) this.textCenterCache.clear();
        this.textCenterCache.set(key, offset);
      }
      y += offset;
    }
    lines.forEach((line, index) => ctx.fillText(line, x, y + (index - (lines.length - 1) / 2) * lineHeight));
  }
  private rect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = this.palette.line;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + .5, y + .5, width, height);
  }
  private check(ctx: CanvasRenderingContext2D, x: number, y: number, yes: boolean, selected = false) {
    const p = this.palette;
    ctx.beginPath();
    ctx.roundRect(x - 10, y - 10, 20, 20, selected ? 5 : 10);
    ctx.fillStyle = yes ? p.ink : p.selected;
    ctx.fill();
    ctx.strokeStyle = yes ? p.background : p.muted;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    if (yes) { ctx.moveTo(x - 4, y); ctx.lineTo(x - 1, y + 3); ctx.lineTo(x + 5, y - 4); }
    else { ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y); }
    ctx.stroke();
  }
  private icon(ctx: CanvasRenderingContext2D, key: string, x: number, y: number, size: number, color = this.palette.ink) {
    let cached = this.paths.get(key);
    if (!cached) {
      const definition = iconDefinitions[key as keyof typeof iconDefinitions];
      if (definition) {
        const [width, height, , , path] = definition.icon;
        cached = { width, height, paths: (Array.isArray(path) ? path : [path]).map(value => new Path2D(value)) };
      } else if (key === 'electron' || key === 'tauri') cached = { width: 24, height: 24, paths: [new Path2D(key === 'electron' ? electronPath : tauriPath)] };
      else return false;
      this.paths.set(key, cached);
    }
    ctx.save();
    const scale = size / Math.max(cached.width, cached.height);
    ctx.translate(x - cached.width * scale / 2, y - cached.height * scale / 2);
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    cached.paths.forEach(path => ctx.fill(path));
    ctx.restore();
    return true;
  }
  private cell(ctx: CanvasRenderingContext2D, cell: TableCell, row: TableRow, x: number, y: number, width: number, mobile = false) {
    const p = this.palette;
    const height = row.height;
    const background = cell.caution ? p.highlight : cell.best ? p.best : !mobile && row.expanded !== undefined ? p.group : p.background;
    if (mobile) { ctx.fillStyle = background; ctx.fillRect(x, y, width, height); }
    else this.rect(ctx, x, y, width, height, background);
    ctx.save();
    ctx.beginPath(); ctx.rect(x + 1, y + 1, width - 2, height - 2); ctx.clip();
    if (cell.bar !== undefined) {
      ctx.fillStyle = cell.outlier ? p.outlier : cell.extreme === 'high' ? p.high : cell.extreme === 'low' ? p.low : p.bar;
      // Fill the cell's width; the existing clip keeps its grid borders visible.
      ctx.fillRect(x, y + height * (1 - cell.bar), width, height * cell.bar);
    }
    if (cell.boolean !== undefined) this.check(ctx, x + width / 2, y + height / 2, cell.boolean);
    else if (cell.sparkline?.length) {
      const points = cell.sparkline;
      const left = x + 12;
      const bottom = y + height - 12;
      const graphHeight = height - (cell.secondary ? 38 : 24);
      const plotWidth = width - 24;
      const thresholds = cell.heatThresholds ?? [];
      let color: string | CanvasGradient = p.heat[0];
      if (thresholds.length) {
        const gradient = ctx.createLinearGradient(0, bottom, 0, bottom - graphHeight);
        gradient.addColorStop(0, p.heat[0]);
        thresholds.forEach((threshold, index) => {
          // Paired stops create discrete heat bands without repainting the path.
          gradient.addColorStop(threshold, p.heat[Math.round(index / thresholds.length * 4)]);
          gradient.addColorStop(threshold, p.heat[Math.round((index + 1) / thresholds.length * 4)]);
        });
        gradient.addColorStop(1, p.heat[4]);
        color = gradient;
      }
      ctx.beginPath();
      points.forEach(([time, value], index) => {
        const px = left + time * plotWidth;
        const py = bottom - value * graphHeight;
        if (!index) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.lineTo(left + points[points.length - 1][0] * plotWidth, bottom);
      ctx.lineTo(left + points[0][0] * plotWidth, bottom); ctx.closePath();
      ctx.save(); ctx.globalAlpha *= .16; ctx.fillStyle = color; ctx.fill(); ctx.restore();
      if (cell.secondary) this.text(ctx, cell.secondary, x + width / 2, y + 15, width - 20, { size: 11, color: p.muted, align: 'center' });
    } else if (row.review) {
      this.text(ctx, cell.text, x + 16, y + height / 2, width - 32, { weight: 400, lines: Math.max(1, Math.floor((height - 24) / 20)), lineHeight: 20, color: cell.freePrice ? p.freePrice : cell.muted ? p.muted : p.ink });
    } else if (cell.icons?.length && cell.icons.every(icon => ['mac', 'win', 'linux'].includes(icon))) {
      cell.icons.forEach((icon, index) => this.icon(ctx, icon, x + width / 2 + (index - (cell.icons!.length - 1) / 2) * 28, y + height / 2, 17));
    } else {
      const leadingIcon = cell.outlier ? 'warning' : cell.icons?.find(icon => ['native', 'electron', 'tauri'].includes(icon));
      const centerY = y + height / 2 - (cell.secondary ? 9 : 0);
      if (leadingIcon) {
        const iconSize = cell.outlier ? 14 : 18;
        const gap = 8;
        const labelWidth = Math.max(1, width - 24 - iconSize - gap);
        ctx.font = `500 13px ${this.font}`;
        const lines = this.lines(ctx, cell.text, labelWidth, 2);
        const measuredWidth = Math.max(...lines.map(line => {
          const key = `${ctx.font}|${line}`;
          let measured = this.textWidthCache.get(key);
          if (measured === undefined) {
            measured = ctx.measureText(line).width;
            if (this.textWidthCache.size >= 512) this.textWidthCache.clear();
            this.textWidthCache.set(key, measured);
          }
          return measured;
        }));
        const groupLeft = x + (width - iconSize - gap - measuredWidth) / 2;
        this.icon(ctx, leadingIcon, groupLeft + iconSize / 2, centerY, iconSize);
        this.text(ctx, cell.text, groupLeft + iconSize + gap, centerY, labelWidth, { lines: 2, visualCenter: true, color: cell.freePrice ? p.freePrice : cell.muted ? p.muted : p.ink });
      } else {
        this.text(ctx, cell.text, x + width / 2, centerY, width - 24, { align: 'center', lines: 2, color: cell.freePrice ? p.freePrice : cell.muted ? p.muted : p.ink });
      }
      if (cell.secondary) this.text(ctx, cell.secondary, x + width / 2, y + height / 2 + 15, width - 20, { size: 11, color: p.muted, align: 'center' });
    }
    ctx.restore();
  }
  draw(ctx: CanvasRenderingContext2D, scene: PaintScene, viewport: Viewport, active: CellAddress | null, hovered: CellAddress | null, highlightedId: string | null) {
    const { width, height, left, top } = viewport;
    const mobile = !!scene.mobile;
    const labelWidth = mobile ? 0 : LABEL_WIDTH;
    const range = visibleRange(scene.rows, scene.products.length, width, height, left, top, mobile);
    if (scene.columns) {
      range.firstColumn = rowAt(scene.columns, left);
      range.endColumn = Math.min(scene.columns.length, rowAt(scene.columns, left + Math.max(0, width - labelWidth)) + 1);
    }
    const { cellWidth, firstColumn, endColumn, firstRow, endRow } = range;
    const bounds = (column: number) => {
      const slot = scene.columns?.[column];
      return { x: labelWidth + (slot?.top ?? column * cellWidth) - left, width: slot?.width ?? cellWidth, contentWidth: slot ? Math.max(MIN_COLUMN_WIDTH, slot.width) : cellWidth, opacity: slot?.opacity ?? 1, index: slot?.targetIndex ?? column };
    };
    const p = this.palette;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = p.background; ctx.fillRect(0, 0, width, height);
    const highlight = (address: CellAddress, x: number, y: number, w: number, h: number) => {
      if (hovered?.row === address.row && hovered.column === address.column) {
        ctx.save(); ctx.fillStyle = p.ink; ctx.globalAlpha *= .035; ctx.fillRect(x, y, w, h); ctx.restore();
      }
      if (active?.row === address.row && active.column === address.column) {
        ctx.strokeStyle = p.focus; ctx.lineWidth = 2; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
      }
    };
    ctx.save(); ctx.beginPath(); ctx.rect(labelWidth, HEADER_HEIGHT, Math.max(0, width - labelWidth), Math.max(0, height - HEADER_HEIGHT)); ctx.clip();
    for (let rowIndex = firstRow; rowIndex < endRow; rowIndex++) {
      const row = scene.rows[rowIndex];
      if (row.height < .1 || row.opacity === 0) continue;
      const labelHeight = row.labelHeight ?? 0;
      const y = HEADER_HEIGHT + row.top - top + labelHeight;
      const bodyHeight = row.height - labelHeight;
      if (bodyHeight < .1) continue;
      for (let column = firstColumn; column < endColumn; column++) {
        const slot = bounds(column);
        if (slot.width < .1 || slot.opacity === 0) continue;
        ctx.save(); ctx.beginPath(); ctx.rect(slot.x, y, slot.width, bodyHeight); ctx.clip();
        ctx.globalAlpha = (row.opacity ?? 1) * slot.opacity;
        const layers = row.cellLayers?.(column) ?? [{ cell: row.cell(column), opacity: 1 }];
        for (const layer of layers) {
          if (layer.opacity <= 0) continue;
          ctx.save(); ctx.globalAlpha *= layer.opacity;
          this.cell(ctx, layer.cell, { ...row, height: Math.max(0, (row.contentHeight ?? row.height) - labelHeight) }, slot.x, y, slot.contentWidth, mobile);
          ctx.restore();
        }
        if (scene.products[column].id === highlightedId) { ctx.save(); ctx.fillStyle = p.highlight; ctx.globalAlpha *= .45; ctx.fillRect(slot.x, y, slot.width, bodyHeight); ctx.restore(); }
        if (slot.index >= 0 && (row.targetIndex ?? rowIndex) >= 0) highlight({ row: row.targetIndex ?? rowIndex, column: slot.index }, slot.x, y, slot.width, bodyHeight);
        ctx.restore();
      }
    }
    ctx.restore();
    // Sticky ancestors are drawn last, above scrolling labels and values.
    const sticky = mobile ? mobileStickyHeaders(scene.rows, top) : [];
    const pinned = new Set(sticky.map(header => header.row));
    const labels = [
      ...Array.from({ length: endRow - firstRow }, (_, index) => index + firstRow)
        .filter(index => !pinned.has(index))
        .map(index => ({ row: index, top: HEADER_HEIGHT + scene.rows[index].top - top, clipTop: HEADER_HEIGHT })),
      ...sticky.toReversed(),
    ];
    ctx.save(); ctx.beginPath(); ctx.rect(0, HEADER_HEIGHT, mobile ? width : LABEL_WIDTH + 1, Math.max(0, height - HEADER_HEIGHT)); ctx.clip();
    for (const label of labels) {
      const index = label.row;
      const row = scene.rows[index];
      if (row.height < .1 || row.opacity === 0) continue;
      const contentHeight = mobile ? row.labelHeight ?? 0 : row.contentHeight ?? row.height;
      const y = label.top;
      const clipTop = Math.max(y, label.clipTop);
      const clipHeight = Math.max(0, y + Math.min(row.height, contentHeight) - clipTop);
      ctx.save(); ctx.beginPath(); ctx.rect(0, clipTop, mobile ? width : LABEL_WIDTH + 1, clipHeight); ctx.clip();
      ctx.globalAlpha = row.opacity ?? 1;
      if (mobile) { ctx.fillStyle = p.group; ctx.fillRect(0, y, width, contentHeight); }
      else this.rect(ctx, 0, y, LABEL_WIDTH, contentHeight, row.expanded !== undefined ? p.group : p.label);
      const indent = 16 + row.level * 10;
      if (row.expanded !== undefined) {
        ctx.save(); ctx.translate(indent + 4, y + contentHeight / 2);
        ctx.rotate((row.expandedProgress ?? Number(row.expanded)) * Math.PI / 2);
        ctx.strokeStyle = p.muted; ctx.lineWidth = 1.5; ctx.beginPath();
        ctx.moveTo(-2, -4); ctx.lineTo(2, 0); ctx.lineTo(-2, 4); ctx.stroke();
        ctx.restore();
      }
      const labelX = indent + (row.expanded !== undefined ? 16 : 0);
      if (mobile) {
        this.text(ctx, row.label, labelX, y + contentHeight / 2, width - labelX - (row.weight !== undefined || row.badge ? 64 : 12), { lines: 2, size: 12, weight: row.expanded !== undefined ? 650 : 500 });
        const trailing = row.weight !== undefined ? `× ${row.weight}` : row.badge;
        if (trailing) this.text(ctx, trailing, width - 14, y + contentHeight / 2, 54, { size: 11, color: p.muted, align: 'right' });
        if ((row.targetIndex ?? index) >= 0) highlight({ row: row.targetIndex ?? index, column: -1 }, 0, y, width, contentHeight);
      } else {
        this.text(ctx, row.label, labelX, y + contentHeight / 2 - (row.weight !== undefined ? 7 : 0), LABEL_WIDTH - labelX - (row.badge ? 35 : 12), { lines: 2, size: 12, weight: row.expanded !== undefined ? 650 : 500 });
        if (row.weight !== undefined) this.text(ctx, `× ${row.weight}`, labelX, y + contentHeight / 2 + 17, LABEL_WIDTH - labelX - 12, { color: p.muted, size: 11 });
        if (row.badge) this.text(ctx, row.badge, LABEL_WIDTH - 10, y + contentHeight / 2, 32, { size: 10, color: p.muted, align: 'right' });
        if ((row.targetIndex ?? index) >= 0) highlight({ row: row.targetIndex ?? index, column: -1 }, 0, y, LABEL_WIDTH, row.height);
      }
      ctx.restore();
    }
    ctx.restore();
    // Frozen product headers; icons are loaded only for columns that have been visible.
    ctx.save(); ctx.beginPath(); ctx.rect(labelWidth, mobile ? MOBILE_SUMMARY_HEIGHT : 0, Math.max(0, width - labelWidth), mobile ? HEADER_HEIGHT - MOBILE_SUMMARY_HEIGHT : HEADER_HEIGHT + 1); ctx.clip();
    for (let column = firstColumn; column < endColumn; column++) {
      const app = scene.products[column];
      const slot = bounds(column);
      if (slot.width < .1 || slot.opacity === 0) continue;
      const x = slot.x;
      const cellWidth = slot.contentWidth;
      ctx.save(); ctx.beginPath(); ctx.rect(x, 0, slot.width, HEADER_HEIGHT + 1); ctx.clip();
      ctx.globalAlpha = slot.opacity;
      const selected = scene.selected.has(app.id);
      const headerTop = mobile ? MOBILE_SUMMARY_HEIGHT : 0;
      if (mobile) { ctx.fillStyle = selected ? p.selected : p.background; ctx.fillRect(x, headerTop, cellWidth, HEADER_HEIGHT - headerTop); }
      else this.rect(ctx, x, 0, cellWidth, HEADER_HEIGHT, selected ? p.selected : p.background);
      if (selected) { ctx.fillStyle = p.ink; ctx.fillRect(x, headerTop, cellWidth, 3); }
      if (highlightedId === app.id) { ctx.fillStyle = p.highlight; ctx.fillRect(x + 1, headerTop + 3, cellWidth - 2, HEADER_HEIGHT - headerTop - 4); }
      const iconTop = mobile ? 44 : 24;
      const iconSize = mobile ? 28 : 38;
      ctx.save(); ctx.beginPath(); ctx.roundRect(x + 18, iconTop, iconSize, iconSize, mobile ? 8 : 9); ctx.clip();
      const image = app.icon && this.image(app.icon);
      if (image) ctx.drawImage(image, x + 18, iconTop, iconSize, iconSize);
      else { ctx.fillStyle = app.accent; ctx.fillRect(x + 18, iconTop, iconSize, iconSize); this.text(ctx, app.name[0], x + 18 + iconSize / 2, iconTop + iconSize / 2, iconSize, { color: '#fff', align: 'center', size: 18, weight: 700 }); }
      ctx.restore();
      if (selected) this.check(ctx, x + cellWidth - 23, mobile ? 54 : 26, true, true);
      else { ctx.strokeStyle = p.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(x + cellWidth - 33, mobile ? 44 : 16, 20, 20, 5); ctx.stroke(); }
      const hasWarning = hasRecorderWarning(app.id);
      const nameWidth = cellWidth - 30 - (hasWarning ? 17 : 0);
      this.text(ctx, app.name, x + 18, 91, nameWidth, { weight: 650 });
      if (hasWarning) {
        const key = `header-name:${app.name}:${this.font}`;
        let measuredWidth = this.textWidthCache.get(key);
        let centerOffset = this.textCenterCache.get(key);
        if (measuredWidth === undefined || centerOffset === undefined) {
          const metrics = ctx.measureText(app.name);
          measuredWidth = metrics.width;
          centerOffset = ((metrics.actualBoundingBoxDescent ?? 0) - (metrics.actualBoundingBoxAscent ?? 0)) / 2;
          this.textWidthCache.set(key, measuredWidth);
          this.textCenterCache.set(key, centerOffset);
        }
        this.icon(ctx, 'warning', x + 18 + Math.min(nameWidth, measuredWidth) + 10.5, 91 + centerOffset, 11, '#eab308');
      }
      this.text(ctx, displayDomain(app.website), x + 18, 115, cellWidth - 30, { size: 11, color: p.muted });
      this.text(ctx, `${(scene.scores[app.id] ?? 0).toFixed(1)} ${scene.scoreLabel}`, x + 18, 143, cellWidth - 30, { size: 12 });
      if (slot.index >= 0) highlight({ row: -1, column: slot.index }, x, 0, slot.width, HEADER_HEIGHT);
      ctx.restore();
    }
    ctx.restore();
    if (mobile) {
      ctx.fillStyle = p.group; ctx.fillRect(0, 0, width, MOBILE_SUMMARY_HEIGHT);
      this.text(ctx, scene.title, 12, MOBILE_SUMMARY_HEIGHT / 2, Math.max(1, width * .55 - 12), { size: 11, weight: 650 });
      this.text(ctx, scene.resetLabel, width - 12, MOBILE_SUMMARY_HEIGHT / 2, Math.max(1, width * .4), { align: 'right', size: 11, color: p.muted });
      highlight({ row: -1, column: -1 }, width * .6, 0, width * .4, MOBILE_SUMMARY_HEIGHT);
    } else {
      this.rect(ctx, 0, 0, LABEL_WIDTH, HEADER_HEIGHT, p.label);
      this.text(ctx, scene.title, 18, 35, LABEL_WIDTH - 36, { weight: 650 });
      this.text(ctx, scene.subtitle, 18, 72, LABEL_WIDTH - 36, { size: 11, lines: 3, color: p.muted });
      ctx.strokeStyle = p.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(14, 112, LABEL_WIDTH - 28, 34, 6); ctx.stroke();
      this.text(ctx, scene.resetLabel, LABEL_WIDTH / 2, 129, LABEL_WIDTH - 36, { align: 'center', size: 11, color: p.muted });
      highlight({ row: -1, column: -1 }, 0, 0, LABEL_WIDTH, HEADER_HEIGHT);
    }
    if (!scene.products.length) this.text(ctx, scene.emptyLabel, labelWidth + Math.max(0, width - labelWidth) / 2, HEADER_HEIGHT + 50, Math.max(1, width - labelWidth - 24), { align: 'center', lines: 3, color: p.muted });
    return range;
  }
}
