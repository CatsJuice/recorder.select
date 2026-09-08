import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sources = {
  'screen-studio': {
    recording: 'data/benchmarks/screen-studio/screen-studio-recording-2026-09-01-181600.json',
    preview: 'data/benchmarks/screen-studio/screen-studio-preview-2026-09-01-181715.json',
    export: 'data/benchmarks/screen-studio/screen-studio-export-2026-09-01-181836.json',
  },
  shotbase: {
    recording: 'data/benchmarks/shotbase/shotbase-recording-2026-09-01-181014.json',
    preview: 'data/benchmarks/shotbase/shotbase-preview-2026-09-01-181137.json',
    export: 'data/benchmarks/shotbase/shotbase-export-2026-09-01-181349.json',
  },
  screencam: {
    recording: 'data/benchmarks/screencam/screencam-recording-2026-09-01-185319.json',
    preview: 'data/benchmarks/screencam/screencam-preview-2026-09-01-185432.json',
    export: 'data/benchmarks/screencam/screencam-export-2026-09-01-185614.json',
  },
  'screen-sage-pro': {
    recording: 'data/benchmarks/screensage-pro/screensage-pro-recording-2026-09-01-200500.json',
    preview: 'data/benchmarks/screensage-pro/screensage-pro-preview-2026-09-01-200622.json',
  },
  screencharm: {
    recording: 'data/benchmarks/screencharm/screen-charm-recording-2026-09-02-120229.json',
    preview: 'data/benchmarks/screencharm/screen-charm-preview-2026-09-02-120410.json',
  },
  prequel: {
    recording: 'data/benchmarks/prequel/prequel-recording-2026-09-02-135349.json',
    preview: 'data/benchmarks/prequel/prequel-preview-2026-09-02-135505.json',
    export: 'data/benchmarks/prequel/prequel-export-2026-09-02-135728.json',
  },
  kapture: {
    recording: 'data/benchmarks/kapture/kapture-recording-2026-09-02-153128.json',
    preview: 'data/benchmarks/kapture/kapture-preview-2026-09-02-153527.json',
  },
  'screen-glide': {
    recording: 'data/benchmarks/screen-glide/screen-glide-recording-2026-09-02-184726.json',
    preview: 'data/benchmarks/screen-glide/screen-glide-preview-2026-09-02-184854.json',
  },
  smoothcapture: {
    recording: 'data/benchmarks/smoothcapture/smoothcapture-recording-2026-09-02-200228.json',
    preview: 'data/benchmarks/smoothcapture/smoothcapture-preview-2026-09-02-200346.json',
  },
  screenkite: {
    recording: 'data/benchmarks/screenkite/screenkite-recording-2026-09-02-213853.json',
    preview: 'data/benchmarks/screenkite/screenkite-preview-2026-09-02-214009.json',
    export: 'data/benchmarks/screenkite/screenkite-export-2026-09-02-214246.json',
  },
  screenflare: {
    recording: 'data/benchmarks/screenflare/screenflare-recording-2026-09-04-100456.json',
    preview: 'data/benchmarks/screenflare/screenflare-preview-2026-09-04-100630.json',
    export: 'data/benchmarks/screenflare/screenflare-export-2026-09-04-100800.json',
  },
};

sources.matte = {
  recording: 'data/benchmarks/matte/matte-recording-2026-09-04-105310.json',
  preview: 'data/benchmarks/matte/matte-preview-2026-09-04-111251.json',
  export: 'data/benchmarks/matte/matte-export-2026-09-04-111447.json',
};

sources.bettershot = {
  recording: 'data/benchmarks/bettershot/bettershot-recording-2026-09-04-114936.json',
  preview: 'data/benchmarks/bettershot/bettershot-preview-2026-09-04-115124.json',
  export: 'data/benchmarks/bettershot/bettershot-export-2026-09-04-115309.json',
};

sources.screendrop = {
  export: 'data/benchmarks/screendrop/screendrop-export-2026-09-04-132212.json',
  preview: 'data/benchmarks/screendrop/screendrop-preview-2026-09-04-132027.json',
  recording: 'data/benchmarks/screendrop/screendrop-recording-2026-09-04-131743.json',
};

sources.minshot = {
  recording: 'data/benchmarks/minshot/minshot-recording-2026-09-04-141030.json',
  preview: 'data/benchmarks/minshot/minshot-preview-2026-09-04-141337.json',
  export: 'data/benchmarks/minshot/minshot-export-2026-09-04-141455.json',
};

sources.openscreen = {
  preview: 'data/benchmarks/openscreen/openscreen-preview-2026-09-04-155612.json',
  export: 'data/benchmarks/openscreen/openscreen-export-2026-09-04-160520.json',
};

sources.recordly = {
  recording: 'data/benchmarks/recordly/recordly-recording-2026-09-04-163558.json',
  preview: 'data/benchmarks/recordly/recordly-preview-2026-09-04-163721.json',
};

