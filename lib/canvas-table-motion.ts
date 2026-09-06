import { columnWidth, HEADER_HEIGHT, LABEL_WIDTH, MOBILE_SUMMARY_HEIGHT, mobileStickyHeaders, rowAt, type CellAddress } from './canvas-table-layout';
import type { TableCell } from './comparison-table-model';
import type { PaintColumn, PaintRow, PaintScene } from './canvas-table-painter';

// Matches the existing table's 250ms cubic-bezier(.77, 0, .175, 1).
export const TABLE_MOTION_DURATION = 250;
export function tableEase(progress: number) {
  if (progress <= 0 || progress >= 1) return Math.max(0, Math.min(1, progress));
  const cubic = (t: number, a: number, b: number) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 20; iteration++) {
    const mid = (low + high) / 2;
    if (cubic(mid, .77, .175) < progress) low = mid; else high = mid;
  }
  return cubic((low + high) / 2, 0, 1);
}
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;

/** Insert exits beside their next surviving neighbour, without moving surviving items at t=0. */
function mergeExits(previous: string[], next: string[]) {
  const nextSet = new Set(next);
  const before = new Map<string | null, string[]>();
  let anchor: string | null = null;
  for (let index = previous.length - 1; index >= 0; index--) {
    const id = previous[index];
    if (nextSet.has(id)) anchor = id;
    else { const group = before.get(anchor) ?? []; group.push(id); before.set(anchor, group); }
  }
  return [...next.flatMap(id => [...(before.get(id) ?? []).reverse(), id]), ...(before.get(null) ?? []).reverse()];
}
type RowTween = { previousLayers?: (column: number) => Array<{ cell: TableCell; opacity: number }>; row: PaintRow; from: number; to: number; opacity: number; endOpacity: number; openness: number; endOpenness: number };
type ColumnTween = { column: PaintColumn; from: number; to: number; offset: number; opacity: number; endOpacity: number };
export type TableMotionFrame = { scene: PaintScene; totalWidth: number; totalHeight: number; running: boolean };

/** Retains exits only while needed. Retargets from the current displayed geometry, never from endpoints. */
export class CanvasTableMotion {
  private target: PaintScene | null = null;
  private width = 0;
  private started = 0;
  private duration = TABLE_MOTION_DURATION;
  private rowTweens: RowTween[] = [];
  private columnTweens: ColumnTween[] = [];
  private transitionScene: PaintScene | null = null;
  private reduced = false;

  update(scene: PaintScene, width: number, now: number, reduced = false) {
    if (scene === this.target && width === this.width && reduced === this.reduced) return;
    const previous = this.target ? this.sample(now).scene : null;
    const previousWidth = this.width;
    this.target = scene;
    this.width = width;
    this.reduced = reduced;
    if (!previous || !!previous.mobile !== !!scene.mobile) {
      this.transitionScene = null;
      return;
    }
    const previousRows = new Map(previous.rows.map(row => [row.id, row]));
    const nextRows = new Map(scene.rows.map(row => [row.id, row]));
    const previousIndices = new Map(previous.products.map((product, index) => [product.id, index]));
    const nextIndices = new Map(scene.products.map((product, index) => [product.id, index]));
    const nextRowIndices = new Map(scene.rows.map((row, index) => [row.id, index]));
    const productIds = reduced ? scene.products.map(product => product.id) : mergeExits(previous.products.map(product => product.id), scene.products.map(product => product.id));
    const rowIds = reduced ? scene.rows.map(row => row.id) : mergeExits(previous.rows.map(row => row.id), scene.rows.map(row => row.id));
    const products = productIds.map(id => scene.products[nextIndices.get(id)!] ?? previous.products[previousIndices.get(id)!]);
    const oldWidth = columnWidth(previousWidth, previous.products.length, previous.mobile);
    const newWidth = columnWidth(width, scene.products.length, scene.mobile);
    let packedLeft = 0;
    this.columnTweens = productIds.map(id => {
      const oldIndex = previousIndices.get(id);
      const nextIndex = nextIndices.get(id);
      const old = oldIndex === undefined ? undefined : previous.columns?.[oldIndex];
      const from = old?.width ?? (oldIndex === undefined ? 0 : oldWidth);
      const to = nextIndex === undefined ? 0 : newWidth;
      // Keep each product at its painted position, even when target order and widths change together.
      // The offset settles to zero as the packed layout reaches its destination.
      const offset = reduced || oldIndex === undefined ? 0 : (old?.top ?? oldIndex * oldWidth) - packedLeft;
      packedLeft += from;
      return { column: { id, top: 0, height: 0, width: from, contentWidth: nextIndex === undefined ? old?.contentWidth ?? oldWidth : newWidth, opacity: 1, targetIndex: nextIndex ?? -1 }, from: reduced ? to : from, to, offset, opacity: old?.opacity ?? (oldIndex === undefined ? 0 : 1), endOpacity: nextIndex === undefined ? 0 : 1 };
    });
    this.rowTweens = rowIds.map(id => {
      const old = previousRows.get(id);
      const next = nextRows.get(id);
      const source = next ?? old!;
      const from = old?.height ?? 0;
      const to = next?.height ?? 0;
      const previousLayers = old && next && (old.expanded !== next.expanded || old.cellLayers) ? (column: number) => {
        const oldIndex = previousIndices.get(productIds[column]);
        return oldIndex === undefined ? [] : old.cellLayers?.(oldIndex) ?? [{ cell: old.cell(oldIndex), opacity: 1 }];
      } : undefined;
      return { previousLayers, row: { ...source, cellLayers: undefined, contentHeight: scene.mobile ? Math.max(next?.height ?? 0, old?.contentHeight ?? old?.height ?? 0) : next?.height ?? old!.contentHeight ?? old!.height, targetIndex: nextRowIndices.get(id) ?? -1,
        // Product indexes change during filtering. Resolve values by stable ID, including exiting columns.
        cell: column => {
          const productId = productIds[column];
          const nextIndex = nextIndices.get(productId);
          if (next && nextIndex !== undefined) return next.cell(nextIndex);
          const oldIndex = previousIndices.get(productId);
          return old && oldIndex !== undefined ? old.cell(oldIndex) : { text: '' };
        },
      }, from: reduced ? to : from, to, opacity: old?.opacity ?? (old ? 1 : 0), endOpacity: next ? 1 : 0, openness: old?.expandedProgress ?? Number(old?.expanded ?? source.expanded ?? false), endOpenness: Number(next?.expanded ?? false) };
    });
    const changed = this.rowTweens.some(tween => tween.from !== tween.to || tween.opacity !== tween.endOpacity || tween.openness !== tween.endOpenness || !!tween.previousLayers) || this.columnTweens.some(tween => tween.from !== tween.to || tween.offset !== 0 || tween.opacity !== tween.endOpacity);
    if (!changed) {
      // A data/selection refresh during a transition still arrives here with intermediate geometry above.
      this.transitionScene = null;
      return;
    }
    this.started = now;
    this.duration = reduced ? 150 : TABLE_MOTION_DURATION;
    this.transitionScene = { ...scene, products, rows: [], scores: { ...previous.scores, ...scene.scores } };
  }

