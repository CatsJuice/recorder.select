# XHS 离线版本

运行 `npm run build:xhs`，产物输出到 `artifacts/recorder-select-xhs.zip`，解压预览目录为 `dist-xhs/`。

该入口通过 `scripts/build-xhs.mjs` 复用现有页面，只在 xhs 构建期间移除 Chat、在线提交和外链跳转，普通网站行为不变。构建期改写使用匹配断言，页面结构变化后应同步检查适配规则。

脚本采用现有 esbuild / PostCSS / Lightning CSS 构建链，输出面向 ES2017 / Chrome 61 的经典脚本；`runtime.ts` 和 `compat.css` 提供局部兼容回退。`scripts/audit-xhs.mjs` 检查最终入口、资源、语法及离线约束，skill 的审计脚本检查包体预算。无需启动服务器或下载模型即可运行最终包。

发布前仍需在小红书模拟器及目标真机验证搜索、筛选、排序、拖动、对比、权重弹层、暗色、安全区和软键盘。静态检查不代表真机兼容性或性能验收通过。
