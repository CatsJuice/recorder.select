export type PerformanceScenario = 'recording' | 'preview' | 'export';
export type PerformanceMetric = 'cpu' | 'memory';

export type BenchmarkSummary = {
  durationSeconds: number;
  averageCPUPercent: number;
  peakCPUPercent: number;
  averageSystemCPUPercent?: number;
  peakSystemCPUPercent?: number;
  averagePhysicalFootprintBytes: number;
  peakPhysicalFootprintBytes: number;
  averageSystemMemoryDeltaBytes?: number;
  peakSystemMemoryDeltaBytes?: number;
};

export type BenchmarkSample = {
  elapsedSeconds: number;
  cpuPercent: number;
  systemCPUPercent?: number;
  physicalFootprintBytes: number;
  systemMemoryDeltaBytes?: number;
};

export type BenchmarkRun = {
  scenario: PerformanceScenario;
  workloadLabel?: string;
  summary: BenchmarkSummary;
  samples: BenchmarkSample[];
};

export type PerformanceProfile = Partial<Record<PerformanceScenario, BenchmarkRun>>;
export type PerformanceProfiles = Record<string, PerformanceProfile>;

export const performanceMetricGroups: Partial<Record<string, { scenario: PerformanceScenario; metric: PerformanceMetric }>> = {
  performanceRecordingCPU: { scenario: 'recording', metric: 'cpu' },
  performanceRecordingMemory: { scenario: 'recording', metric: 'memory' },
  performancePreviewCPU: { scenario: 'preview', metric: 'cpu' },
  performancePreviewMemory: { scenario: 'preview', metric: 'memory' },
  performanceExportCPU: { scenario: 'export', metric: 'cpu' },
  performanceExportMemory: { scenario: 'export', metric: 'memory' },
};

type PerformanceField = {
  scenario: PerformanceScenario;
  value: (summary: BenchmarkSummary) => number | undefined;
  format: 'cpu' | 'memory' | 'duration';
};

export const performanceFields: Record<string, PerformanceField> = {
  recordingCpuAverage: { scenario: 'recording', value: (summary) => summary.averageSystemCPUPercent ?? summary.averageCPUPercent, format: 'cpu' },
  recordingCpuPeak: { scenario: 'recording', value: (summary) => summary.peakSystemCPUPercent ?? summary.peakCPUPercent, format: 'cpu' },
  recordingMemoryAverage: { scenario: 'recording', value: (summary) => summary.averageSystemMemoryDeltaBytes ?? summary.averagePhysicalFootprintBytes, format: 'memory' },
  recordingMemoryPeak: { scenario: 'recording', value: (summary) => summary.peakSystemMemoryDeltaBytes ?? summary.peakPhysicalFootprintBytes, format: 'memory' },
  previewCpuAverage: { scenario: 'preview', value: (summary) => summary.averageSystemCPUPercent ?? summary.averageCPUPercent, format: 'cpu' },
  previewCpuPeak: { scenario: 'preview', value: (summary) => summary.peakSystemCPUPercent ?? summary.peakCPUPercent, format: 'cpu' },
  previewMemoryAverage: { scenario: 'preview', value: (summary) => summary.averageSystemMemoryDeltaBytes ?? summary.averagePhysicalFootprintBytes, format: 'memory' },
  previewMemoryPeak: { scenario: 'preview', value: (summary) => summary.peakSystemMemoryDeltaBytes ?? summary.peakPhysicalFootprintBytes, format: 'memory' },
  exportCpuAverage: { scenario: 'export', value: (summary) => summary.averageSystemCPUPercent ?? summary.averageCPUPercent, format: 'cpu' },
  exportCpuPeak: { scenario: 'export', value: (summary) => summary.peakSystemCPUPercent ?? summary.peakCPUPercent, format: 'cpu' },
  exportMemoryAverage: { scenario: 'export', value: (summary) => summary.averageSystemMemoryDeltaBytes ?? summary.averagePhysicalFootprintBytes, format: 'memory' },
  exportMemoryPeak: { scenario: 'export', value: (summary) => summary.peakSystemMemoryDeltaBytes ?? summary.peakPhysicalFootprintBytes, format: 'memory' },
  exportDuration: { scenario: 'export', value: (summary) => summary.durationSeconds, format: 'duration' },
};

