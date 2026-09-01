# Recorder Select

Recorder Select is an open comparison of screen-recording applications. The repository contains the comparison website, its curated static dataset, and **RecorderBench**, a native macOS tool for repeatable performance capture.

## Repository layout

```text
app/, components/, lib/       Comparison website
apps/benchmark-macos/         RecorderBench SwiftUI application
data/benchmarks/              Versioned benchmark result files
data/schema/                  Machine-readable dataset schemas
docs/                         Benchmark and release documentation
scripts/                      Build, signing, and notarization helpers
```

## RecorderBench

RecorderBench measures an application's complete process family, including Electron renderer, GPU, utility, capture, and helper processes. It records:

- aggregate CPU usage and total CPU time;
- physical memory footprint;
- logical disk reads and writes;
- process-level samples;
- scenario duration and export real-time factor;
- target app and machine metadata.

The app intentionally doesn't use the macOS App Sandbox because it needs read-only process metrics for other applications. It doesn't inject code, read another app's content, or send telemetry.

### Run from source

Requirements: macOS 14 or later and Xcode 16 or later.

Open the checked-in Xcode project and run the shared `RecorderBench` scheme:

```bash
open apps/benchmark-macos/RecorderBench.xcodeproj
```

No Apple Developer team is required for local development. The checked-in Debug configuration uses ad-hoc “Sign to Run Locally” signing and intentionally contains no `DEVELOPMENT_TEAM`. Don't select and commit a personal team; release credentials are injected by CI.

The companion `Package.swift` keeps the core library and tests usable from the command line:

```bash
swift test --package-path apps/benchmark-macos
```

When target membership changes, regenerate the checked-in project with XcodeGen 2.44 or later:

```bash
cd apps/benchmark-macos && xcodegen generate
```

Build an Xcode Archive and package a universal `.app` bundle:

```bash
scripts/build-macos-app.sh
open artifacts/RecorderBench.app
```

Launch the app you want to test, choose its running process in RecorderBench, and select Recording, Edit preview, or Export. Start and stop every capture manually so setup time is never included accidentally. After stopping, use **Export Dataset…** and choose this repository's `data/benchmarks` directory.

## Website

Requirements: Node.js 22.13 or later.

```bash
npm install
npm run dev
```

Production validation:

```bash
npm run lint
npm run build
```

## Benchmark data

Committed results live under:

```text
data/benchmarks/<recorder-id>/<run>.json
data/benchmarks/<recorder-id>/<run>.csv
```

JSON is the canonical result. CSV is a convenient timeline export. Before submitting results, follow [the benchmark protocol](docs/BENCHMARK_PROTOCOL.md) and validate files against [the schema](data/schema/benchmark-result.schema.json).

## Releases

Tags matching `v*` trigger the macOS release workflow. It builds a universal app, signs it with Developer ID, submits it to Apple for notarization, staples the ticket, and creates a GitHub Release with the ZIP and SHA-256 checksum. See [the release guide](docs/RELEASE.md) for required secrets and setup.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

Recorder Select and RecorderBench are available under the [MIT License](LICENSE).
