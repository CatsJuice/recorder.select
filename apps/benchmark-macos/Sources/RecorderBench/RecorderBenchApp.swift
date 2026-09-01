import SwiftUI

@main
struct RecorderBenchApp: App {
    @StateObject private var model = BenchmarkViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(model)
                .frame(minWidth: 980, minHeight: 660)
        }
        .windowStyle(.hiddenTitleBar)
        .commands {
            CommandGroup(after: .newItem) {
                Button("Refresh Running Apps") { model.refreshRunningApplications() }
                    .keyboardShortcut("r", modifiers: [.command, .shift])
                Divider()
                Button(model.isRunning ? "Stop Benchmark" : "Start Benchmark") {
                    model.isRunning ? model.stop() : model.start()
                }
                .keyboardShortcut(.return, modifiers: [.command])
                .disabled(model.targetURL == nil)
            }
        }
    }
}
