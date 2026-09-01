import Testing
import Darwin
import Foundation
@testable import BenchmarkCore

@Test func summaryUsesCoreEquivalentCPUAndRealtimeFactor() {
    let samples = [
        sample(elapsed: 0, cpu: 0, systemCPU: 0, footprint: 100),
        sample(elapsed: 1, cpu: 200, systemCPU: 900, footprint: 140),
        sample(elapsed: 2, cpu: 100, systemCPU: 450, footprint: 120),
    ]

    let summary = BenchmarkSummarizer.summarize(
        samples: samples,
        durationSeconds: 2,
        totalCPUTimeSeconds: 3,
        mediaDurationSeconds: 8
    )

    #expect(summary.averageCPUPercent == 150)
    #expect(summary.p95CPUPercent == 200)
    #expect(summary.averageSystemCPUPercent == 675)
    #expect(summary.p95SystemCPUPercent == 900)
    #expect(summary.peakSystemCPUPercent == 900)
    #expect(summary.averagePhysicalFootprintBytes == 120)
    #expect(summary.peakPhysicalFootprintBytes == 140)
    #expect(summary.physicalFootprintDeltaBytes == 20)
    #expect(summary.realtimeFactor == 0.25)
}

@Test func summaryPreservesLargeAveragePhysicalFootprintWhenEncoded() throws {
    let samples = [
        sample(elapsed: 0, cpu: 0, footprint: 4_999_344_992),
        sample(elapsed: 1, cpu: 10, footprint: 10_120_720_960),
        sample(elapsed: 2, cpu: 5, footprint: 5_045_938_568),
    ]

    let summary = BenchmarkSummarizer.summarize(
        samples: samples,
        durationSeconds: 2,
        totalCPUTimeSeconds: 0.15,
        mediaDurationSeconds: 60
    )
    let encoded = try JSONEncoder().encode(summary)
    let decoded = try JSONDecoder().decode(BenchmarkSummary.self, from: encoded)

    #expect(summary.averagePhysicalFootprintBytes == 6_722_001_507)
    #expect(decoded.averagePhysicalFootprintBytes == 6_722_001_507)
}

@Test func processResolverIncludesDescendantsAndBundleHelpers() {
    let root = process(pid: 10, parent: 1, path: "/Applications/Test.app/Contents/MacOS/Test")
    let child = process(pid: 11, parent: 10, path: "/usr/local/bin/ffmpeg")
    let helper = process(pid: 12, parent: 1, path: "/Applications/Test.app/Contents/Frameworks/Test Helper.app/Contents/MacOS/Test Helper")
    let unrelated = process(pid: 13, parent: 1, path: "/Applications/Other.app/Contents/MacOS/Other")

    let result = ProcessFamilyResolver.includedIdentities(
        processes: [root, child, helper, unrelated],
        rootPIDs: [10],
        bundlePath: "/Applications/Test.app"
    )

    #expect(result == [root.identity, child.identity, helper.identity])
}

@Test func samplerReadsTheCurrentProcess() {
    let sampler = ProcessSampler()
    let rootPID = getpid()
    _ = sampler.sample(rootPIDs: [rootPID], bundlePath: "", elapsedSeconds: 0)
    usleep(20_000)
    let output = sampler.sample(rootPIDs: [rootPID], bundlePath: "", elapsedSeconds: 0.02)

    #expect(output.sample.processes.contains { $0.process.identity.pid == rootPID })
    #expect(output.sample.physicalFootprintBytes > 0)
}

@Test func hostCPUIsReportedInOneLogicalCoreEquivalents() {
    let previous = HostCPUCounters(user: 100, system: 100, idle: 800, nice: 0)
    let current = HostCPUCounters(user: 150, system: 150, idle: 900, nice: 0)

    let percent = ProcessSampler.normalizedHostCPUPercent(
        previous: previous,
        current: current,
        logicalCoreCount: 18
    )

    #expect(percent == 900)
}

private func sample(elapsed: Double, cpu: Double, systemCPU: Double = 0, footprint: UInt64) -> BenchmarkSample {
    BenchmarkSample(
        elapsedSeconds: elapsed,
        cpuPercent: cpu,
        systemCPUPercent: systemCPU,
        physicalFootprintBytes: footprint,
        diskReadBytes: 0,
        diskWrittenBytes: 0,
        processes: []
    )
}

private func process(pid: Int32, parent: Int32, path: String) -> ProcessMeasurement {
    ProcessMeasurement(
        identity: ProcessIdentity(pid: pid, startTimeNanoseconds: UInt64(pid)),
        parentPID: parent,
        name: "P\(pid)",
        executablePath: path,
        cpuTimeSeconds: 0,
        physicalFootprintBytes: 0,
        diskReadBytes: 0,
        diskWrittenBytes: 0
    )
}
