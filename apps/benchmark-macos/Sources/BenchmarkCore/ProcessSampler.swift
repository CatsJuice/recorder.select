import Darwin
import Foundation

public struct SamplingOutput: Sendable {
    public let sample: BenchmarkSample
    public let totalCPUTimeSeconds: Double
    public let inaccessibleProcessCount: Int
}

struct HostCPUCounters: Equatable, Sendable {
    let user: UInt64
    let system: UInt64
    let idle: UInt64
    let nice: UInt64
}

public final class ProcessSampler {
    private struct PreviousCounters {
        let cpuTimeSeconds: Double
        let diskReadBytes: UInt64
        let diskWrittenBytes: UInt64
        let sampledAt: ContinuousClock.Instant
    }

    private var previousCounters: [ProcessIdentity: PreviousCounters] = [:]
    private var previouslyIncluded: Set<ProcessIdentity> = []
    private var cumulativeCPUTimeSeconds = 0.0
    private var cumulativeDiskReadBytes: UInt64 = 0
    private var cumulativeDiskWrittenBytes: UInt64 = 0
    private var previousHostCPUCounters: HostCPUCounters?
    private let clock = ContinuousClock()

    public init() {}

    public func reset() {
        previousCounters.removeAll(keepingCapacity: true)
        previouslyIncluded.removeAll(keepingCapacity: true)
        cumulativeCPUTimeSeconds = 0
        cumulativeDiskReadBytes = 0
        cumulativeDiskWrittenBytes = 0
        previousHostCPUCounters = nil
    }

    public func sample(
        rootPIDs: Set<Int32>,
        bundlePath: String,
        elapsedSeconds: Double
    ) -> SamplingOutput {
        let now = clock.now
        let hostCPUCounters = Self.readHostCPUCounters()
        let systemCPUPercent: Double
        if let previousHostCPUCounters, let hostCPUCounters {
            systemCPUPercent = Self.normalizedHostCPUPercent(
                previous: previousHostCPUCounters,
                current: hostCPUCounters,
                logicalCoreCount: ProcessInfo.processInfo.activeProcessorCount
            )
        } else {
            systemCPUPercent = 0
        }
        previousHostCPUCounters = hostCPUCounters

        let inventory = Self.readAllProcesses()
        let identities = ProcessFamilyResolver.includedIdentities(
            processes: inventory.processes,
            rootPIDs: rootPIDs,
            bundlePath: bundlePath,
            previouslyIncluded: previouslyIncluded
        )
        previouslyIncluded.formUnion(identities)

        var processSamples: [ProcessSample] = []
        var nextCounters: [ProcessIdentity: PreviousCounters] = [:]
        var footprint: UInt64 = 0

        for process in inventory.processes where identities.contains(process.identity) {
            let previous = previousCounters[process.identity]
            var cpuPercent = 0.0

            if let previous {
                let wallSeconds = seconds(from: previous.sampledAt, to: now)
                let cpuDelta = max(0, process.cpuTimeSeconds - previous.cpuTimeSeconds)
                if wallSeconds > 0 {
                    cpuPercent = cpuDelta / wallSeconds * 100
                }
                cumulativeCPUTimeSeconds += cpuDelta
                cumulativeDiskReadBytes &+= nonnegativeDelta(process.diskReadBytes, previous.diskReadBytes)
                cumulativeDiskWrittenBytes &+= nonnegativeDelta(process.diskWrittenBytes, previous.diskWrittenBytes)
            }

            nextCounters[process.identity] = PreviousCounters(
                cpuTimeSeconds: process.cpuTimeSeconds,
                diskReadBytes: process.diskReadBytes,
                diskWrittenBytes: process.diskWrittenBytes,
                sampledAt: now
            )
            footprint &+= process.physicalFootprintBytes
            processSamples.append(ProcessSample(process: process, cpuPercent: cpuPercent))
        }

        previousCounters = nextCounters
        processSamples.sort {
            if $0.cpuPercent == $1.cpuPercent { return $0.process.name < $1.process.name }
            return $0.cpuPercent > $1.cpuPercent
        }

        return SamplingOutput(
            sample: BenchmarkSample(
                elapsedSeconds: elapsedSeconds,
                cpuPercent: processSamples.reduce(0) { $0 + $1.cpuPercent },
                systemCPUPercent: systemCPUPercent,
                physicalFootprintBytes: footprint,
                diskReadBytes: cumulativeDiskReadBytes,
                diskWrittenBytes: cumulativeDiskWrittenBytes,
                processes: processSamples
            ),
            totalCPUTimeSeconds: cumulativeCPUTimeSeconds,
            inaccessibleProcessCount: inventory.inaccessibleCount
        )
    }

    static func normalizedHostCPUPercent(
        previous: HostCPUCounters,
        current: HostCPUCounters,
        logicalCoreCount: Int
    ) -> Double {
        let user = tickDelta(current.user, previous.user)
        let system = tickDelta(current.system, previous.system)
        let nice = tickDelta(current.nice, previous.nice)
        let idle = tickDelta(current.idle, previous.idle)
        let busy = user + system + nice
        let total = busy + idle
        guard total > 0 else { return 0 }
        return Double(busy) / Double(total) * Double(max(logicalCoreCount, 1)) * 100
    }

