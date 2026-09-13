import { fieldDefinitions, fieldGroups, type FieldDefinition, type FieldGroup, type Recorder } from './recorders';
import { formatPerformanceValue, performanceFields, performanceMetricGroups, performanceTimelinePoints, performanceTimelineScale, performanceValue, type PerformanceProfiles } from './performance';
import { subjectiveReviewFor, subjectiveReviewKeys } from './subjective-reviews';
import type { Locale } from './i18n';
import { downsample, MOBILE_LABEL_HEIGHT } from './canvas-table-layout';

export type TableCell = {
  text: string;
  secondary?: string;
  boolean?: boolean;
  muted?: boolean;
  freePrice?: boolean;
  best?: boolean;
  extreme?: 'low' | 'high';
  scoreExtreme?: 'best' | 'worst';
  outlier?: boolean;
  caution?: boolean;
  bar?: number;
  icons?: string[];
  sparkline?: Array<readonly [number, number]>;
  heatThresholds?: readonly number[];
};
export type TableRow = {
  scorePreview?: boolean;
  id: string;
  label: string;
  level: number;
  top: number;
  height: number;
  labelHeight?: number;
  expanded?: boolean;
  badge?: string;
  weightKey?: string;
  weight?: number;
  review?: boolean;
  cell: (column: number) => TableCell;
};
export type ModelOptions = {
  mobile?: boolean;
  showScores?: boolean;
  cellScores?: Record<string, Record<string, number>>;
  products: Recorder[];
  compareMode: boolean;
  hideIdentical: boolean;
  identicalFieldKeys: Set<string>;
  expandedGroups: Record<string, boolean>;
  subjectiveReviewsExpanded: boolean;
  performanceProfiles: PerformanceProfiles;
  performanceStatus: 'idle' | 'loading' | 'loaded' | 'error';
  fieldWeights: Record<string, number>;
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
  fieldLabel: (field: FieldDefinition) => string;
  fieldUnit: (field: FieldDefinition) => string | undefined;
  groupLabel: (group: FieldGroup) => string;
};
const excluded = new Set(['name', 'website', 'score', 'lastUpdatedAt', 'lastUpdatedVersion']);
const direct = (group: FieldGroup) => fieldDefinitions.filter(field => field.group === group.key);
const children = (group: FieldGroup) => fieldGroups.filter(child => child.parentKey === group.key);
const descendants = (group: FieldGroup): FieldDefinition[] => [...direct(group), ...children(group).flatMap(descendants)];
const groupFields = new Map(fieldGroups.map(group => [group.key, descendants(group)]));

