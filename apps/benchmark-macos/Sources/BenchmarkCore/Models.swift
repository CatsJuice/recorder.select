import Foundation

public enum BenchmarkScenario: String, CaseIterable, Codable, Identifiable, Sendable {
    case recording
    case preview
    case export

    public var id: String { rawValue }

    public var title: String {
        switch self {
        case .recording: "Recording"
        case .preview: "Edit preview"
        case .export: "Export"
        }
    }
}

public struct ProcessIdentity: Hashable, Codable, Sendable {
    public let pid: Int32
    public let startTimeNanoseconds: UInt64

    public init(pid: Int32, startTimeNanoseconds: UInt64) {
        self.pid = pid
        self.startTimeNanoseconds = startTimeNanoseconds
    }
}

public struct ProcessMeasurement: Identifiable, Codable, Sendable {
    public var id: ProcessIdentity { identity }
    public let identity: ProcessIdentity
    public let parentPID: Int32
    public let name: String
    public let executablePath: String
    public let cpuTimeSeconds: Double
    public let physicalFootprintBytes: UInt64
    public let diskReadBytes: UInt64
    public let diskWrittenBytes: UInt64

    public init(
        identity: ProcessIdentity,
        parentPID: Int32,
        name: String,
        executablePath: String,
        cpuTimeSeconds: Double,
        physicalFootprintBytes: UInt64,
        diskReadBytes: UInt64,
        diskWrittenBytes: UInt64
    ) {
        self.identity = identity
        self.parentPID = parentPID
        self.name = name
        self.executablePath = executablePath
        self.cpuTimeSeconds = cpuTimeSeconds
        self.physicalFootprintBytes = physicalFootprintBytes
        self.diskReadBytes = diskReadBytes
        self.diskWrittenBytes = diskWrittenBytes
    }
}

public struct ProcessSample: Identifiable, Codable, Sendable {
    public var id: ProcessIdentity { process.identity }
    public let process: ProcessMeasurement
    public let cpuPercent: Double

    public init(process: ProcessMeasurement, cpuPercent: Double) {
        self.process = process
        self.cpuPercent = cpuPercent
    }
}

public struct BenchmarkSample: Codable, Sendable {
    public let elapsedSeconds: Double
    public let cpuPercent: Double
    public let systemCPUPercent: Double
    public let physicalFootprintBytes: UInt64
    public let diskReadBytes: UInt64
    public let diskWrittenBytes: UInt64
    public let processes: [ProcessSample]

    public init(
        elapsedSeconds: Double,
        cpuPercent: Double,
        systemCPUPercent: Double = 0,
        physicalFootprintBytes: UInt64,
        diskReadBytes: UInt64,
        diskWrittenBytes: UInt64,
        processes: [ProcessSample]
    ) {
        self.elapsedSeconds = elapsedSeconds
        self.cpuPercent = cpuPercent
        self.systemCPUPercent = systemCPUPercent
        self.physicalFootprintBytes = physicalFootprintBytes
        self.diskReadBytes = diskReadBytes
        self.diskWrittenBytes = diskWrittenBytes
        self.processes = processes
    }
}

public struct BenchmarkSummary: Codable, Equatable, Sendable {
    public let durationSeconds: Double
    public let averageCPUPercent: Double
    public let p95CPUPercent: Double
    public let peakCPUPercent: Double
    public let averageSystemCPUPercent: Double
    public let p95SystemCPUPercent: Double
    public let peakSystemCPUPercent: Double
    public let cpuTimeSeconds: Double
    public let averagePhysicalFootprintBytes: UInt64
    public let peakPhysicalFootprintBytes: UInt64
    public let physicalFootprintDeltaBytes: Int64
    public let peakProcessCount: Int
    public let diskReadBytes: UInt64
    public let diskWrittenBytes: UInt64
    public let realtimeFactor: Double?
}

public struct TargetApplication: Codable, Sendable {
    public let recorderID: String
    public let name: String
    public let bundleIdentifier: String?
    public let version: String?
    public let build: String?
    public let bundlePath: String

    public init(
        recorderID: String,
        name: String,
        bundleIdentifier: String?,
        version: String?,
        build: String?,
        bundlePath: String
    ) {
        self.recorderID = recorderID
        self.name = name
        self.bundleIdentifier = bundleIdentifier
        self.version = version
        self.build = build
        self.bundlePath = bundlePath
    }
}

public struct MachineMetadata: Codable, Sendable {
    public let model: String
    public let processor: String
    public let memoryBytes: UInt64
    public let logicalCoreCount: Int
    public let operatingSystem: String
    public let toolVersion: String

    public init(
        model: String,
        processor: String,
        memoryBytes: UInt64,
        logicalCoreCount: Int,
        operatingSystem: String,
        toolVersion: String
    ) {
        self.model = model
        self.processor = processor
        self.memoryBytes = memoryBytes
        self.logicalCoreCount = logicalCoreCount
        self.operatingSystem = operatingSystem
        self.toolVersion = toolVersion
    }
}

public struct BenchmarkResult: Codable, Sendable {
    public let schemaVersion: Int
    public let id: UUID
    public let scenario: BenchmarkScenario
    public let startedAt: Date
    public let endedAt: Date
    public let target: TargetApplication
    public let machine: MachineMetadata
    public let sampleIntervalSeconds: Double
    public let mediaDurationSeconds: Double?
    public let notes: String?
    public let summary: BenchmarkSummary
    public let samples: [BenchmarkSample]

    public init(
        id: UUID = UUID(),
        scenario: BenchmarkScenario,
        startedAt: Date,
        endedAt: Date,
        target: TargetApplication,
        machine: MachineMetadata,
        sampleIntervalSeconds: Double,
        mediaDurationSeconds: Double?,
        notes: String?,
        summary: BenchmarkSummary,
        samples: [BenchmarkSample]
    ) {
        self.schemaVersion = 2
        self.id = id
        self.scenario = scenario
        self.startedAt = startedAt
        self.endedAt = endedAt
        self.target = target
        self.machine = machine
        self.sampleIntervalSeconds = sampleIntervalSeconds
        self.mediaDurationSeconds = mediaDurationSeconds
        self.notes = notes
        self.summary = summary
        self.samples = samples
    }
}