    private static func readHostCPUCounters() -> HostCPUCounters? {
        var load = host_cpu_load_info()
        var count = mach_msg_type_number_t(
            MemoryLayout<host_cpu_load_info_data_t>.size / MemoryLayout<integer_t>.size
        )
        let result = withUnsafeMutablePointer(to: &load) { pointer in
            pointer.withMemoryRebound(to: integer_t.self, capacity: Int(count)) { rebound in
                host_statistics(mach_host_self(), HOST_CPU_LOAD_INFO, rebound, &count)
            }
        }
        guard result == KERN_SUCCESS else { return nil }
        return HostCPUCounters(
            user: UInt64(load.cpu_ticks.0),
            system: UInt64(load.cpu_ticks.1),
            idle: UInt64(load.cpu_ticks.2),
            nice: UInt64(load.cpu_ticks.3)
        )
    }

    private static func tickDelta(_ current: UInt64, _ previous: UInt64) -> UInt64 {
        guard current < previous else { return current - previous }
        return UInt64(UInt32.max) - previous + current + 1
    }

    private static func readAllProcesses() -> (processes: [ProcessMeasurement], inaccessibleCount: Int) {
        let estimatedCount = max(proc_listallpids(nil, 0), 256)
        var pids = [pid_t](repeating: 0, count: Int(estimatedCount) + 128)
        let bytes = Int32(pids.count * MemoryLayout<pid_t>.stride)
        let count = pids.withUnsafeMutableBytes { buffer in
            proc_listallpids(buffer.baseAddress, bytes)
        }
        guard count > 0 else { return ([], 0) }

        var processes: [ProcessMeasurement] = []
        var inaccessibleCount = 0
        processes.reserveCapacity(Int(count))

        for pid in pids.prefix(Int(count)) where pid > 0 {
            if let process = readProcess(pid: pid) {
                processes.append(process)
            } else {
                inaccessibleCount += 1
            }
        }
        return (processes, inaccessibleCount)
    }

    private static func readProcess(pid: pid_t) -> ProcessMeasurement? {
        var bsdInfo = proc_bsdinfo()
        let bsdSize = Int32(MemoryLayout<proc_bsdinfo>.stride)
        let bsdResult = withUnsafeMutablePointer(to: &bsdInfo) { pointer in
            proc_pidinfo(pid, PROC_PIDTBSDINFO, 0, pointer, bsdSize)
        }
        guard bsdResult == bsdSize else { return nil }

        var usage = rusage_info_v4()
        let usageResult = withUnsafeMutablePointer(to: &usage) { usagePointer in
            // rusage_info_t is a C void pointer typedef. The imported signature
            // looks like a pointer-to-pointer, but the API writes the structure
            // directly into this storage.
            usagePointer.withMemoryRebound(to: UnsafeMutableRawPointer?.self, capacity: 1) { rebound in
                proc_pid_rusage(pid, RUSAGE_INFO_V4, rebound)
            }
        }
        guard usageResult == 0 else { return nil }

        return ProcessMeasurement(
            identity: ProcessIdentity(pid: pid, startTimeNanoseconds: usage.ri_proc_start_abstime),
            parentPID: Int32(bsdInfo.pbi_ppid),
            name: processName(pid: pid),
            executablePath: processPath(pid: pid),
            cpuTimeSeconds: Double(usage.ri_user_time &+ usage.ri_system_time) / 1_000_000_000,
            physicalFootprintBytes: usage.ri_phys_footprint,
            diskReadBytes: usage.ri_diskio_bytesread,
            diskWrittenBytes: usage.ri_diskio_byteswritten
        )
    }

    private static func processName(pid: pid_t) -> String {
        var buffer = [CChar](repeating: 0, count: 1_024)
        let length = buffer.withUnsafeMutableBytes { rawBuffer in
            proc_name(pid, rawBuffer.baseAddress, UInt32(rawBuffer.count))
        }
        guard length > 0 else { return "PID \(pid)" }
        return decodeCString(buffer)
    }

    private static func processPath(pid: pid_t) -> String {
        // PROC_PIDPATHINFO_MAXSIZE is a C macro that Swift can't import.
        var buffer = [CChar](repeating: 0, count: 4_096)
        let length = buffer.withUnsafeMutableBytes { rawBuffer in
            proc_pidpath(pid, rawBuffer.baseAddress, UInt32(rawBuffer.count))
        }
        guard length > 0 else { return "" }
        return decodeCString(buffer)
    }

    private static func decodeCString(_ buffer: [CChar]) -> String {
        let bytes = buffer.prefix { $0 != 0 }.map { UInt8(bitPattern: $0) }
        return String(decoding: bytes, as: UTF8.self)
    }

    private func seconds(from start: ContinuousClock.Instant, to end: ContinuousClock.Instant) -> Double {
        let duration = start.duration(to: end)
        let components = duration.components
        return Double(components.seconds) + Double(components.attoseconds) / 1e18
    }

    private func nonnegativeDelta(_ current: UInt64, _ previous: UInt64) -> UInt64 {
        current >= previous ? current - previous : 0
    }
}
