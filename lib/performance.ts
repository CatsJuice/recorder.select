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
};

export type BenchmarkSample = {
  elapsedSeconds: number;
  cpuPercent: number;
  systemCPUPercent?: number;
  physicalFootprintBytes: number;
};

export type BenchmarkRun = {
  scenario: PerformanceScenario;
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
  recordingCpuAverage: { scenario: 'recording', value: (summary) => summary.averageSystemCPUPercent, format: 'cpu' },
  recordingCpuPeak: { scenario: 'recording', value: (summary) => summary.peakSystemCPUPercent, format: 'cpu' },
  recordingMemoryAverage: { scenario: 'recording', value: (summary) => summary.averagePhysicalFootprintBytes, format: 'memory' },
  recordingMemoryPeak: { scenario: 'recording', value: (summary) => summary.peakPhysicalFootprintBytes, format: 'memory' },
  previewCpuAverage: { scenario: 'preview', value: (summary) => summary.averageSystemCPUPercent, format: 'cpu' },
  previewCpuPeak: { scenario: 'preview', value: (summary) => summary.peakSystemCPUPercent, format: 'cpu' },
  previewMemoryAverage: { scenario: 'preview', value: (summary) => summary.averagePhysicalFootprintBytes, format: 'memory' },
  previewMemoryPeak: { scenario: 'preview', value: (summary) => summary.peakPhysicalFootprintBytes, format: 'memory' },
  exportCpuAverage: { scenario: 'export', value: (summary) => summary.averageSystemCPUPercent, format: 'cpu' },
  exportCpuPeak: { scenario: 'export', value: (summary) => summary.peakSystemCPUPercent, format: 'cpu' },
  exportMemoryAverage: { scenario: 'export', value: (summary) => summary.averagePhysicalFootprintBytes, format: 'memory' },
  exportMemoryPeak: { scenario: 'export', value: (summary) => summary.peakPhysicalFootprintBytes, format: 'memory' },
  exportDuration: { scenario: 'export', value: (summary) => summary.durationSeconds, format: 'duration' },
};

export const performanceValue = (profiles: PerformanceProfiles, recorderId: string, fieldKey: string) => {
  const field = performanceFields[fieldKey];
  const run = field ? profiles[recorderId]?.[field.scenario] : undefined;
  return field && run ? field.value(run.summary) : undefined;
};

export const performanceFieldMaximum = (profiles: PerformanceProfiles, fieldKey: string) => {
  const values = Object.keys(profiles)
    .map((recorderId) => performanceValue(profiles, recorderId, fieldKey))
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  return values.length > 0 ? Math.max(...values) : 0;
};

export const performanceTimelineMaximum = (profiles: PerformanceProfiles, scenario: PerformanceScenario, metric: PerformanceMetric) => {
  const values = Object.keys(profiles).flatMap((recorderId) => profiles[recorderId]?.[scenario]?.samples.flatMap((sample) => {
    if (metric === 'memory') return [sample.physicalFootprintBytes];
    return typeof sample.systemCPUPercent === 'number' ? [sample.systemCPUPercent] : [];
  }) ?? []);
  return values.length > 0 ? Math.max(...values) : 0;
};

export const formatPerformanceValue = (value: number, format: PerformanceField['format']) => {
  if (format === 'cpu') return `${value.toFixed(2)}%`;
  if (format === 'duration') return `${value.toFixed(2)} s`;
  return `${(value / 1024 ** 3).toFixed(2)} GiB`;
};

export async function loadPerformanceProfiles(): Promise<PerformanceProfiles> {
  const { generatedPerformanceProfiles } = await import('./performance-profiles.generated');
  return generatedPerformanceProfiles as unknown as PerformanceProfiles;
}
