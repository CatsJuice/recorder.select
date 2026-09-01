import BenchmarkCore
import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var model: BenchmarkViewModel

    var body: some View {
        HStack(spacing: 0) {
            configurationPanel
                .frame(width: 310)
            Divider()
            dashboard
        }
        .background(Color(nsColor: .windowBackgroundColor))
        .alert("RecorderBench", isPresented: Binding(
            get: { model.message != nil },
            set: { if !$0 { model.message = nil } }
        )) {
            Button("OK") { model.message = nil }
        } message: {
            Text(model.message ?? "")
        }
        .onAppear(perform: model.refreshRunningApplications)
    }

    private var configurationPanel: some View {
        VStack(alignment: .leading, spacing: 22) {
            VStack(alignment: .leading, spacing: 5) {
                Label("RecorderBench", systemImage: "gauge.with.dots.needle.67percent")
                    .font(.title2.bold())
                Text("Repeatable macOS performance capture")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            VStack(alignment: .leading, spacing: 10) {
                sectionLabel("TARGET")
                GeometryReader { geometry in
                    HStack(spacing: 8) {
                        TargetApplicationPicker(
                            applications: model.runningApplications,
                            selectedProcessIdentifier: model.selectedRootPID,
                            isDisabled: model.isRunning,
                            onSelect: model.selectRunningApplication
                        )
                        .frame(width: max(0, geometry.size.width - 52))

                        Button(action: model.refreshRunningApplications) {
                            Image(systemName: "arrow.clockwise")
                                .font(.body.weight(.medium))
                                .frame(width: 44, height: 32)
                                .background(controlBackground)
                                .overlay(controlBorder)
                        }
                        .buttonStyle(.plain)
                        .frame(width: 44)
                        .help("Refresh running applications")
                        .disabled(model.isRunning)
                    }
                }
                .frame(height: 32)

                HStack {
                    TextField("recorder-id", text: $model.recorderID)
                        .textFieldStyle(.roundedBorder)
                        .disabled(model.isRunning)
                    Button("Show", action: model.activateTarget)
                        .disabled(model.targetURL == nil)
                }
            }

            VStack(alignment: .leading, spacing: 10) {
                sectionLabel("SCENARIO")
                Picker("Scenario", selection: $model.scenario) {
                    ForEach(BenchmarkScenario.allCases) { scenario in
                        Text(scenario.title).tag(scenario)
                    }
                }
                .pickerStyle(.segmented)
                .labelsHidden()
                .disabled(model.isRunning)

                LabeledContent("Source duration") {
                    HStack(spacing: 5) {
                        TextField("60", text: $model.mediaDurationText)
                            .frame(width: 58)
                            .textFieldStyle(.roundedBorder)
                        Text("sec").foregroundStyle(.secondary)
                    }
                }
                LabeledContent("Sample interval") {
                    Picker("Sample interval", selection: $model.sampleIntervalSeconds) {
                        Text("0.5 sec").tag(0.5)
                        Text("1 sec").tag(1.0)
                        Text("2 sec").tag(2.0)
                    }
                    .labelsHidden()
                    .frame(width: 95)
                }
                .disabled(model.isRunning)
            }

            VStack(alignment: .leading, spacing: 8) {
                sectionLabel("NOTES")
                TextEditor(text: $model.notes)
                    .font(.callout)
                    .scrollContentBackground(.hidden)
                    .padding(7)
                    .frame(height: 78)
                    .background(.quaternary.opacity(0.35), in: RoundedRectangle(cornerRadius: 8))
                    .disabled(model.isRunning)
            }

            Spacer()

            Button(action: { model.isRunning ? model.stop() : model.start() }) {
                Label(model.isRunning ? "Stop benchmark" : "Start benchmark", systemImage: model.isRunning ? "stop.fill" : "record.circle")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
            }
            .buttonStyle(.borderedProminent)
            .tint(model.isRunning ? .red : .accentColor)
            .controlSize(.large)
            .disabled(model.targetURL == nil)
        }
        .padding(22)
    }

    private var dashboard: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                VStack(alignment: .leading, spacing: 3) {
                    Text(model.scenario.title).font(.title2.bold())
                    Text(model.isRunning ? "Capturing the complete application process family" : statusSubtitle)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                if model.isRunning {
                    Label("LIVE", systemImage: "circle.fill")
                        .font(.caption.bold())
                        .foregroundStyle(.red)
                }
                Text(duration(model.elapsedSeconds))
                    .font(.system(.title3, design: .monospaced, weight: .semibold))
            }

            HStack(spacing: 12) {
                metricCard(
                    "SYSTEM CPU",
                    value: percent(model.currentCPUPercent),
                    detail: "App family \(percent(model.currentApplicationCPUPercent)) · \(String(format: "%.2f CPU sec", model.totalCPUTimeSeconds))",
                    color: .orange
                )
                metricCard("Memory", value: bytes(model.currentFootprintBytes), detail: "Peak \(bytes(model.peakFootprintBytes))", color: .blue)
                metricCard("Processes", value: "\(model.latestProcesses.count)", detail: "\(model.inaccessibleProcessCount) system processes unavailable", color: .purple)
            }

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("CPU timeline").font(.headline)
                    Spacer()
                    Text("\(Int(model.cpuTimelineScale))% scale · 100% = one logical core").font(.caption).foregroundStyle(.secondary)
                }
                Sparkline(values: model.samples.map(\.systemCPUPercent), maximum: model.cpuTimelineScale, color: .orange)
                    .frame(height: 105)
                    .padding(10)
                    .background(.quaternary.opacity(0.25), in: RoundedRectangle(cornerRadius: 10))
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Application process family").font(.headline)
                processTable
            }

            HStack {
                if let summary = model.result?.summary {
                    Text("Avg system CPU \(percent(summary.averageSystemCPUPercent)) · Peak memory \(bytes(summary.peakPhysicalFootprintBytes))")
                        .font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Button("Reset", action: model.reset)
                    .disabled(model.isRunning || model.samples.isEmpty)
                Button("Export JSON…", action: model.exportJSON)
                    .disabled(model.result == nil)
                Button("Export Dataset…", action: model.exportDatasetBundle)
                    .buttonStyle(.borderedProminent)
                    .disabled(model.result == nil)
            }
        }
        .padding(24)
    }

    private var processTable: some View {
        Table(model.latestProcesses) {
            TableColumn("Process") { item in
                VStack(alignment: .leading, spacing: 1) {
                    Text(item.process.name).lineLimit(1)
                    Text("PID \(item.process.identity.pid)").font(.caption2).foregroundStyle(.secondary)
                }
            }
            TableColumn("CPU") { item in
                Text(percent(item.cpuPercent)).monospacedDigit()
            }
            .width(75)
            TableColumn("Footprint") { item in
                Text(bytes(item.process.physicalFootprintBytes)).monospacedDigit()
            }
            .width(92)
        }
        .frame(minHeight: 165)
        .overlay {
            if model.latestProcesses.isEmpty {
                ContentUnavailableView("No samples yet", systemImage: "waveform.path.ecg", description: Text("Choose a running app, then start the benchmark manually."))
            }
        }
    }

    private var statusSubtitle: String {
        model.result == nil ? "Ready to capture" : "Capture complete — export the result"
    }

    private func metricCard(_ title: String, value: String, detail: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased()).font(.caption.bold()).foregroundStyle(.secondary)
            Text(value).font(.system(.title2, design: .rounded, weight: .bold)).foregroundStyle(color)
            Text(detail).font(.caption2).foregroundStyle(.secondary).lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(.quaternary.opacity(0.3), in: RoundedRectangle(cornerRadius: 12))
    }

    private func sectionLabel(_ text: String) -> some View {
        Text(text).font(.caption2.bold()).foregroundStyle(.secondary).tracking(0.8)
    }

    private func percent(_ value: Double) -> String { String(format: "%.1f%%", value) }

    private func bytes(_ value: UInt64) -> String {
        ByteCountFormatter.string(fromByteCount: Int64(min(value, UInt64(Int64.max))), countStyle: .memory)
    }

    private func duration(_ seconds: Double) -> String {
        let total = Int(seconds.rounded(.down))
        return String(format: "%02d:%02d", total / 60, total % 60)
    }

    private var controlBackground: some View {
        RoundedRectangle(cornerRadius: 8, style: .continuous)
            .fill(Color(nsColor: .controlBackgroundColor))
    }

    private var controlBorder: some View {
        RoundedRectangle(cornerRadius: 8, style: .continuous)
            .stroke(Color.primary.opacity(0.09), lineWidth: 1)
    }
}

