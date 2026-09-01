// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "RecorderBench",
    platforms: [.macOS(.v14)],
    products: [
        .executable(name: "RecorderBench", targets: ["RecorderBench"]),
        .library(name: "BenchmarkCore", targets: ["BenchmarkCore"]),
    ],
    targets: [
        .target(name: "BenchmarkCore"),
        .executableTarget(
            name: "RecorderBench",
            dependencies: ["BenchmarkCore"]
        ),
        .testTarget(
            name: "BenchmarkCoreTests",
            dependencies: ["BenchmarkCore"]
        ),
    ]
)
