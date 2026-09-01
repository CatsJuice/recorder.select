# Benchmark protocol

This protocol keeps results comparable while making it practical to test many applications.

## Environment

- Use the same Mac for direct comparisons.
- Record the macOS and app versions automatically through RecorderBench.
- Connect power, disable Low Power Mode, and keep the same display resolution and refresh rate.
- Close unrelated foreground applications and pause indexing, backups, and downloads.
- Let the machine return to a normal thermal state between products.
- Randomize product order when comparing more than two applications.

## Workloads

Use one deterministic project and keep resolution, frame rate, codecs, bitrate or quality, audio settings, hardware acceleration, preview quality, effects, and cache state fixed.

RecorderBench reports two CPU measurements. **System CPU** is the primary comparison metric and includes the full machine workload caused by the scenario, including shared capture and codec services. **App-family CPU** is diagnostic attribution for the selected app and its discoverable helpers. Both use Activity Monitor-style units where 100% equals one fully occupied logical core.

### Recording

Capture the same 60-second scripted screen workload. Report average and P95 CPU, CPU seconds, peak physical footprint, output duration, and dropped frames when the product exposes them.

### Edit preview

Play the same timeline for 60 seconds. Keep warm-cache and cold-cache runs separate. Report average and P95 CPU, CPU seconds, peak physical footprint, dropped frames, and visible playback failures.

### Export

Start measurement immediately before confirming export and stop only after the app reports completion and the output file stops growing. Report wall time, real-time factor, CPU seconds, peak physical footprint, output size, and output validity.

## Fast screening

For a large product set, perform one warm-up and one measured run. Repeat three measured runs when:

- two products differ by less than 10%;
- a run contains an unexplained spike;
- the result conflicts with visible behavior; or
- the product enters the final recommendation set.

Use the median for repeated runs. Treat differences below 5% as effectively tied unless repeated evidence shows otherwise.

## Process attribution

RecorderBench includes the selected app's root process, recursively spawned children, previously observed descendants that become reparented, and executables inside the selected `.app` bundle. Identity combines PID and process creation time so PID reuse doesn't merge unrelated processes.

Select the already-running root application from RecorderBench's process menu. Begin capture only when the scenario is ready, and stop it manually when the scenario completes. RecorderBench never stops a capture automatically.

Shared system services such as WindowServer, ScreenCaptureKit services, VideoToolbox services, and coreaudiod cannot be reliably assigned to one app process family. RecorderBench therefore captures total system CPU separately and uses it as the primary CPU comparison. Keep the machine idle except for the workload so unrelated activity does not contaminate this measurement. The app-family value remains useful for diagnosis, but must not be presented as total recording cost.

## Review before publishing

- Confirm the app version and machine metadata.
- Confirm the expected Electron/Chromium helpers appear in process samples.
- Confirm export codec, duration, frame rate, and visual quality.
- Remove private notes and local paths if necessary.
- Never merge runs from different workload definitions into one aggregate.
