import Foundation

public enum ResultExporter {
    public static func writeJSON(_ result: BenchmarkResult, to url: URL) throws {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
        encoder.dateEncodingStrategy = .iso8601
        try encoder.encode(result).write(to: url, options: .atomic)
    }

    public static func writeCSV(_ result: BenchmarkResult, to url: URL) throws {
        var rows = [
            "elapsed_seconds,application_cpu_percent,system_cpu_percent,application_physical_footprint_bytes,system_memory_used_bytes,system_memory_delta_bytes,disk_read_bytes,disk_written_bytes,process_count"
        ]
        rows.append(contentsOf: result.samples.map { sample in
            [
                decimal(sample.elapsedSeconds),
                decimal(sample.cpuPercent),
                decimal(sample.systemCPUPercent),
                String(sample.physicalFootprintBytes),
                String(sample.systemMemoryUsedBytes),
                String(sample.systemMemoryDeltaBytes),
                String(sample.diskReadBytes),
                String(sample.diskWrittenBytes),
                String(sample.processes.count),
            ].joined(separator: ",")
        })
        try (rows.joined(separator: "\n") + "\n").write(to: url, atomically: true, encoding: .utf8)
    }

    public static func suggestedBaseName(for result: BenchmarkResult) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd-HHmmss"
        return "\(slug(result.target.recorderID))-\(result.scenario.rawValue)-\(formatter.string(from: result.startedAt))"
    }

    public static func slug(_ value: String) -> String {
        let folded = value.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
        let pieces = folded.components(separatedBy: CharacterSet.alphanumerics.inverted).filter { !$0.isEmpty }
        return pieces.joined(separator: "-").lowercased()
    }

    private static func decimal(_ value: Double) -> String {
        String(format: "%.4f", locale: Locale(identifier: "en_US_POSIX"), value)
    }
}