private struct TargetApplicationPicker: View {
    let applications: [RunningApplicationTarget]
    let selectedProcessIdentifier: Int32?
    let isDisabled: Bool
    let onSelect: (RunningApplicationTarget) -> Void

    @State private var isPresented = false

    private var selectedApplication: RunningApplicationTarget? {
        applications.first { $0.id == selectedProcessIdentifier }
    }

    var body: some View {
        Button {
            isPresented.toggle()
        } label: {
            HStack(spacing: 8) {
                if let application = selectedApplication {
                    Image(nsImage: application.icon)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 18, height: 18)
                    Text(application.name)
                        .lineLimit(1)
                } else {
                    Image(systemName: "app.dashed")
                        .foregroundStyle(.secondary)
                        .frame(width: 18, height: 18)
                    Text("No app selected")
                }
                Spacer(minLength: 4)
                Image(systemName: "chevron.down")
                    .font(.caption.bold())
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 10)
            .frame(maxWidth: .infinity, minHeight: 32, maxHeight: 32)
            .background(controlBackground)
            .overlay(controlBorder)
            .contentShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(isDisabled)
        .popover(isPresented: $isPresented, arrowEdge: .bottom) {
            applicationList
        }
    }

    private var applicationList: some View {
        ScrollView {
            LazyVStack(spacing: 2) {
                if applications.isEmpty {
                    Text("No running applications")
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, minHeight: 44)
                } else {
                    ForEach(applications) { application in
                        Button {
                            onSelect(application)
                            isPresented = false
                        } label: {
                            HStack(spacing: 9) {
                                Image(nsImage: application.icon)
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                                    .frame(width: 22, height: 22)
                                Text(application.name)
                                    .lineLimit(1)
                                Spacer()
                                Text("PID \(application.id)")
                                    .font(.caption.monospacedDigit())
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.horizontal, 9)
                            .frame(height: 36)
                            .background(
                                selectedProcessIdentifier == application.id
                                    ? Color.accentColor.opacity(0.15)
                                    : Color.clear,
                                in: RoundedRectangle(cornerRadius: 6)
                            )
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(6)
        }
        .frame(width: 290, height: max(56, min(CGFloat(applications.count) * 38 + 12, 320)))
    }

    private var controlBackground: some View {
        RoundedRectangle(cornerRadius: 8, style: .continuous)
            .fill(Color(nsColor: .controlBackgroundColor))
    }

    private var controlBorder: some View {
        RoundedRectangle(cornerRadius: 8, style: .continuous)
            .stroke(Color.primary.opacity(0.09), lineWidth: 1)
    }
}

private struct Sparkline: View {
    let values: [Double]
    let maximum: Double
    let color: Color

    var body: some View {
        Canvas { context, size in
            guard values.count > 1, maximum > 0 else { return }
            var path = Path()
            for (index, value) in values.enumerated() {
                let x = size.width * CGFloat(index) / CGFloat(values.count - 1)
                let normalizedValue = min(max(value / maximum, 0), 1)
                let y = size.height * (1 - CGFloat(normalizedValue))
                if index == 0 { path.move(to: CGPoint(x: x, y: y)) }
                else { path.addLine(to: CGPoint(x: x, y: y)) }
            }
            context.stroke(path, with: .color(color), lineWidth: 2)
        }
        .accessibilityLabel("CPU usage timeline")
    }
}
