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

export const performanceTimelineMaximum = (profiles: PerformanceProfiles, scenario: PerformanceScenario, metric: PerformanceMetric) => {
  const values = Object.keys(profiles).flatMap((recorderId) => {
    const samples = profiles[recorderId]?.[scenario]?.samples ?? [];
    const hasSystemMetric = metric === 'memory'
      ? samples.some((sample) => typeof sample.systemMemoryDeltaBytes === 'number')
      : samples.some((sample) => typeof sample.systemCPUPercent === 'number');
    return samples.flatMap((sample) => {
      if (metric === 'memory') {
        if (!hasSystemMetric) return [sample.physicalFootprintBytes];
        return typeof sample.systemMemoryDeltaBytes === 'number' ? [sample.systemMemoryDeltaBytes] : [];
      }
      if (!hasSystemMetric) return [sample.cpuPercent];
      return typeof sample.systemCPUPercent === 'number' ? [sample.systemCPUPercent] : [];
    });
  });
  return values.reduce((maximum, value) => Math.max(maximum, value), 0);
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