export const performanceValue = (profiles: PerformanceProfiles, recorderId: string, fieldKey: string) => {
  const field = performanceFields[fieldKey];
  const run = field ? profiles[recorderId]?.[field.scenario] : undefined;
  return field && run ? field.value(run.summary) : undefined;
};

export const performanceFieldMaximum = (profiles: PerformanceProfiles, fieldKey: string, recorderIds = Object.keys(profiles)) => {
  const values = recorderIds
    .map((recorderId) => performanceValue(profiles, recorderId, fieldKey))
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  return values.reduce((maximum, value) => Math.max(maximum, value), 0);
};

/** Use the same finite sample values for scaling, heat bands and drawing. */
export const performanceTimelinePoints = (run: BenchmarkRun, metric: PerformanceMetric): Array<readonly [number, number]> => {
  const systemValue = (sample: BenchmarkSample) => metric === 'cpu' ? sample.systemCPUPercent : sample.systemMemoryDeltaBytes;
  const hasSystem = run.samples.some(sample => Number.isFinite(systemValue(sample)));
  return run.samples.flatMap(sample => {
    const value = hasSystem ? systemValue(sample) : metric === 'cpu' ? sample.cpuPercent : sample.physicalFootprintBytes;
    return typeof value === 'number' && Number.isFinite(value) && Number.isFinite(sample.elapsedSeconds)
      ? [[sample.elapsedSeconds, Math.max(0, value)] as const] : [];
  });
};

export type PerformanceTimelineScale = { maximum: number; heatThresholds: readonly number[] };
const timelineScales = new WeakMap<PerformanceProfiles, Map<string, PerformanceTimelineScale>>();

/** Full-dataset quintiles, cached across filtering and expansion model rebuilds. */
export const performanceTimelineScale = (profiles: PerformanceProfiles, scenario: PerformanceScenario, metric: PerformanceMetric): PerformanceTimelineScale => {
  let scales = timelineScales.get(profiles);
  if (!scales) { scales = new Map(); timelineScales.set(profiles, scales); }
  const key = `${scenario}:${metric}`;
  const cached = scales.get(key);
  if (cached) return cached;
  const values = Object.values(profiles).flatMap(profile => {
    const run = profile[scenario];
    return run ? performanceTimelinePoints(run, metric).map(point => point[1]) : [];
  }).sort((a, b) => a - b);
  const maximum = values.at(-1) ?? 0;
  const minimum = values[0] ?? 0;
  // Repeated quantiles collapse into fewer bands; identical values keep one color.
  const boundaries = maximum > minimum ? [...new Set([.2, .4, .6, .8].map(fraction => {
    const position = (values.length - 1) * fraction;
    const lower = Math.floor(position);
    return values[lower] + (values[Math.ceil(position)] - values[lower]) * (position - lower);
  }))].filter(value => value > minimum && value < maximum) : [];
  const scale = { maximum, heatThresholds: boundaries.map(value => value / Math.max(maximum, 1)) };
  scales.set(key, scale);
  return scale;
};

export const performanceTimelineMaximum = (profiles: PerformanceProfiles, scenario: PerformanceScenario, metric: PerformanceMetric) =>
  performanceTimelineScale(profiles, scenario, metric).maximum;

export const formatPerformanceValue = (value: number, format: PerformanceField['format']) => {
  if (format === 'cpu') return `${value.toFixed(2)}%`;
  if (format === 'duration') return `${value.toFixed(2)} s`;
  return `${(value / 1024 ** 3).toFixed(2)} GiB`;
};

export async function loadPerformanceProfiles(): Promise<PerformanceProfiles> {
  const { generatedPerformanceProfiles } = await import('./performance-profiles.generated');
  return generatedPerformanceProfiles as unknown as PerformanceProfiles;
}
