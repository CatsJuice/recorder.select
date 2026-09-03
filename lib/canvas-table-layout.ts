/** CSS-pixel geometry shared by drawing, hit testing, scrolling and keyboard navigation. */
export const HEADER_HEIGHT = 168;
export const LABEL_WIDTH = 190;
export const MIN_COLUMN_WIDTH = 148;
export type PositionedRow = { top: number; height: number };
export type CellAddress = { row: number; column: number }; // -1 = frozen header / label

export function columnWidth(viewportWidth: number, count: number) {
  return Math.max(MIN_COLUMN_WIDTH, (viewportWidth - LABEL_WIDTH) / Math.max(1, count));
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

export function visibleRange(rows: readonly PositionedRow[], count: number, width: number, height: number, left: number, top: number) {
  const cellWidth = columnWidth(width, count);
  return {
    cellWidth,
    firstColumn: Math.min(count, Math.max(0, Math.floor(left / cellWidth))),
    endColumn: Math.min(count, Math.ceil((left + Math.max(0, width - LABEL_WIDTH)) / cellWidth)),
    firstRow: rowAt(rows, top),
    endRow: Math.min(rows.length, rowAt(rows, top + Math.max(0, height - HEADER_HEIGHT)) + 1),
  };
}

export function hitTest(rows: readonly PositionedRow[], count: number, width: number, height: number, left: number, top: number, x: number, y: number): CellAddress | null {
  if (x < 0 || y < 0 || x >= width || y >= height) return null;
  const column = x < LABEL_WIDTH ? -1 : Math.floor((x - LABEL_WIDTH + left) / columnWidth(width, count));
  const row = y < HEADER_HEIGHT ? -1 : rowAt(rows, y - HEADER_HEIGHT + top);
  if (column >= count || row >= rows.length) return null;
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