sources.cap = {
  "export": "data/benchmarks/cap/cap-export-2026-09-04-170623.json",
  "preview": "data/benchmarks/cap/cap-preview-2026-09-04-170437.json",
  "recording": "data/benchmarks/cap/cap-recording-2026-09-04-170247.json"
};

sources['cleanshot-x'] = {
  recording: 'data/benchmarks/cleanshot-x/cleanshot-x-recording-2026-09-06-231745.json',
  preview: 'data/benchmarks/cleanshot-x/cleanshot-x-preview-2026-09-06-231931.json',
  export: 'data/benchmarks/cleanshot-x/cleanshot-x-export-2026-09-06-232117.json',
};

sources.focusee = {
  recording: 'data/benchmarks/focusee/focusee-recording-2026-09-08-195055.json',
  preview: 'data/benchmarks/focusee/focusee-preview-2026-09-08-195232.json',
  export: 'data/benchmarks/focusee/focusee-export-2026-09-08-195431.json',
};

sources.snapzy = {
  recording: 'data/benchmarks/snapzy/snapzy-recording-2026-09-08-204200.json',
  preview: 'data/benchmarks/snapzy/snapzy-preview-2026-09-08-203932.json',
  export: 'data/benchmarks/snapzy/snapzy-export-2026-09-08-204909.json',
};

sources['creavit-studio'] = {
  recording: 'data/benchmarks/creavit-studio/creavit-studio-recording-2026-09-08-220642.json',
  preview: 'data/benchmarks/creavit-studio/creavit-studio-preview-2026-09-08-220819.json',
  export: 'data/benchmarks/creavit-studio/creavit-studio-export-2026-09-08-220951.json',
};

const workloadLabelFor = (recorderId, scenario) => recorderId === 'creavit-studio'
  ? scenario === 'export' ? '1080p 60fps social' : '5K'
  : scenario === 'export'
  ? ['bettershot', 'screendrop', 'minshot', 'openscreen', 'cap', 'cleanshot-x', 'focusee', 'snapzy'].includes(recorderId) ? 'Export settings unspecified' : ['screenflare', 'matte'].includes(recorderId) ? '1080p 60fps' : '1080p 60fps balance'
  : '5K';

// Anomalies belong to a specific measurement, not every future run of the app.
const outlierFieldsBySource = {
  'data/benchmarks/bettershot/bettershot-export-2026-09-04-115309.json': ['exportDuration'],
  'data/benchmarks/screendrop/screendrop-export-2026-09-04-132212.json': ['exportDuration'],
};

const profiles = Object.fromEntries(await Promise.all(Object.entries(sources).map(async ([recorderId, scenarios]) => {
  const runs = await Promise.all(Object.entries(scenarios).map(async ([scenario, source]) => {
    const raw = JSON.parse(await readFile(resolve(root, source), 'utf8'));
    if (raw.scenario !== scenario) throw new Error(`Expected ${scenario} in ${source}`);
    return [scenario, {
      scenario: raw.scenario,
      workloadLabel: workloadLabelFor(recorderId, scenario),
      ...(outlierFieldsBySource[source] ? { outlierFields: outlierFieldsBySource[source] } : {}),
      summary: {
        durationSeconds: raw.summary.durationSeconds,
        averageCPUPercent: raw.summary.averageCPUPercent,
        peakCPUPercent: raw.summary.peakCPUPercent,
        averageSystemCPUPercent: raw.summary.averageSystemCPUPercent,
        peakSystemCPUPercent: raw.summary.peakSystemCPUPercent,
        averagePhysicalFootprintBytes: raw.summary.averagePhysicalFootprintBytes,
        peakPhysicalFootprintBytes: raw.summary.peakPhysicalFootprintBytes,
        averageSystemMemoryDeltaBytes: raw.summary.averageSystemMemoryDeltaBytes,
        peakSystemMemoryDeltaBytes: raw.summary.peakSystemMemoryDeltaBytes,
      },
      samples: raw.samples.map(({ elapsedSeconds, cpuPercent, systemCPUPercent, physicalFootprintBytes, systemMemoryDeltaBytes }) => ({
        elapsedSeconds,
        cpuPercent,
        systemCPUPercent,
        physicalFootprintBytes,
        systemMemoryDeltaBytes,
      })),
    }];
  }));
  return [recorderId, Object.fromEntries(runs)];
})));

const output = `// Generated by scripts/generate-performance-profiles.mjs. Do not edit manually.\nexport const generatedPerformanceProfiles = ${JSON.stringify(profiles)} as const;\n`;
await writeFile(resolve(root, 'lib/performance-profiles.generated.ts'), output);

// Scores and filters need summaries immediately; chart samples load on expansion.
const summaries = Object.fromEntries(Object.entries(profiles).map(([id, scenarios]) => [id,
  Object.fromEntries(Object.entries(scenarios).map(([scenario, run]) => [scenario, { ...run, samples: [] }])),
]));
await writeFile(resolve(root, 'lib/performance-summaries.generated.ts'),
  `// Generated by scripts/generate-performance-profiles.mjs. Do not edit manually.\nexport const generatedPerformanceSummaries = ${JSON.stringify(summaries)} as const;\n`);
