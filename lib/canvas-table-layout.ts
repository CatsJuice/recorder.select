/** CSS-pixel geometry shared by drawing, hit testing, scrolling and keyboard navigation. */
export const HEADER_HEIGHT = 168;
export const LABEL_WIDTH = 190;
export const MIN_COLUMN_WIDTH = 148;
export const MOBILE_LABEL_HEIGHT = 40;
export const MOBILE_SUMMARY_HEIGHT = 32;
export type PositionedRow = { top: number; height: number };
export type CellAddress = { row: number; column: number }; // -1 = frozen header / label
type StickyRow = PositionedRow & { level?: number; expanded?: boolean; labelHeight?: number };
type StickyGroup = { row: number; end: number; children: StickyGroup[] };
export type StickyHeader = { row: number; top: number; height: number; clipTop: number };
const stickyGroups = new WeakMap<readonly StickyRow[], StickyGroup[]>();

/** Index group boundaries once per layout; scrolling only visits the active ancestor chain. */
export function mobileStickyHeaders(rows: readonly StickyRow[], scrollTop: number): StickyHeader[] {
  let roots = stickyGroups.get(rows);
  if (!roots) {
    const tree: StickyGroup[] = [];
    roots = tree;
    const stack: StickyGroup[] = [];
    rows.forEach((row, index) => {
      while (stack.length && (rows[stack.at(-1)!.row].level ?? 0) >= (row.level ?? 0)) stack.pop()!.end = index;
      if (row.expanded === undefined || !row.labelHeight) return;
      const group = { row: index, end: rows.length, children: [] };
      (stack.at(-1)?.children ?? tree).push(group);
      stack.push(group);
    });
    stickyGroups.set(rows, roots);
  }
  const result: StickyHeader[] = [];
  let groups = roots;
  let offset = 0;
  while (groups.length) {
    const threshold = scrollTop + offset;
    let low = 0;
    let high = groups.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (rows[groups[mid].row].top <= threshold) low = mid + 1; else high = mid;
    }
    const group = groups[low - 1];
    if (!group) break;
    const row = rows[group.row];
    const end = rows[group.end]?.top ?? ((rows.at(-1)?.top ?? 0) + (rows.at(-1)?.height ?? 0));
    const height = Math.min(row.height, row.labelHeight ?? 0);
    if (end <= threshold || height < .1) break;
    result.push({ row: group.row, top: HEADER_HEIGHT + Math.min(offset, end - scrollTop - height), height, clipTop: HEADER_HEIGHT + offset });
    offset += height;
    groups = group.children;
  }
  return result;
}

export function columnWidth(viewportWidth: number, count: number, mobile = false) {
  return Math.max(MIN_COLUMN_WIDTH, (viewportWidth - (mobile ? 0 : LABEL_WIDTH)) / Math.max(1, count));
}

/** First row whose bottom lies strictly after y; also works beyond the last row. */
export function rowAt(rows: readonly PositionedRow[], y: number) {
  let low = 0;
  let high = rows.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (rows[mid].top + rows[mid].height <= y) low = mid + 1;
    else high = mid;
  }
  return low;
}

export function visibleRange(rows: readonly PositionedRow[], count: number, width: number, height: number, left: number, top: number, mobile = false) {
  const cellWidth = columnWidth(width, count, mobile);
  return {
    cellWidth,
    firstColumn: Math.min(count, Math.max(0, Math.floor(left / cellWidth))),
    endColumn: Math.min(count, Math.ceil((left + Math.max(0, width - (mobile ? 0 : LABEL_WIDTH))) / cellWidth)),
    firstRow: rowAt(rows, top),
    endRow: Math.min(rows.length, rowAt(rows, top + Math.max(0, height - HEADER_HEIGHT)) + 1),
  };
}

export function hitTest(rows: readonly StickyRow[], count: number, width: number, height: number, left: number, top: number, x: number, y: number, mobile = false): CellAddress | null {
  if (x < 0 || y < 0 || x >= width || y >= height) return null;
  if (mobile && y < MOBILE_SUMMARY_HEIGHT) return { row: -1, column: -1 };
  if (mobile && y >= HEADER_HEIGHT) {
    const sticky = mobileStickyHeaders(rows, top).find(header => y >= Math.max(header.top, header.clipTop) && y < header.top + header.height);
    if (sticky) return { row: sticky.row, column: -1 };
  }
  const labelWidth = mobile ? 0 : LABEL_WIDTH;
  let column = x < labelWidth ? -1 : Math.floor((x - labelWidth + left) / columnWidth(width, count, mobile));
  const contentY = y - HEADER_HEIGHT + top;
  const row = y < HEADER_HEIGHT ? -1 : rowAt(rows, contentY);
  if (row >= rows.length) return null;
  if (mobile && row >= 0 && contentY - rows[row].top < (rows[row].labelHeight ?? 0)) column = -1;
  if (column >= count) return null;
  return { row, column };
}

/** Keep peaks when reducing long timelines: at most two points per bucket. */
export function downsample(points: readonly (readonly [number, number])[], buckets = 160): Array<readonly [number, number]> {
  if (points.length <= buckets * 2) return [...points];
  const result: Array<readonly [number, number]> = [points[0]];
  for (let bucket = 0; bucket < buckets; bucket++) {
    const start = Math.floor(bucket * points.length / buckets);
    const end = Math.floor((bucket + 1) * points.length / buckets);
    let min = start;
    let max = start;
    for (let index = start + 1; index < end; index++) {
      if (points[index][1] < points[min][1]) min = index;
      if (points[index][1] > points[max][1]) max = index;
    }
    result.push(points[Math.min(min, max)]);
    if (min !== max) result.push(points[Math.max(min, max)]);
  }
  result.push(points[points.length - 1]);
  return result;
}
