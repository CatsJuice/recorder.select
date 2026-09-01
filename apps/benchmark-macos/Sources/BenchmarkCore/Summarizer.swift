import Foundation

public enum BenchmarkSummarizer {
    public static func summarize(
        samples: [BenchmarkSample],
        durationSeconds: Double,
        totalCPUTimeSeconds: Double,
        mediaDurationSeconds: Double?
    ) -> BenchmarkSummary {
        let cpuValues = samples.dropFirst().map(\.cpuPercent)
        let systemCPUValues = samples.dropFirst().map(\.systemCPUPercent)
        let footprints = samples.map(\.physicalFootprintBytes)
        let firstRead = samples.first?.diskReadBytes ?? 0
        let lastRead = samples.last?.diskReadBytes ?? firstRead
        let firstWritten = samples.first?.diskWrittenBytes ?? 0
        let lastWritten = samples.last?.diskWrittenBytes ?? firstWritten
        let firstFootprint = footprints.first ?? 0
        let lastFootprint = footprints.last ?? firstFootprint

        return BenchmarkSummary(
            durationSeconds: durationSeconds,
            averageCPUPercent: average(cpuValues),
            p95CPUPercent: percentile(cpuValues, percentile: 0.95),
            peakCPUPercent: cpuValues.max() ?? 0,
            averageSystemCPUPercent: average(systemCPUValues),
            p95SystemCPUPercent: percentile(systemCPUValues, percentile: 0.95),
            peakSystemCPUPercent: systemCPUValues.max() ?? 0,
            cpuTimeSeconds: totalCPUTimeSeconds,
            averagePhysicalFootprintBytes: averageBytes(footprints),
            peakPhysicalFootprintBytes: footprints.max() ?? 0,
            physicalFootprintDeltaBytes: signedDifference(lastFootprint, firstFootprint),
            peakProcessCount: samples.map(\.processes.count).max() ?? 0,
            diskReadBytes: lastRead >= firstRead ? lastRead - firstRead : 0,
            diskWrittenBytes: lastWritten >= firstWritten ? lastWritten - firstWritten : 0,
            realtimeFactor: mediaDurationSeconds.flatMap { $0 > 0 ? durationSeconds / $0 : nil }
        )
    }

    public static func percentile(_ values: [Double], percentile: Double) -> Double {
        guard !values.isEmpty else { return 0 }
        let sorted = values.sorted()
        let bounded = min(max(percentile, 0), 1)
        let index = Int(ceil(bounded * Double(sorted.count)) - 1)
        return sorted[max(index, 0)]
    }

    private static func average(_ values: [Double]) -> Double {
        guard !values.isEmpty else { return 0 }
        return values.reduce(0, +) / Double(values.count)
    }

    /// Calculates a rounded integer mean without converting byte counters to
    /// floating point or summing the full values (which could overflow).
    private static func averageBytes(_ values: [UInt64]) -> UInt64 {
        guard !values.isEmpty else { return 0 }

        let count = UInt64(values.count)
        var quotientTotal: UInt64 = 0
        var remainderTotal: UInt64 = 0

        for value in values {
            quotientTotal += value / count
            remainderTotal += value % count
        }

        let remainderAverage = remainderTotal / count
        let remainder = remainderTotal % count
        let roundedRemainderAverage = remainderAverage + (remainder >= (count + 1) / 2 ? 1 : 0)
        return quotientTotal + roundedRemainderAverage
    }

    private static func signedDifference(_ lhs: UInt64, _ rhs: UInt64) -> Int64 {
        if lhs >= rhs {
            return Int64(min(lhs - rhs, UInt64(Int64.max)))
        }
        return -Int64(min(rhs - lhs, UInt64(Int64.max)))
    }
}
