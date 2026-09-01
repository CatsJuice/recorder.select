import Foundation

public enum ProcessFamilyResolver {
    public static func includedIdentities(
        processes: [ProcessMeasurement],
        rootPIDs: Set<Int32>,
        bundlePath: String,
        previouslyIncluded: Set<ProcessIdentity> = []
    ) -> Set<ProcessIdentity> {
        let byPID = Dictionary(uniqueKeysWithValues: processes.map { ($0.identity.pid, $0) })
        var included = Set(processes.filter {
            rootPIDs.contains($0.identity.pid)
                || previouslyIncluded.contains($0.identity)
                || isInsideBundle($0.executablePath, bundlePath: bundlePath)
        }.map(\.identity))

        var changed = true
        while changed {
            changed = false
            for process in processes where !included.contains(process.identity) {
                if let parent = byPID[process.parentPID], included.contains(parent.identity) {
                    included.insert(process.identity)
                    changed = true
                }
            }
        }
        return included
    }

    private static func isInsideBundle(_ executablePath: String, bundlePath: String) -> Bool {
        guard !executablePath.isEmpty, !bundlePath.isEmpty else { return false }
        let normalizedBundle = URL(fileURLWithPath: bundlePath).standardizedFileURL.path
        let normalizedExecutable = URL(fileURLWithPath: executablePath).standardizedFileURL.path
        return normalizedExecutable == normalizedBundle
            || normalizedExecutable.hasPrefix(normalizedBundle + "/Contents/")
    }
}
