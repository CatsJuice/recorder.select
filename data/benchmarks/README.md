# Benchmark results

This directory is the versioned source of truth for RecorderBench exports.

Store runs as:

```text
<recorder-id>/<recorder-id>-<scenario>-<timestamp>.json
<recorder-id>/<recorder-id>-<scenario>-<timestamp>.csv
```

Don't hand-edit measured values. See `docs/BENCHMARK_PROTOCOL.md` before adding data.

The website exposes this directory through `public/data/benchmarks` and fetches
the full JSON files only when the Performance group is opened. Keep the source
files here rather than importing them into the application bundle.
