import Darwin
import Foundation

public enum MachineMetadataReader {
    public static func current(toolVersion: String) -> MachineMetadata {
        MachineMetadata(
            model: sysctlString("hw.model") ?? "Unknown Mac",
            processor: sysctlString("machdep.cpu.brand_string") ?? architectureName,
            memoryBytes: ProcessInfo.processInfo.physicalMemory,
            logicalCoreCount: ProcessInfo.processInfo.processorCount,
            operatingSystem: ProcessInfo.processInfo.operatingSystemVersionString,
            toolVersion: toolVersion
        )
    }

    private static var architectureName: String {
        #if arch(arm64)
        return "Apple silicon"
        #elseif arch(x86_64)
        return "Intel"
        #else
        return "Unknown architecture"
        #endif
    }

    private static func sysctlString(_ name: String) -> String? {
        var size = 0
        guard sysctlbyname(name, nil, &size, nil, 0) == 0, size > 0 else { return nil }
        var value = [CChar](repeating: 0, count: size)
        guard sysctlbyname(name, &value, &size, nil, 0) == 0 else { return nil }
        let bytes = value.prefix { $0 != 0 }.map { UInt8(bitPattern: $0) }
        return String(decoding: bytes, as: UTF8.self)
    }
}