export function createComparisonModel(options: ModelOptions) {
  const { products, t, fieldUnit, fieldLabel, groupLabel, fieldWeights, performanceProfiles: profiles } = options;
  const rows: TableRow[] = [];
  let totalHeight = 0;
  const cellCache = new Map<string, TableCell>();
  const hidden = (key: string) => options.compareMode && options.hideIdentical && options.identicalFieldKeys.has(key);
  const unknown = (): TableCell => ({ text: t('unknown'), muted: true });
  const missingPerformance = (): TableCell => ({ text: options.performanceStatus === 'error' ? t('performanceLoadFailed') : options.performanceStatus === 'loaded' ? t('unknown') : t('performanceLoading'), muted: true });
  // Cells are created on first visible use, not as an eagerly allocated N × M matrix.
  const add = (row: Omit<TableRow, 'top'> & { mobileLabelOnly?: boolean }) => {
    const { mobileLabelOnly, ...source } = row;
    const renderedRow = { ...source, scorePreview: options.showScores, labelHeight: options.mobile ? MOBILE_LABEL_HEIGHT : undefined, height: options.mobile ? MOBILE_LABEL_HEIGHT + (mobileLabelOnly && !options.showScores ? 0 : row.height) : row.height };
    let scoreValues: Array<number | undefined> | undefined;
    let scoreLow = 0;
    let scoreHigh = 0;
    const prepareScores = () => {
      if (scoreValues) return;
      const group = fieldGroups.find(group => group.key === row.id);
      const fields = group ? groupFields.get(group.key)! : fieldDefinitions.filter(field => field.key === row.id);
      const keys = fields.filter(field => field.scoreable !== false && field.key !== 'technologyApproach').map(field => field.key);
      scoreValues = products.map(product => {
        const scores = options.cellScores?.[product.id] ?? {};
        const scored = keys.filter(key => Object.hasOwn(scores, key) && Number.isFinite(scores[key]));
        return scored.length ? Number(scored.reduce((sum, key) => sum + scores[key], 0).toFixed(2)) : undefined;
      });
      const valid = scoreValues.filter((value): value is number => value !== undefined);
      scoreLow = valid.reduce((min, value) => Math.min(min, value), Infinity);
      scoreHigh = valid.reduce((max, value) => Math.max(max, value), -Infinity);
    };
    rows.push({ ...renderedRow, top: totalHeight, cell: column => {
      const key = `${row.id}:${column}`;
      let cell = cellCache.get(key);
      if (!cell) {
        if (options.showScores) {
          prepareScores();
          const value = scoreValues![column];
          cell = value === undefined ? { text: '' } : { text: String(value) };
          if (value !== undefined && scoreHigh > scoreLow) {
            if (value === scoreHigh) cell.scoreExtreme = 'best';
            else if (value === scoreLow) cell.scoreExtreme = 'worst';
          }
        } else cell = row.cell(column);
        if (cellCache.size >= 4096) cellCache.delete(cellCache.keys().next().value!);
      } else cellCache.delete(key);
      cellCache.set(key, cell);
      return cell;
    } });
    totalHeight += renderedRow.height;
  };
  const addField = (field: FieldDefinition, level: number) => {
    if (hidden(field.key)) return;
    let bestIds: Set<string> | undefined;
    let extremes: Map<string, 'low' | 'high'> | undefined;
    let maximum = 0;
    const prepare = () => {
      if (bestIds) return;
      bestIds = new Set();
      extremes = new Map();
      const perf = performanceFields[field.key];
      const values = products.map(app => performanceValue(profiles, app.id, field.key) ?? app[field.key]);
      if (perf || field.key === 'appSizeMB') {
        // Labels describe a run; extrema and bar heights share the visible row.
        const entries: Array<{ id: string; value: number }> = [];
        products.forEach((app, index) => {
          const run = perf ? profiles[app.id]?.[perf.scenario] : undefined;
          const value = values[index];
          if ((perf && !run) || typeof value !== 'number' || !Number.isFinite(value)) return;
          if (run?.outlierFields?.includes(field.key)) return;
          maximum = Math.max(maximum, value);
          entries.push({ id: app.id, value });
        });
        if (entries.length > 1) {
          const low = entries.reduce((min, entry) => Math.min(min, entry.value), Infinity);
          const high = entries.reduce((max, entry) => Math.max(max, entry.value), -Infinity);
          if (low === high) return;
          for (const entry of entries) {
            if (entry.value === low) extremes!.set(entry.id, 'low');
            if (entry.value === high) extremes!.set(entry.id, 'high');
          }
        }
      } else if (options.compareMode && products.length > 1) {
        const rank = (value: unknown): number | undefined => {
          if (value == null) return undefined;
          if (field.type === 'boolean') return value === (field.booleanBest ?? true) ? 1 : 0;
          if (field.type === 'multiselect') return Array.isArray(value) ? value.length : undefined;
          if (field.type === 'select') return field.options?.find(option => option.value === value)?.rank;
          if ((field.type === 'price' || field.type === 'number') && typeof value === 'number') return value * (field.type === 'price' || !field.higherIsBetter ? -1 : 1);
          return undefined;
        };
        const ranks = values.map(rank);
        const best = ranks.reduce<number>((max, value) => Math.max(max, value ?? -Infinity), -Infinity);
        products.forEach((app, index) => {
          if (ranks[index] !== undefined && ranks[index] === best && (field.type !== 'boolean' || best === 1)) bestIds!.add(app.id);
        });
      }
    };
    add({ id: field.key, label: fieldLabel(field), level, height: performanceFields[field.key] ? 72 : 60,
      weightKey: field.scoreable === false ? undefined : field.key,
      weight: field.scoreable === false ? undefined : fieldWeights[field.key] ?? 5,
      cell: column => {
        prepare();
        const app = products[column];
        const value = app[field.key];
        const perf = performanceFields[field.key];
        if (perf) {
          const number = performanceValue(profiles, app.id, field.key);
          if (number === undefined || !Number.isFinite(number)) return missingPerformance();
          const run = profiles[app.id]?.[perf.scenario];
          const outlier = run?.outlierFields?.includes(field.key) ?? false;
          const formatted = formatPerformanceValue(number, perf.format);
          return { text: formatted, secondary: run?.workloadLabel, bar: outlier ? 1 : maximum > 0 ? Math.min(1, Math.max(0, number / maximum)) : 0, extreme: extremes!.get(app.id), outlier };
        }
        if (field.key === 'appSizeMB') {
          if (typeof value !== 'number' || !Number.isFinite(value)) return unknown();
          return { text: `${value}${fieldUnit(field) ?? ''}`, bar: maximum > 0 ? Math.min(1, Math.max(0, value / maximum)) : 0, extreme: extremes!.get(app.id) };
        }
        const style = { best: bestIds!.has(app.id) };
        if (field.type === 'boolean') return value == null ? unknown() : { text: t(value ? 'yes' : 'no'), boolean: value === true, ...style };
        if (value == null || value === '') return field.type === 'price' ? { text: '/', muted: true } : unknown();
        if (Array.isArray(value)) {
          const labels = value.map(item => field.options?.find(option => option.value === item)?.label ?? item);
          return { text: labels.join(', ') || '—', icons: field.key === 'platforms' ? value : undefined, ...style };
        }
        if (field.type === 'price') return { text: Number(value) === 0 ? t('free') : `$${value}${fieldUnit(field) ?? ''}`, freePrice: Number(value) === 0, ...style };
        if (field.type === 'select' || field.type === 'select-text') {
          return { text: field.options?.find(option => option.value === (field.type === 'select-text' ? String(value).toLowerCase() : value))?.label ?? String(value), icons: field.key === 'technologyApproach' ? [String(value).toLowerCase()] : undefined, ...style };
        }
        return { text: `${value}${fieldUnit(field) ?? ''}`, ...style };
      },
    });
  };
  const addGroup = (group: FieldGroup, level: number) => {
    const fields = groupFields.get(group.key)!;
    if (products.length > 1 && fields.length > 0 && fields.every(field => hidden(field.key))) return;
    const expanded = !!options.expandedGroups[group.key];
    const metric = performanceMetricGroups[group.key];
    add({ id: group.key, label: groupLabel(group), level, height: metric ? 84 : 48, mobileLabelOnly: !metric && (expanded || !group.getCollapsedPreview), expanded, badge: String(fields.length), cell: column => {
      const app = products[column];
      if (metric) {
        const run = profiles[app.id]?.[metric.scenario];
        if (!run || (run.samples.length === 0 && options.performanceStatus !== 'loaded')) return missingPerformance();
        const scale = performanceTimelineScale(profiles, metric.scenario, metric.metric);
        const ceiling = Math.max(scale.maximum, 1);
        const points = performanceTimelinePoints(run, metric.metric).map(([time, value]) => [
          Math.min(1, Math.max(0, time / Math.max(run.summary.durationSeconds, 1))),
          Math.min(1, value / ceiling),
        ] as const);
        const peak = metric.metric === 'cpu' ? run.summary.peakSystemCPUPercent ?? run.summary.peakCPUPercent : run.summary.peakSystemMemoryDeltaBytes ?? run.summary.peakPhysicalFootprintBytes;
        return { text: `${groupLabel(group)}: ${formatPerformanceValue(peak, metric.metric)}`, secondary: run.workloadLabel, sparkline: downsample(points), heatThresholds: scale.heatThresholds };
      }
      const preview = !expanded && group.getCollapsedPreview?.(app);
      if (!preview) return { text: '' };
      if (preview.type === 'boolean') return preview.value == null ? unknown() : { text: t(preview.value ? 'yes' : 'no'), boolean: preview.value, best: options.compareMode && products.length > 1 && preview.value };
      const unitField = fieldDefinitions.find(field => field.key === preview.unitFieldKey);
      if (preview.type === 'price') {
        if (preview.value === null) return unknown();
        if (preview.value === 0) return { text: t('free'), freePrice: true };
        return { text: t('priceFrom', { price: `$${preview.value}${unitField ? fieldUnit(unitField) ?? '' : ''}` }) };
      }
      return { text: `${preview.label}${unitField ? fieldUnit(unitField) ?? '' : ''}` };
    } });
    if (!expanded) return;
    children(group).forEach(child => addGroup(child, level + 1));
    direct(group).forEach(field => addField(field, level + 1));
  };
  add({ id: 'subjectiveReviews', mobileLabelOnly: true, label: t('subjectiveReview'), level: 0, height: 48, expanded: options.subjectiveReviewsExpanded, badge: t('notScored'), cell: () => ({ text: '' }) });
  if (options.subjectiveReviewsExpanded) subjectiveReviewKeys.forEach(key => {
    const texts = products.map(app => subjectiveReviewFor(options.locale, app.id, key) ?? '—');
    // Conservative line budget at the minimum column width; stable when scrolling horizontally.
    const lines = texts.reduce((max, text) => Math.max(max, Math.ceil(Array.from(text).reduce((size, character) => size + (character.charCodeAt(0) > 255 ? 14 : 8), 0) / 100)), 1);
    add({ id: `review-${key}`, label: t(key === 'ui' ? 'subjectiveUi' : key === 'ux' ? 'subjectiveUx' : 'subjectiveSummary'), level: 1, height: Math.max(72, lines * 20 + 32), review: true, cell: column => ({ text: texts[column], muted: texts[column] === '—', caution: key === 'summary' && ['bettershot', 'glisio', 'screeen', 'screenmovie', 'recordly'].includes(products[column].id) }) });
  });
  fieldDefinitions.filter(field => field.group === 'general' && !excluded.has(field.key)).forEach(field => addField(field, 0));
  fieldGroups.filter(group => !group.parentKey && group.key !== 'general').forEach(group => addGroup(group, 0));
  if (!hidden('lastUpdatedAt') || !hidden('lastUpdatedVersion')) add({ id: 'lastUpdated', label: t('lastUpdated'), level: 0, height: 64, cell: column => ({ text: products[column].lastUpdatedAt || t('unknown'), secondary: products[column].lastUpdatedVersion ? t('version', { version: products[column].lastUpdatedVersion! }) : t('versionUnknown') }) });
  return { rows, totalHeight };
}
