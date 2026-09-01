import AppKit
import BenchmarkCore
import Foundation

struct RunningApplicationTarget: Identifiable {
    let id: Int32
    let name: String
    let bundleIdentifier: String?
    let bundleURL: URL
    let icon: NSImage
}

@MainActor
final class BenchmarkViewModel: ObservableObject {
    static let toolVersion = "0.1.0"

    @Published var targetURL: URL?
    @Published var recorderID = ""
    @Published var scenario: BenchmarkScenario = .recording
    @Published var sampleIntervalSeconds = 1.0
    @Published var mediaDurationText = "60"
    @Published var notes = ""
    @Published private(set) var runningApplications: [RunningApplicationTarget] = []
    @Published private(set) var selectedRootPID: Int32?
    @Published private(set) var isRunning = false
    @Published private(set) var samples: [BenchmarkSample] = []
    @Published private(set) var latestProcesses: [ProcessSample] = []
    @Published private(set) var elapsedSeconds = 0.0
    @Published private(set) var totalCPUTimeSeconds = 0.0
    @Published private(set) var inaccessibleProcessCount = 0
    @Published private(set) var result: BenchmarkResult?
    @Published var message: String?

    private let sampler = ProcessSampler()
    private var timer: Timer?
    private var startedAt: Date?
    private var startInstant: ContinuousClock.Instant?
    private let clock = ContinuousClock()

    var targetName: String {
        guard let targetURL else { return "No app selected" }
        return bundle(at: targetURL)?.object(forInfoDictionaryKey: "CFBundleDisplayName") as? String
            ?? bundle(at: targetURL)?.object(forInfoDictionaryKey: "CFBundleName") as? String
            ?? targetURL.deletingPathExtension().lastPathComponent
    }

    var bundleIdentifier: String? {
        targetURL.flatMap { bundle(at: $0)?.bundleIdentifier }
    }

    var targetSubtitle: String {
        guard let targetURL else { return "Choose a running application" }
        let identifier = bundleIdentifier ?? targetURL.path
        guard let selectedRootPID else { return identifier }
        return "\(identifier) · PID \(selectedRootPID)"
    }

    var targetIcon: NSImage? {
        guard let selectedRootPID else { return nil }
        return runningApplications.first { $0.id == selectedRootPID }?.icon
    }

    var currentCPUPercent: Double { samples.last?.systemCPUPercent ?? 0 }
    var currentApplicationCPUPercent: Double { samples.last?.cpuPercent ?? 0 }
    var cpuTimelineScale: Double {
        let peak = samples.map(\.systemCPUPercent).max() ?? 0
        return max(100, ceil(peak / 100) * 100)
    }
    var currentFootprintBytes: UInt64 { samples.last?.physicalFootprintBytes ?? 0 }
    var peakFootprintBytes: UInt64 { samples.map(\.physicalFootprintBytes).max() ?? 0 }

    func refreshRunningApplications() {
        let ownPID = ProcessInfo.processInfo.processIdentifier
        let ownBundleIdentifier = Bundle.main.bundleIdentifier
        runningApplications = NSWorkspace.shared.runningApplications.compactMap { application in
            guard application.processIdentifier != ownPID,
                  application.bundleIdentifier != ownBundleIdentifier,
                  application.activationPolicy == .regular || application.activationPolicy == .accessory,
                  !application.isTerminated,
                  let bundleURL = application.bundleURL,
                  isTopLevelApplicationBundle(bundleURL) else { return nil }
            return RunningApplicationTarget(
                id: application.processIdentifier,
                name: application.localizedName ?? bundleURL.deletingPathExtension().lastPathComponent,
                bundleIdentifier: application.bundleIdentifier,
                bundleURL: bundleURL,
                icon: NSWorkspace.shared.icon(forFile: bundleURL.path)
            )
        }
        .sorted {
            let comparison = $0.name.localizedCaseInsensitiveCompare($1.name)
            return comparison == .orderedSame ? $0.id < $1.id : comparison == .orderedAscending
        }
    }

    private func isTopLevelApplicationBundle(_ bundleURL: URL) -> Bool {
        guard bundleURL.pathExtension.caseInsensitiveCompare("app") == .orderedSame else { return false }
        return !bundleURL.deletingLastPathComponent().pathComponents.contains { component in
            component.lowercased().hasSuffix(".app")
        }
    }

    func selectRunningApplication(_ application: RunningApplicationTarget) {
        guard !isRunning else { return }
        targetURL = application.bundleURL
        selectedRootPID = application.id
        recorderID = ResultExporter.slug(application.name)
        clearRun()
    }

    func activateTarget() {
        if let selectedRootPID,
           let application = NSRunningApplication(processIdentifier: selectedRootPID),
           !application.isTerminated {
            application.activate()
            return
        }
        guard let targetURL else { return }
        let configuration = NSWorkspace.OpenConfiguration()
        configuration.activates = true
        NSWorkspace.shared.openApplication(at: targetURL, configuration: configuration) { [weak self] _, error in
            Task { @MainActor in
                if let error { self?.message = "Could not launch the app: \(error.localizedDescription)" }
            }
        }
    }