  sample(now: number): TableMotionFrame {
    if (!this.target) throw new Error('Initialize the table motion scene before sampling.');
    if (!this.transitionScene || now - this.started >= this.duration) {
      this.transitionScene = null;
      this.rowTweens = [];
      this.columnTweens = [];
      return { scene: this.target, totalWidth: (this.target.mobile ? 0 : LABEL_WIDTH) + this.target.products.length * columnWidth(this.width, this.target.products.length, this.target.mobile), totalHeight: this.target.rows.at(-1) ? this.target.rows.at(-1)!.top + this.target.rows.at(-1)!.height : 0, running: false };
    }
    const progress = tableEase((now - this.started) / this.duration);
    let top = 0;
    let left = 0;
    const rows = this.rowTweens.map(tween => {
      const height = mix(tween.from, tween.to, progress);
      const row = { ...tween.row, top, height, opacity: mix(tween.opacity, tween.endOpacity, progress), expandedProgress: this.reduced ? tween.endOpenness : mix(tween.openness, tween.endOpenness, progress) };
      if (tween.previousLayers) row.cellLayers = column => [
        ...tween.previousLayers!(column).map(layer => ({ cell: layer.cell, opacity: layer.opacity * (1 - progress) })),
        { cell: tween.row.cell(column), opacity: progress },
      ];
      top += height;
      return row;
    });
    const columns = this.columnTweens.map(tween => {
      const width = mix(tween.from, tween.to, progress);
      const column = { ...tween.column, top: left + mix(tween.offset, 0, progress), height: width, width, opacity: mix(tween.opacity, tween.endOpacity, progress) };
      left += width;
      return column;
    });
    return { scene: { ...this.transitionScene, rows, columns }, totalWidth: (this.target.mobile ? 0 : LABEL_WIDTH) + left, totalHeight: top, running: true };
  }

  finish() { this.transitionScene = null; this.rowTweens = []; this.columnTweens = []; }
}

/** Pointer hit testing uses what was painted, then maps back to the live model. Exits are inert. */
export function motionHitTest(scene: PaintScene, width: number, height: number, left: number, top: number, x: number, y: number): CellAddress | null {
  if (x < 0 || y < 0 || x >= width || y >= height) return null;
  if (scene.mobile && y < MOBILE_SUMMARY_HEIGHT) return { row: -1, column: -1 };
  if (scene.mobile && y >= HEADER_HEIGHT) {
    const sticky = mobileStickyHeaders(scene.rows, top).find(header => y >= Math.max(header.top, header.clipTop) && y < header.top + header.height);
    if (sticky) {
      const target = scene.rows[sticky.row].targetIndex ?? sticky.row;
      return target < 0 ? null : { row: target, column: -1 };
    }
  }
  const labelWidth = scene.mobile ? 0 : LABEL_WIDTH;
  const contentX = x - labelWidth + left;
  // Sorting columns can cross. Hit the last painted column, rather than binary-searching by position.
  const paintedColumn = scene.columns?.findLastIndex(slot => slot.width >= .1 && slot.opacity > 0 && contentX >= slot.top && contentX < slot.top + slot.width);
  let column = x < labelWidth ? -1 : paintedColumn === undefined ? Math.floor(contentX / columnWidth(width, scene.products.length, scene.mobile)) : paintedColumn < 0 ? scene.products.length : paintedColumn;
  const contentY = y - HEADER_HEIGHT + top;
  const row = y < HEADER_HEIGHT ? -1 : rowAt(scene.rows, contentY);
  if (row >= scene.rows.length) return null;
  if (scene.mobile && row >= 0 && contentY - scene.rows[row].top < (scene.rows[row].labelHeight ?? 0)) column = -1;
  if (column >= scene.products.length) return null;
  const targetColumn = column < 0 ? -1 : scene.columns?.[column].targetIndex ?? column;
  const targetRow = row < 0 ? -1 : scene.rows[row].targetIndex ?? row;
  if ((column >= 0 && targetColumn < 0) || (row >= 0 && targetRow < 0)) return null;
  return { row: targetRow, column: targetColumn };
}
