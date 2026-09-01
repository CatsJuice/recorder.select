# Benchmark data format

RecorderBench writes a canonical JSON document and an optional CSV timeline.

The JSON contains:

- `target`: recorder ID, app name, version, bundle identifier, and selected bundle path;
- `machine`: model, processor, memory, core count, operating system, and RecorderBench version;
- `scenario`: `recording`, `preview`, or `export`;
- `summary`: stable metrics intended for comparison views;
- `samples`: one aggregate timeline with the contributing process measurements.

CPU percentages use the Activity Monitor convention: 100% represents one fully occupied logical core. Physical footprint values and disk counters are bytes. Durations and CPU time are seconds.

The bundle path is useful for auditing process attribution but may reveal a local username when an app is outside `/Applications`. Review it before publishing.