    func start() {
        guard targetURL != nil, !isRunning else { return }
        let roots = rootPIDs()
        guard !roots.isEmpty else {
            message = "Launch \(targetName) before starting the benchmark."
            return
        }

        sampler.reset()
        samples = []
        latestProcesses = []
        result = nil
        totalCPUTimeSeconds = 0
        inaccessibleProcessCount = 0
        startedAt = Date()
        startInstant = clock.now
        elapsedSeconds = 0
        isRunning = true
        takeSample()

        timer = Timer.scheduledTimer(withTimeInterval: sampleIntervalSeconds, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.takeSample()
            }
        }
        RunLoop.main.add(timer!, forMode: .common)
    }

    func stop() {
        guard isRunning else { return }
        takeSample()
        timer?.invalidate()
        timer = nil
        isRunning = false

        guard let startedAt, let targetURL else { return }
        let endedAt = Date()
        let target = targetMetadata(url: targetURL)
        let mediaDuration = parsedMediaDuration
        let summary = BenchmarkSummarizer.summarize(
            samples: samples,
            durationSeconds: elapsedSeconds,
            totalCPUTimeSeconds: totalCPUTimeSeconds,
            mediaDurationSeconds: scenario == .export ? mediaDuration : nil
        )
        result = BenchmarkResult(
            scenario: scenario,
            startedAt: startedAt,
            endedAt: endedAt,
            target: target,
            machine: MachineMetadataReader.current(toolVersion: Self.toolVersion),
            sampleIntervalSeconds: sampleIntervalSeconds,
            mediaDurationSeconds: mediaDuration,
            notes: notes.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : notes,
            summary: summary,
            samples: samples
        )
    }

    func reset() {
        guard !isRunning else { return }
        clearRun()
    }

    func exportJSON() {
        guard let result else { return }
        let panel = NSSavePanel()
        panel.title = "Export benchmark result"
        panel.nameFieldStringValue = ResultExporter.suggestedBaseName(for: result) + ".json"
        panel.allowedContentTypes = [.json]
        guard panel.runModal() == .OK, let url = panel.url else { return }
        do {
            try ResultExporter.writeJSON(result, to: url)
            message = "Saved \(url.lastPathComponent)"
        } catch {
            message = "Export failed: \(error.localizedDescription)"
        }
    }

    func exportDatasetBundle() {
        guard let result else { return }
        let panel = NSOpenPanel()
        panel.title = "Choose the repository data/benchmarks directory"
        panel.prompt = "Export Dataset"
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.canCreateDirectories = true
        guard panel.runModal() == .OK, let directory = panel.url else { return }

        let recorderDirectory = directory.appendingPathComponent(ResultExporter.slug(result.target.recorderID), isDirectory: true)
        let baseName = ResultExporter.suggestedBaseName(for: result)
        do {
            try FileManager.default.createDirectory(at: recorderDirectory, withIntermediateDirectories: true)
            try ResultExporter.writeJSON(result, to: recorderDirectory.appendingPathComponent(baseName + ".json"))
            try ResultExporter.writeCSV(result, to: recorderDirectory.appendingPathComponent(baseName + ".csv"))
            message = "Dataset exported to \(recorderDirectory.path)"
        } catch {
            message = "Dataset export failed: \(error.localizedDescription)"
        }
    }

    private func takeSample() {
        guard isRunning, let targetURL, let startInstant else { return }
        let elapsed = seconds(from: startInstant, to: clock.now)
        let output = sampler.sample(
            rootPIDs: rootPIDs(),
            bundlePath: targetURL.path,
            elapsedSeconds: elapsed
        )
        elapsedSeconds = elapsed
        totalCPUTimeSeconds = output.totalCPUTimeSeconds
        inaccessibleProcessCount = output.inaccessibleProcessCount
        samples.append(output.sample)
        latestProcesses = output.sample.processes
    }

    private func rootPIDs() -> Set<Int32> {
        guard let selectedRootPID,
              let application = NSRunningApplication(processIdentifier: selectedRootPID),
              !application.isTerminated else { return [] }
        return [selectedRootPID]
    }

    private func targetMetadata(url: URL) -> TargetApplication {
        let targetBundle = bundle(at: url)
        return TargetApplication(
            recorderID: ResultExporter.slug(recorderID.isEmpty ? targetName : recorderID),
            name: targetName,
            bundleIdentifier: targetBundle?.bundleIdentifier,
            version: targetBundle?.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String,
            build: targetBundle?.object(forInfoDictionaryKey: "CFBundleVersion") as? String,
            bundlePath: url.path
        )
    }

    private var parsedMediaDuration: Double? {
        guard let value = Double(mediaDurationText), value > 0 else { return nil }
        return value
    }

    private func bundle(at url: URL) -> Bundle? { Bundle(url: url) }

    private func clearRun() {
        timer?.invalidate()
        timer = nil
        sampler.reset()
        samples = []
        latestProcesses = []
        elapsedSeconds = 0
        totalCPUTimeSeconds = 0
        inaccessibleProcessCount = 0
        result = nil
        isRunning = false
    }

    private func seconds(from start: ContinuousClock.Instant, to end: ContinuousClock.Instant) -> Double {
        let components = start.duration(to: end).components
        return Double(components.seconds) + Double(components.attoseconds) / 1e18
    }
}
