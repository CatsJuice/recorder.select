import type { Locale } from './i18n';

export type SubjectiveReviewKey = 'ui' | 'ux' | 'summary';
type SubjectiveReview = Partial<Record<SubjectiveReviewKey, string>>;

const zhCN: Record<string, SubjectiveReview> = {
  snapzy: {
    ui: "简洁干净",
    summary: "主要偏向截图工具，没有自动运镜、动态模糊、相机画面等功能",
  },
  'creavit-studio': {
    ui: "顶级，整体简洁干净，动效丰富，细节都很精致",
    ux: "目前体验过的工具中，唯一将录制工具条放在 notch（刘海）区域的软件；缺点是与其他 notch 软件同时使用时会有冲突",
    summary: "顶级的设计，但性能问题突出；录制工具条激进地使用 notch，是一把双刃剑",
  },
  focusee: {
    ui: "一般，充满了蓝紫色渐变",
    ux: "弹窗、红点之类的有点多",
    summary: "到处都是蓝紫色渐变受不了。有一些内置 AI 功能，比如降噪、背景移除、虚拟形象、根据字幕粗剪，所以价格也有点贵",
  },
  'cleanshot-x': {
    ui: '延续 CleanShot 一贯的精美 UI，精致',
    summary: '有基础功能，但不多',
  },
  cap: {
    ui: "还行",
    summary: "开源，免费，功能较完善",
  },
  recordly: {
    ui: "一般",
    ux: "问题较多，比如录制工具条是全屏窗口，背后的内容无法交互，开始录制后录制指示器部分也是一个较大的窗口，摄像头只能在内部调整位置，背后的内容无法交互",
    summary: "开源，免费。但性能问题突出，并且导出环节一直失败，无论是用兼容模式还是 beta 模式，所以缺少导出性能测试数据",
  },
  openscreen: {
    ui: "一般",
    ux: "有点怪，例如选择桌面录制需要好几步，录制完的文件都不知道怎么删除，关闭窗口应用自动退出了",
    summary: "开源，免费",
  },
  minshot: {
    ui: "精致，并且有很多细节",
    ux: "功能集成度非常高，设计很精妙，但是没有引导不一定能找到，习惯后很方便",
    summary: "小而美，基础功能方面缺少自动运镜",
  },
  screendrop: {
    ui: "精美，非常干净和简洁",
    ux: "",
    summary: "免费，小巧精美，有一定的基础功能，但是导出速度非常慢，几乎到了不可用的程度，或许是高分辨率下的 bug",
  },
  bettershot: {
    ui: "和 Screendrop 一模一样",
    ux: "引导做得很糟糕，甚至连授权引导都没做好，要手动去设置里打开权限",
    summary: "功能和界面和 Screendrop 基本一模一样，根据仓库对比得出，BetterShot 建仓更早，但后来大量复制了 Screendrop 的代码，未注明来源，请自行斟酌",
  },
  screeen: { summary: '因下载需要付费，尚未测试，仅作列出。' },
  screenmovie: { summary: '需要付费下载，未体验' },
  matte: {
    ui: '精致、干净',
    ux: '交互都很直观，但是设置项较多',
    summary: '并非简单的录屏软件，主要用于 3D 设备套壳渲染和动画制作，能力上与其他录屏软件有很大差异，上手成本更高',
  },
  screenflare: {
    ui: '简洁偏原生，整体干净',
    ux: '有一些交互体验不是很好，例如两个时间轴片段能重叠',
    summary: '软件体积极小，基础功能完善，处于较早期，但是 bug 有点多，例如开启运动模糊导出后完全坏掉，而且预览模式下不支持运动模糊，这对整体的评估有较大影响',
  },
  screencam: {
    ui: '有比较多的细节和微动效，整体偏原生风格',
    ux: '有较多创新交互，例如直接拖拽画面改变缩放中心、双击对焦，以及在 Zoom 片段上显示缩放波形图并调整缩放大小和速度',
    summary: '轻量，价格便宜，功能丰富',
  },
  'screen-sage-pro': { ui: '专业、精致，偏原生风格', summary: '轻量、功能丰富，拥有独特的镜头布局动画功能' },
  'screen-studio': { ui: '精致，但有些控件比较粗糙', ux: '标杆般的存在', summary: '可以说是标准答案' },
  shotbase: {
    ui: '顶级，无论是细节设计还是整体风格都看得出精心打磨',
    ux: '存在一些小问题，例如录制条固定在启动时的桌面，切换桌面后找不到停止按钮',
    summary: '有着顶级的 UI，但是功能偏弱，性能也存在比较大的问题',
  },
  screencharm: {
    ui: '一般，而且整体都偏大，尤其是录制阶段的相机画面占据了巨大空间',
    ux: '存在一些问题，例如录制条和摄像头固定在启动时的桌面，切换后找不到停止按钮',
    summary: '整体一般，没什么特色',
  },
  prequel: { ui: '精致', summary: '整体 UI 不错，性能问题突出，处于较早期' },
  glisio: { summary: '没能录制成功，无论截图还是录制都会直接崩溃' },
  kapture: { ui: '一般', summary: '没有特别突出的地方，并且有一些明显的 bug' },
  'screen-glide': { ui: '粗糙，基本是用系统组件实现，布局不合理', summary: 'UI 粗糙，功能很少，但应用体积没做到极致' },
  smoothcapture: { ui: '一般，偏原生', summary: '功能较全，有 3D 模型套壳' },
  screenkite: { ui: '还行，偏专业、原生，信息密度过高', ux: '信息密度过高反而导致有些交互不太方便', summary: '功能非常多，所以即使是原生开发应用体积也不小，有一定的上手成本，UX 体验需要进一步优化' },
};

const en: Record<string, SubjectiveReview> = {
  snapzy: {
    ui: "Simple and clean.",
    summary: "Primarily a screenshot tool, without features such as automatic camera movement, motion blur, or a webcam view.",
  },
  'creavit-studio': {
    ui: "Top-tier: clean and simple overall, with plentiful animations and finely crafted details.",
    ux: "The only tool I have tried so far that places its recording toolbar in the notch. The downside is that it conflicts with other notch apps when used together.",
    summary: "Top-tier design, but significant performance issues. The recording toolbar’s aggressive use of the notch is a double-edged sword.",
  },
  focusee: {
    ui: "Average, full of blue-purple gradients.",
    ux: "A few too many pop-ups, notification dots, and similar distractions.",
    summary: "The blue-purple gradients everywhere are unbearable. It has some built-in AI features, such as noise reduction, background removal, virtual avatars, and rough cuts based on subtitles, so it is also a bit expensive.",
  },
  'cleanshot-x': {
    ui: 'Continues CleanShot’s tradition of beautiful, polished UI.',
    summary: 'Offers basic features, but not many.',
  },
  cap: {
    ui: "Decent.",
    summary: "Open source, free, and fairly comprehensive in features.",
  },
  recordly: {
    ui: "Average.",
    ux: "Several issues: the recording toolbar is a full-screen window that blocks interaction with the content behind it. Once recording starts, the recording indicator also occupies a large window. The camera view can only be repositioned within that window, and the content behind it remains inaccessible.",
    summary: "Open source and free, but with significant performance issues. Export consistently failed in both compatibility and beta modes, so export benchmark data is unavailable.",
  },
  openscreen: {
    ui: "Average.",
    ux: "Somewhat odd: selecting desktop recording takes several steps, it is unclear how to delete recorded files, and closing the window automatically quits the app.",
    summary: "Open source and free.",
  },
  minshot: {
    ui: "Polished, with many thoughtful details.",
    ux: "The features are tightly integrated and cleverly designed, but can be hard to discover without guidance. Very convenient once you get used to it.",
    summary: "Small and beautifully crafted, but automatic camera movement is missing from the basic features.",
  },
  screendrop: {
    ui: "Beautiful, very clean and simple.",
    ux: "",
    summary: "Free, compact and beautifully designed, with some basic features. However, exporting is so slow that it is almost unusable, possibly due to a bug at high resolutions.",
  },
  bettershot: {
    ui: "Identical to Screendrop.",
    ux: "The onboarding is poor; even permission setup is poorly guided, requiring users to enable permissions manually in Settings.",
    summary: "The features and interface are almost identical to Screendrop. A comparison of the repositories indicates that BetterShot was created earlier, but later copied large amounts of Screendrop code without attribution. Please use your own judgment.",
  },
  screeen: { summary: 'Not tested because downloading requires payment; listed for reference only.' },
  screenmovie: { summary: 'Requires payment to download; not tested.' },
  matte: {
    ui: 'Polished and clean.',
    ux: 'The interactions are intuitive, but there are many settings.',
    summary: 'Not simply a screen recorder: its primary focus is rendering and animating 3D device mockups. Its capabilities differ substantially from other screen recorders, with a steeper learning curve.',
  },
  screenflare: {
    ui: 'Simple and clean, with a mostly native feel.',
    ux: 'Some interactions could be better; for example, two timeline clips can overlap.',
    summary: 'The app is extremely small and covers the basics well. It is still at an early stage, however, and has quite a few bugs. For example, enabling motion blur produces a completely broken export, and motion blur is not supported in preview mode. These issues significantly affect the overall assessment.',
  },
  screencam: {
    ui: 'Rich in thoughtful details and micro-interactions, with an overall native feel.',
    ux: 'Many inventive interactions, including dragging the canvas to move the zoom center, double-clicking to focus, and using a waveform on Zoom clips to adjust zoom level and speed.',
    summary: 'Lightweight, affordable, and feature-rich.',
  },
  'screen-sage-pro': { ui: 'Professional and polished, with a native feel.', summary: 'Lightweight and feature-rich, with unique camera layout animations.' },
  'screen-studio': { ui: 'Polished, although some controls feel a little rough.', ux: 'The benchmark for the category.', summary: 'Arguably the standard answer.' },
  shotbase: {
    ui: 'Top-tier; both the fine details and overall style feel meticulously crafted.',
    ux: 'Has a few issues. For example, the recording bar stays on the desktop where recording began, so the stop button can be hard to find after switching desktops.',
    summary: 'Top-tier UI, but limited features and significant performance issues.',
  },
  screencharm: {
    ui: 'Average, with an oversized interface overall—especially the camera view during recording.',
    ux: 'Has some issues. The recording bar and camera stay on the desktop where recording began, making the stop control hard to find after switching.',
    summary: 'Average overall, without much to distinguish it.',
  },
  prequel: { ui: 'Polished.', summary: 'The UI is solid overall, but performance issues stand out and the app is still at an early stage.' },
  glisio: { summary: 'Could not complete a recording: both screenshots and recordings crashed immediately.' },
  kapture: { ui: 'Average.', summary: 'Nothing particularly stands out, and there are some obvious bugs.' },
  'screen-glide': { ui: 'Rough, built mostly with system components, and poorly laid out.', summary: 'The UI is rough and features are sparse, yet the app is not especially compact.' },
  screenkite: { ui: 'Decent, with a professional, native feel, but the information density is too high.', ux: 'The excessive information density makes some interactions less convenient.', summary: 'It packs in so many features that the app remains fairly large despite being native, has a noticeable learning curve, and still needs further UX refinement.' },
};

const zhTW: Record<string, SubjectiveReview> = {
  snapzy: {
    ui: "簡潔乾淨",
    summary: "主要偏向截圖工具，沒有自動運鏡、動態模糊、相機畫面等功能",
  },
  'creavit-studio': {
    ui: "頂級，整體簡潔乾淨，動效豐富，細節都很精緻",
    ux: "目前體驗過的工具中，唯一將錄製工具列放在 notch（瀏海）區域的軟體；缺點是與其他 notch 軟體同時使用時會有衝突",
    summary: "頂級的設計，但效能問題突出；錄製工具列激進地使用 notch，是一把雙面刃",
  },
  focusee: {
    ui: "一般，充滿了藍紫色漸層",
    ux: "彈出視窗、紅點之類的有點多",
    summary: "到處都是藍紫色漸層，受不了。有一些內建 AI 功能，例如降噪、背景移除、虛擬形象、根據字幕粗剪，所以價格也有點貴",
  },
  'cleanshot-x': {
    ui: '延續 CleanShot 一貫的精美 UI，精緻',
    summary: '有基本功能，但不多',
  },
  cap: {
    ui: "還行",
    summary: "開源，免費，功能較完善",
  },
  recordly: {
    ui: "一般",
    ux: "問題較多，例如錄製工具列是全螢幕視窗，無法操作背後的內容。開始錄製後，錄製指示器也佔據一個較大的視窗，攝影機畫面只能在該視窗內調整位置，無法操作背後的內容",
    summary: "開源、免費，但效能問題明顯，而且無論使用相容模式還是 beta 模式，匯出都一直失敗，因此缺少匯出效能測試資料",
  },
  openscreen: {
    ui: "一般",
    ux: "有點奇怪，例如選擇桌面錄製需要好幾個步驟，錄製完的檔案不知道怎麼刪除，關閉視窗後應用程式就自動結束了",
    summary: "開源、免費",
  },
  minshot: {
    ui: "精緻，而且有許多細節",
    ux: "功能整合度非常高，設計很巧妙，但沒有引導不一定能找到，習慣後很方便",
    summary: "小而美，基本功能方面缺少自動運鏡",
  },
  screendrop: {
    ui: "精美，非常乾淨簡潔",
    ux: "",
    summary: "免費、小巧精美，具備一些基本功能，但匯出速度非常慢，幾乎到了無法使用的程度，或許是高解析度下的 bug",
  },
  bettershot: {
    ui: "和 Screendrop 一模一樣",
    ux: "新手引導做得很糟糕，連權限授權引導都沒做好，需要手動到設定中開啟權限",
    summary: "功能和介面與 Screendrop 基本一模一樣，根據倉庫比對得出，BetterShot 建倉更早，但後來大量複製了 Screendrop 的程式碼，未註明來源，請自行斟酌",
  },
  screeen: { summary: '因下載需要付費，尚未測試，僅作列出。' },
  screenmovie: { summary: '需要付費下載，未體驗' },
  matte: {
    ui: '精緻、乾淨',
    ux: '互動都很直覺，但設定項目較多',
    summary: '並非單純的螢幕錄製軟體，主要用於 3D 裝置模型渲染與動畫製作，功能定位與其他螢幕錄製軟體有很大差異，上手門檻更高',
  },
  screenflare: {
    ui: '簡潔偏原生，整體乾淨',
    ux: '有些互動體驗不太好，例如兩個時間軸片段可以重疊',
    summary: '軟體體積極小，基本功能完善，仍處於較早期階段，但 bug 有點多。例如開啟動態模糊後，匯出結果完全損壞，而且預覽模式不支援動態模糊，這些問題對整體評估有較大影響',
  },
  screencam: { ui: '有許多細節與微動效，整體偏原生風格', ux: '有不少創新互動，例如直接拖曳畫面改變縮放中心、按兩下對焦，以及在 Zoom 片段上顯示縮放波形圖並調整縮放大小與速度', summary: '輕量、價格便宜、功能豐富' },
  'screen-sage-pro': { ui: '專業、精緻，偏原生風格', summary: '輕量、功能豐富，擁有獨特的鏡頭版面動畫功能' },
  'screen-studio': { ui: '精緻，但有些控制項較粗糙', ux: '標竿般的存在', summary: '可以說是標準答案' },
  shotbase: { ui: '頂級，無論細節設計或整體風格都看得出精心打磨', ux: '有一些小問題，例如錄製列固定在啟動時的桌面，切換桌面後找不到停止按鈕', summary: '有頂級的 UI，但功能偏弱，效能也有較大的問題' },
  screencharm: { ui: '一般，而且整體都偏大，尤其錄製階段的相機畫面占據巨大空間', ux: '有一些問題，例如錄製列與攝影機固定在啟動時的桌面，切換後找不到停止按鈕', summary: '整體一般，沒有太多特色' },
  prequel: { ui: '精緻', summary: '整體 UI 不錯，效能問題突出，仍處於較早期階段' },
  glisio: { summary: '未能成功錄製，無論截圖或錄製都會直接閃退' },
  kapture: { ui: '一般', summary: '沒有特別突出的地方，而且有一些明顯的 bug' },
  'screen-glide': { ui: '粗糙，基本使用系統元件實作，版面配置不合理', summary: 'UI 粗糙、功能很少，但應用程式大小沒有做到極致' },
  screenkite: { ui: '還行，偏專業、原生，但資訊密度過高', ux: '資訊密度過高，反而讓部分操作不太方便', summary: '功能非常多，因此即使採用原生開發，應用程式大小也不小，有一定的上手門檻，UX 體驗仍需進一步改善' },
};

const ja: Record<string, SubjectiveReview> = {
  snapzy: {
    ui: "シンプルでクリーン。",
    summary: "主にスクリーンショット向けのツールで、自動カメラワーク、モーションブラー、Webカメラ映像などの機能はない。",
  },
  'creavit-studio': {
    ui: "最高水準。全体的にシンプルで清潔感があり、アニメーションが豊富で、細部まで丁寧に作り込まれている。",
    ux: "これまで試した中で、録画ツールバーをノッチに配置する唯一のツール。ただし、ほかのノッチ用アプリと同時に使うと競合する。",
    summary: "デザインは最高水準だが、パフォーマンスの問題が目立つ。録画ツールバーでノッチを積極的に活用する設計は諸刃の剣。",
  },
  focusee: {
    ui: "普通。青紫のグラデーションだらけ。",
    ux: "ポップアップや通知の赤い点などが少し多い。",
    summary: "どこもかしこも青紫のグラデーションで、正直うんざり。ノイズ除去、背景除去、バーチャルアバター、字幕に基づくラフカットなどの AI 機能を内蔵しているので、価格もやや高い。",
  },
  'cleanshot-x': {
    ui: 'CleanShot らしい美しく洗練された UI を受け継いでいる。',
    summary: '基本的な機能はあるが、数は少ない。',
  },
  cap: {
    ui: "まずまず。",
    summary: "オープンソースで無料。機能も比較的充実している。",
  },
  recordly: {
    ui: "普通。",
    ux: "問題が多く、録画ツールバーは全画面ウィンドウになっていて背後のコンテンツを操作できません。録画開始後も録画インジケーターが大きなウィンドウを占め、カメラ映像の位置はその内部でしか調整できず、背後のコンテンツを操作できません。",
    summary: "オープンソースで無料ですが、パフォーマンスの問題が顕著です。互換モードでも beta モードでも書き出しが繰り返し失敗したため、書き出しの性能テストデータはありません。",
  },
  openscreen: {
    ui: "普通。",
    ux: "少し違和感がある。例えば、デスクトップ録画の選択に何段階も必要で、録画済みファイルの削除方法がわかりにくく、ウィンドウを閉じるとアプリも自動的に終了する。",
    summary: "オープンソースで無料。",
  },
  minshot: {
    ui: "洗練されていて、細部まで工夫されている。",
    ux: "機能の統合度が非常に高く、設計も巧み。ただし、案内がないと機能を見つけにくいことがある。慣れるととても便利。",
    summary: "コンパクトで美しいが、基本機能として自動カメラワークが欠けている。",
  },
  screendrop: {
    ui: "美しく、とてもすっきりしていてシンプル。",
    ux: "",
    summary: "無料でコンパクト、美しいデザインで基本的な機能もいくつか備えている。ただし、書き出しはほぼ使い物にならないほど遅い。高解像度で発生する不具合かもしれない。",
  },
  bettershot: {
    ui: "Screendrop とまったく同じ。",
    ux: "初期設定の案内が不十分で、権限の許可さえ適切に案内されず、設定から手動で有効にする必要がある。",
    summary: "機能とインターフェースは Screendrop とほぼ同一です。リポジトリの比較によると、BetterShot のリポジトリは先に作成されましたが、その後 Screendrop のコードを大量にコピーし、出典を明記していません。各自でご判断ください。",
  },
  screeen: { summary: 'ダウンロードが有料のため未検証。参考情報として掲載のみ。' },
  screenmovie: { summary: 'ダウンロードには購入が必要なため、未体験。' },
  matte: {
    ui: '洗練されていて、すっきりしている。',
    ux: '操作はどれも直感的だが、設定項目が多い。',
    summary: '単なる画面録画ソフトではなく、主に3Dデバイスモックアップのレンダリングやアニメーション制作を目的としている。他の画面録画ソフトとは機能の方向性が大きく異なり、使いこなすまでにより多くの学習が必要。',
  },
  screenflare: {
    ui: 'シンプルでネイティブらしく、全体的にすっきりしている。',
    ux: '一部の操作には改善の余地がある。例えば、タイムライン上の2つのクリップが重なってしまう。',
    summary: 'アプリ容量は極めて小さく、基本機能も充実している。まだ初期段階で、不具合はやや多い。例えば、モーションブラーを有効にすると書き出し結果が完全に崩れ、プレビューモードではモーションブラーに対応していない。これらの問題は総合評価に大きく影響する。',
  },
  screencam: { ui: '細部やマイクロインタラクションが豊富で、全体的にネイティブらしいデザイン。', ux: '画面をドラッグしてズーム中心を変える、ダブルクリックでフォーカスする、Zoom クリップの波形から倍率や速度を調整するなど、独創的な操作が多い。', summary: '軽量で安価、機能も豊富。' },
  'screen-sage-pro': { ui: 'プロフェッショナルで洗練され、ネイティブらしい。', summary: '軽量かつ多機能で、独自のカメラレイアウトアニメーションを備える。' },
  'screen-studio': { ui: '洗練されているが、一部のコントロールはやや粗い。', ux: 'この分野のベンチマーク。', summary: 'いわば模範解答。' },
  shotbase: { ui: '最高水準。細部の設計にも全体のスタイルにも丁寧な作り込みが見える。', ux: '録画バーが開始時のデスクトップに固定され、デスクトップを切り替えると停止ボタンが見つからないなど、小さな問題がある。', summary: 'UI は最高水準だが、機能が弱く、性能面にも大きな問題がある。' },
  screencharm: { ui: '平均的。全体に大きすぎる印象で、特に録画中のカメラ映像が巨大な領域を占める。', ux: '録画バーとカメラが開始時のデスクトップに固定され、切り替えると停止操作が見つからないなどの問題がある。', summary: '全体的に平均的で、際立った特徴はない。' },
  prequel: { ui: '洗練されている。', summary: 'UI は全体的に良いが、パフォーマンス上の問題が目立ち、まだ初期段階にある。' },
  glisio: { summary: '録画に成功せず、スクリーンショットも録画も即座にクラッシュした。' },
  kapture: { ui: '平均的。', summary: '特に際立つ点はなく、明らかな不具合がいくつかある。' },
  'screen-glide': { ui: '粗削りで、ほぼシステム標準コンポーネントのまま構成され、レイアウトも不合理。', summary: 'UI は粗削りで機能も少ないが、アプリ容量は特別小さくない。' },
  screenkite: { ui: 'まずまずで、プロフェッショナルかつネイティブらしいが、情報密度が高すぎる。', ux: '情報密度の高さが、かえって一部の操作を使いにくくしている。', summary: '機能が非常に多いため、ネイティブ開発でもアプリ容量は小さくない。習得にはある程度時間がかかり、UX にはさらなる改善が必要だ。' },
};

const ko: Record<string, SubjectiveReview> = {
  snapzy: {
    ui: "간결하고 깔끔함.",
    summary: "주로 스크린샷에 초점을 맞춘 도구로, 자동 카메라 움직임, 모션 블러, 웹캠 화면 등의 기능은 없음.",
  },
  'creavit-studio': {
    ui: "최상급. 전체적으로 간결하고 깔끔하며, 애니메이션이 풍부하고 세부 디자인도 정교하다.",
    ux: "지금까지 사용해 본 도구 중 녹화 도구 모음을 노치에 배치한 유일한 앱. 다만 다른 노치 앱과 함께 사용하면 충돌한다.",
    summary: "최상급 디자인이지만 성능 문제가 두드러진다. 녹화 도구 모음이 노치를 적극적으로 활용하는 방식은 양날의 검이다.",
  },
  focusee: {
    ui: "보통. 파란색과 보라색 그라데이션으로 가득하다.",
    ux: "팝업이나 빨간 알림 점 같은 것이 조금 많다.",
    summary: "어디에나 있는 파란색과 보라색 그라데이션이 견디기 힘들다. 노이즈 제거, 배경 제거, 가상 아바타, 자막 기반 러프 컷 같은 AI 기능이 내장되어 있어 가격도 조금 비싸다.",
  },
  'cleanshot-x': {
    ui: 'CleanShot 특유의 아름답고 세련된 UI를 이어간다.',
    summary: '기본 기능은 있지만 많지는 않다.',
  },
  cap: {
    ui: "괜찮음.",
    summary: "오픈 소스이며 무료이고, 기능도 비교적 잘 갖춰져 있음.",
  },
  recordly: {
    ui: "보통.",
    ux: "문제가 많습니다. 녹화 도구 모음이 전체 화면 창이라 뒤의 콘텐츠와 상호작용할 수 없습니다. 녹화를 시작한 뒤에도 녹화 표시기가 큰 창을 차지하며, 카메라 화면은 그 창 안에서만 위치를 조절할 수 있고 뒤의 콘텐츠는 조작할 수 없습니다.",
    summary: "오픈 소스이며 무료지만 성능 문제가 두드러집니다. 호환 모드와 beta 모드 모두에서 내보내기가 계속 실패하여 내보내기 성능 테스트 데이터가 없습니다.",
  },
  openscreen: {
    ui: "보통.",
    ux: "조금 이상하다. 예를 들어 데스크톱 녹화를 선택하려면 여러 단계를 거쳐야 하고, 녹화한 파일을 어떻게 삭제하는지 알기 어려우며, 창을 닫으면 앱도 자동으로 종료된다.",
    summary: "오픈 소스이며 무료.",
  },
  minshot: {
    ui: "세련되고 세심한 디테일이 많다.",
    ux: "기능이 매우 긴밀하게 통합되어 있고 설계도 정교하지만, 안내가 없으면 기능을 찾기 어려울 수 있다. 익숙해지면 매우 편리하다.",
    summary: "작고 아름답지만, 기본 기능 중 자동 카메라 움직임이 빠져 있다.",
  },
  screendrop: {
    ui: "아름답고 매우 깔끔하며 간결하다.",
    ux: "",
    summary: "무료이고 작고 아름다우며 기본 기능도 어느 정도 갖추고 있다. 하지만 내보내기 속도가 거의 사용할 수 없을 정도로 느리다. 고해상도에서 발생하는 버그일 수도 있다.",
  },
  bettershot: {
    ui: "Screendrop과 완전히 동일하다.",
    ux: "온보딩 안내가 매우 부족하다. 권한 설정 안내조차 제대로 되어 있지 않아 설정에서 직접 권한을 켜야 한다.",
    summary: "기능과 인터페이스는 Screendrop과 거의 동일합니다. 저장소를 비교한 결과 BetterShot의 저장소가 먼저 만들어졌지만, 이후 출처를 밝히지 않고 Screendrop의 코드를 대량으로 복사했습니다. 각자 신중히 판단해 주세요.",
  },
  screeen: { summary: '다운로드에 결제가 필요하여 테스트하지 않았으며, 참고용으로만 등록했습니다.' },
  screenmovie: { summary: '다운로드에 결제가 필요하여 사용해 보지 않았습니다.' },
  matte: {
    ui: '세련되고 깔끔하다.',
    ux: '조작은 모두 직관적이지만 설정 항목이 많다.',
    summary: '단순한 화면 녹화 프로그램이 아니라 주로 3D 기기 목업 렌더링과 애니메이션 제작에 초점을 맞춘다. 다른 화면 녹화 프로그램과 기능의 방향성이 크게 달라 익히는 데 더 많은 시간이 필요하다.',
  },
  screenflare: {
    ui: '간결하고 네이티브에 가까우며 전체적으로 깔끔하다.',
    ux: '일부 상호작용은 개선이 필요하다. 예를 들어 타임라인의 두 클립이 겹칠 수 있다.',
    summary: '앱 용량이 매우 작고 기본 기능도 잘 갖추고 있다. 다만 아직 초기 단계이며 버그가 다소 많다. 예를 들어 모션 블러를 켜면 내보낸 결과가 완전히 망가지고, 미리보기 모드에서는 모션 블러를 지원하지 않는다. 이런 문제는 전반적인 평가에 큰 영향을 준다.',
  },
  screencam: { ui: '세부 요소와 마이크로 인터랙션이 풍부하며 전체적으로 네이티브 앱에 가까운 스타일이다.', ux: '화면을 드래그해 줌 중심을 옮기거나, 더블 클릭으로 초점을 맞추고, Zoom 클립의 파형에서 배율과 속도를 조절하는 등 참신한 상호작용이 많다.', summary: '가볍고 저렴하며 기능이 풍부하다.' },
  'screen-sage-pro': { ui: '전문적이고 정교하며 네이티브에 가까운 느낌이다.', summary: '가볍고 기능이 풍부하며 독특한 카메라 레이아웃 애니메이션을 제공한다.' },
  'screen-studio': { ui: '정교하지만 일부 컨트롤은 다소 거칠다.', ux: '이 분야의 기준점 같은 존재다.', summary: '표준 답안이라고 할 만하다.' },
  shotbase: { ui: '최상급이다. 세부 디자인과 전체 스타일 모두 세심하게 다듬은 흔적이 보인다.', ux: '녹화 바가 시작한 데스크톱에 고정되어 데스크톱을 바꾸면 정지 버튼을 찾기 어려운 등 작은 문제가 있다.', summary: 'UI는 최상급이지만 기능이 약하고 성능 문제도 크다.' },
  screencharm: { ui: '평범하고 전반적으로 너무 크다. 특히 녹화 중 카메라 화면이 매우 큰 공간을 차지한다.', ux: '녹화 바와 카메라가 시작한 데스크톱에 고정되어 전환 후 정지 버튼을 찾기 어려운 문제가 있다.', summary: '전체적으로 평범하고 뚜렷한 특징이 없다.' },
  prequel: { ui: '세련되었다.', summary: '전반적인 UI는 좋지만 성능 문제가 두드러지며 아직 초기 단계에 있다.' },
  glisio: { summary: '녹화에 성공하지 못했으며 스크린샷과 녹화 모두 즉시 충돌했다.' },
  kapture: { ui: '평범하다.', summary: '특별히 돋보이는 점은 없으며 명백한 버그가 몇 가지 있다.' },
  'screen-glide': { ui: '거칠고 대부분 시스템 컴포넌트로 구현되어 있으며 레이아웃도 불합리하다.', summary: 'UI가 거칠고 기능도 적지만 앱 용량은 특별히 작지 않다.' },
  screenkite: { ui: '무난하고 전문적이며 네이티브에 가까운 느낌이지만, 정보 밀도가 지나치게 높다.', ux: '과도한 정보 밀도 때문에 일부 상호작용이 오히려 불편하다.', summary: '기능이 매우 많아 네이티브 앱임에도 용량이 작지 않다. 익히는 데 어느 정도 시간이 필요하며 UX도 더 개선되어야 한다.' },
};

const es: Record<string, SubjectiveReview> = {
  snapzy: {
    ui: "Sencilla y limpia.",
    summary: "Es principalmente una herramienta de capturas de pantalla, sin funciones como movimiento automático de cámara, desenfoque de movimiento o vista de webcam.",
  },
  'creavit-studio': {
    ui: "De primer nivel: una interfaz sencilla y limpia, con muchas animaciones y detalles muy cuidados.",
    ux: "La única herramienta que he probado hasta ahora que coloca la barra de grabación en el notch. El inconveniente es que entra en conflicto con otras aplicaciones para el notch al usarlas juntas.",
    summary: "Diseño de primer nivel, pero con problemas importantes de rendimiento. El uso intensivo del notch para la barra de grabación es un arma de doble filo.",
  },
  focusee: {
    ui: "Normal, llena de degradados azules y violetas.",
    ux: "Hay demasiadas ventanas emergentes, puntos de notificación y distracciones similares.",
    summary: "Los degradados azules y violetas por todas partes son insoportables. Incluye algunas funciones de IA, como reducción de ruido, eliminación de fondo, avatares virtuales y montaje preliminar basado en subtítulos, así que también resulta algo caro.",
  },
  'cleanshot-x': {
    ui: 'Mantiene la interfaz atractiva y cuidada que caracteriza a CleanShot.',
    summary: 'Ofrece funciones básicas, pero no muchas.',
  },
  cap: {
    ui: "Aceptable.",
    summary: "De código abierto, gratuito y con funciones bastante completas.",
  },
  recordly: {
    ui: "Normal.",
    ux: "Presenta varios problemas: la barra de grabación es una ventana de pantalla completa que impide interactuar con el contenido de detrás. Al iniciar la grabación, el indicador también ocupa una ventana grande; la cámara solo se puede mover dentro de ella y el contenido de detrás sigue siendo inaccesible.",
    summary: "De código abierto y gratuito, pero con problemas de rendimiento importantes. La exportación falló repetidamente tanto en el modo de compatibilidad como en el modo beta, por lo que faltan los datos de rendimiento de exportación.",
  },
  openscreen: {
    ui: "Normal.",
    ux: "Resulta algo extraña: seleccionar la grabación del escritorio requiere varios pasos, no queda claro cómo eliminar los archivos grabados y cerrar la ventana cierra automáticamente la aplicación.",
    summary: "De código abierto y gratuita.",
  },
  minshot: {
    ui: "Cuidada, con muchos detalles bien pensados.",
    ux: "Las funciones están muy bien integradas y el diseño es ingenioso, pero algunas pueden ser difíciles de descubrir sin orientación. Muy cómodo una vez que te acostumbras.",
    summary: "Pequeño y bien diseñado, pero le falta el movimiento automático de cámara entre las funciones básicas.",
  },
  screendrop: {
    ui: "Bonita, muy limpia y sencilla.",
    ux: "",
    summary: "Gratis, compacta y bonita, con algunas funciones básicas. Sin embargo, la exportación es tan lenta que resulta casi inutilizable, posiblemente por un error con resoluciones altas.",
  },
  bettershot: {
    ui: "Idéntica a Screendrop.",
    ux: "La guía inicial es muy deficiente; ni siquiera orienta bien sobre los permisos, que hay que activar manualmente en Ajustes.",
    summary: "Las funciones y la interfaz son casi idénticas a las de Screendrop. La comparación de los repositorios indica que BetterShot se creó antes, pero posteriormente copió grandes cantidades de código de Screendrop sin atribución. Valóralo por tu cuenta.",
  },
  screeen: { summary: 'No se ha probado porque la descarga requiere pago; se incluye solo como referencia.' },
  screenmovie: { summary: 'La descarga requiere pago; no se ha probado.' },
  matte: {
    ui: 'Cuidada y limpia.',
    ux: 'Las interacciones son intuitivas, pero hay muchos ajustes.',
    summary: 'No es simplemente un grabador de pantalla: se centra en renderizar y animar maquetas de dispositivos en 3D. Sus capacidades difieren mucho de las de otros grabadores y la curva de aprendizaje es mayor.',
  },
  screenflare: {
    ui: 'Sencilla y limpia, con un estilo bastante nativo.',
    ux: 'Algunas interacciones necesitan mejorar; por ejemplo, dos clips de la línea de tiempo pueden superponerse.',
    summary: 'La aplicación ocupa muy poco espacio y cubre bien las funciones básicas. Sin embargo, aún está en una etapa temprana y tiene bastantes errores. Por ejemplo, activar el desenfoque de movimiento produce una exportación completamente defectuosa, y la vista previa no admite este efecto. Estos problemas influyen considerablemente en la valoración general.',
  },
  screencam: { ui: 'Muchos detalles y microinteracciones, con una apariencia general bastante nativa.', ux: 'Incluye interacciones innovadoras: arrastrar el lienzo para mover el centro del zoom, hacer doble clic para enfocar y ajustar nivel y velocidad mediante la onda de los clips Zoom.', summary: 'Ligero, económico y con muchas funciones.' },
  'screen-sage-pro': { ui: 'Profesional, refinado y con apariencia nativa.', summary: 'Ligero y completo, con animaciones únicas para la disposición de cámara.' },
  'screen-studio': { ui: 'Refinado, aunque algunos controles se sienten algo toscos.', ux: 'El referente de la categoría.', summary: 'Podría considerarse la respuesta estándar.' },
  shotbase: { ui: 'De primer nivel; tanto los detalles como el estilo general están cuidadosamente trabajados.', ux: 'Tiene pequeños problemas: la barra de grabación queda en el escritorio inicial y, al cambiar, cuesta encontrar el botón de detener.', summary: 'UI de primer nivel, pero pocas funciones y problemas importantes de rendimiento.' },
  screencharm: { ui: 'Normal y sobredimensionado en general, sobre todo la vista de cámara durante la grabación.', ux: 'La barra de grabación y la cámara quedan en el escritorio inicial, por lo que al cambiar cuesta encontrar cómo detener.', summary: 'Normal en conjunto y sin rasgos distintivos.' },
  prequel: { ui: 'Refinada.', summary: 'La UI es buena en general, pero los problemas de rendimiento son evidentes y la aplicación aún está en una etapa temprana.' },
  glisio: { summary: 'No fue posible grabar: tanto las capturas como la grabación se cerraron de inmediato.' },
  kapture: { ui: 'Normal.', summary: 'Nada destaca especialmente y hay algunos errores evidentes.' },
  'screen-glide': { ui: 'Tosca, construida principalmente con componentes del sistema y con una disposición poco acertada.', summary: 'La UI es tosca y ofrece pocas funciones, pero la aplicación tampoco es especialmente compacta.' },
  screenkite: { ui: 'Aceptable, con un estilo profesional y nativo, pero con demasiada densidad de información.', ux: 'La excesiva densidad de información hace que algunas interacciones sean menos cómodas.', summary: 'Incluye tantas funciones que la aplicación sigue siendo bastante grande pese a ser nativa, requiere cierto aprendizaje y aún necesita mejorar su UX.' },
};

const fr: Record<string, SubjectiveReview> = {
  snapzy: {
    ui: "Simple et épurée.",
    summary: "Principalement un outil de capture d’écran, sans fonctions telles que les mouvements automatiques de caméra, le flou de mouvement ou l’affichage de la webcam.",
  },
  'creavit-studio': {
    ui: "De très haut niveau : une interface simple et épurée, de nombreuses animations et des détails très soignés.",
    ux: "Le seul outil que j’ai essayé jusqu’ici qui place sa barre d’enregistrement dans l’encoche. En revanche, il entre en conflit avec les autres applications utilisant l’encoche lorsqu’elles fonctionnent ensemble.",
    summary: "Un design de très haut niveau, mais des problèmes de performances importants. L’utilisation intensive de l’encoche pour la barre d’enregistrement est à double tranchant.",
  },
  focusee: {
    ui: "Moyenne, pleine de dégradés bleus et violets.",
    ux: "Un peu trop de fenêtres contextuelles, de pastilles de notification et autres distractions.",
    summary: "Les dégradés bleus et violets partout sont insupportables. Quelques fonctions IA sont intégrées, comme la réduction du bruit, la suppression du fond, les avatars virtuels et le montage préliminaire à partir des sous-titres, ce qui rend aussi le prix un peu élevé.",
  },
  'cleanshot-x': {
    ui: 'Conserve la belle interface soignée qui caractérise CleanShot.',
    summary: 'Propose des fonctions de base, mais peu nombreuses.',
  },
  cap: {
    ui: "Correcte.",
    summary: "Open source, gratuit et assez complet en fonctionnalités.",
  },
  recordly: {
    ui: "Moyenne.",
    ux: "Plusieurs problèmes : la barre d’enregistrement est une fenêtre plein écran qui empêche d’interagir avec le contenu derrière elle. Après le démarrage, l’indicateur d’enregistrement occupe aussi une grande fenêtre ; la caméra ne peut être déplacée qu’à l’intérieur et le contenu derrière reste inaccessible.",
    summary: "Open source et gratuit, mais avec des problèmes de performances importants. L’exportation a systématiquement échoué en mode de compatibilité comme en mode beta ; les données de performances d’exportation sont donc indisponibles.",
  },
  openscreen: {
    ui: "Moyenne.",
    ux: "Un peu déroutante : sélectionner l’enregistrement du bureau demande plusieurs étapes, la manière de supprimer les fichiers enregistrés n’est pas claire et fermer la fenêtre quitte automatiquement l’application.",
    summary: "Open source et gratuite.",
  },
  minshot: {
    ui: "Soignée, avec de nombreux détails bien pensés.",
    ux: "Les fonctions sont très bien intégrées et la conception est ingénieuse, mais certaines peuvent être difficiles à découvrir sans indications. Très pratique une fois les habitudes prises.",
    summary: "Petit et soigné, mais il manque le mouvement automatique de caméra parmi les fonctions de base.",
  },
  screendrop: {
    ui: "Belle, très épurée et simple.",
    ux: "",
    summary: "Gratuite, compacte et soignée, avec quelques fonctions de base. Cependant, l’exportation est si lente qu’elle est presque inutilisable, peut-être à cause d’un bug à haute résolution.",
  },
  bettershot: {
    ui: "Identique à Screendrop.",
    ux: "L’accompagnement initial est très mauvais : même l’attribution des autorisations est mal expliquée et il faut les activer manuellement dans les réglages.",
    summary: "Les fonctionnalités et l’interface sont presque identiques à celles de Screendrop. La comparaison des dépôts indique que celui de BetterShot a été créé plus tôt, mais que de grandes quantités de code de Screendrop ont ensuite été copiées sans attribution. À chacun de se faire son opinion.",
  },
  screeen: { summary: 'Non testé, car le téléchargement est payant ; répertorié uniquement à titre indicatif.' },
  screenmovie: { summary: 'Le téléchargement est payant ; non testé.' },
  matte: {
    ui: 'Soignée et épurée.',
    ux: 'Les interactions sont intuitives, mais les réglages sont nombreux.',
    summary: 'Ce n’est pas un simple outil d’enregistrement d’écran : il sert principalement au rendu et à l’animation de maquettes d’appareils en 3D. Ses capacités diffèrent fortement de celles des autres outils d’enregistrement, et sa prise en main demande davantage de temps.',
  },
  screenflare: {
    ui: 'Simple et épurée, avec un style plutôt natif.',
    ux: 'Certaines interactions méritent des améliorations : par exemple, deux clips de la timeline peuvent se chevaucher.',
    summary: 'L’application est extrêmement compacte et couvre bien les fonctions de base. Elle en est toutefois encore à ses débuts et comporte pas mal de bugs. Par exemple, activer le flou de mouvement produit un export complètement défectueux, et ce flou n’est pas pris en charge dans l’aperçu. Ces problèmes ont une incidence importante sur l’évaluation globale.',
  },
  screencam: { ui: 'De nombreux détails et micro-interactions, dans un style globalement natif.', ux: 'Plusieurs interactions innovantes : déplacer le centre du zoom en faisant glisser l’image, double-cliquer pour cibler, ou régler niveau et vitesse depuis la forme d’onde des clips Zoom.', summary: 'Léger, abordable et riche en fonctionnalités.' },
  'screen-sage-pro': { ui: 'Professionnel, soigné et proche d’une application native.', summary: 'Léger et riche en fonctions, avec des animations uniques de disposition de caméra.' },
  'screen-studio': { ui: 'Soigné, même si certains contrôles paraissent un peu grossiers.', ux: 'La référence de la catégorie.', summary: 'On peut le considérer comme la réponse standard.' },
  shotbase: { ui: 'Exceptionnel : les détails comme le style général témoignent d’un grand soin.', ux: 'Quelques petits défauts : la barre d’enregistrement reste sur le bureau de départ et le bouton d’arrêt devient difficile à trouver après un changement de bureau.', summary: 'Une UI exceptionnelle, mais peu de fonctions et d’importants problèmes de performances.' },
  screencharm: { ui: 'Moyen et globalement surdimensionné, surtout la vue caméra pendant l’enregistrement.', ux: 'La barre d’enregistrement et la caméra restent sur le bureau de départ, ce qui rend l’arrêt difficile à trouver après un changement.', summary: 'Moyen dans l’ensemble, sans véritable particularité.' },
  prequel: { ui: 'Soignée.', summary: 'L’UI est globalement réussie, mais les problèmes de performances sont marqués et l’application en est encore à un stade précoce.' },
  glisio: { summary: 'Impossible de réussir un enregistrement : captures et enregistrements ont planté immédiatement.' },
  kapture: { ui: 'Moyenne.', summary: 'Rien ne se démarque particulièrement et quelques bugs évidents subsistent.' },
  'screen-glide': { ui: 'Rudimentaire, principalement réalisée avec des composants système et dotée d’une mise en page peu cohérente.', summary: 'L’interface est rudimentaire et les fonctions sont rares, sans que l’application soit particulièrement compacte.' },
  screenkite: { ui: 'Correcte, avec un style professionnel et natif, mais une densité d’information excessive.', ux: 'Cette densité d’information rend certaines interactions moins pratiques.', summary: 'L’application propose tant de fonctions qu’elle reste assez volumineuse malgré son développement natif, demande un certain temps de prise en main et nécessite encore des améliorations UX.' },
};

const de: Record<string, SubjectiveReview> = {
  snapzy: {
    ui: "Schlicht und aufgeräumt.",
    summary: "Vor allem ein Screenshot-Tool, ohne Funktionen wie automatische Kamerabewegungen, Bewegungsunschärfe oder Webcam-Ansicht.",
  },
  'creavit-studio': {
    ui: "Erstklassig: insgesamt schlicht und aufgeräumt, mit vielen Animationen und sorgfältig ausgearbeiteten Details.",
    ux: "Das einzige bisher von mir getestete Tool, das seine Aufnahmeleiste in der Notch platziert. Bei gleichzeitiger Nutzung anderer Notch-Apps kommt es allerdings zu Konflikten.",
    summary: "Erstklassiges Design, aber deutliche Leistungsprobleme. Die intensive Nutzung der Notch für die Aufnahmeleiste ist ein zweischneidiges Schwert.",
  },
  focusee: {
    ui: "Durchschnittlich, voller blau-violetter Farbverläufe.",
    ux: "Etwas zu viele Pop-ups, Benachrichtigungspunkte und ähnliche Ablenkungen.",
    summary: "Die blau-violetten Farbverläufe überall sind unerträglich. Es gibt einige integrierte KI-Funktionen wie Rauschunterdrückung, Hintergrundentfernung, virtuelle Avatare und einen Rohschnitt anhand von Untertiteln, daher ist der Preis auch etwas hoch.",
  },
  'cleanshot-x': {
    ui: 'Führt die für CleanShot typische schöne und sorgfältig gestaltete Oberfläche fort.',
    summary: 'Bietet grundlegende Funktionen, aber nicht viele.',
  },
  cap: {
    ui: "Ordentlich.",
    summary: "Open Source, kostenlos und mit recht umfangreichen Funktionen.",
  },
  recordly: {
    ui: "Durchschnittlich.",
    ux: "Mehrere Probleme: Die Aufnahmeleiste ist ein Vollbildfenster, das die Interaktion mit dahinterliegenden Inhalten verhindert. Nach dem Start belegt auch die Aufnahmeanzeige ein großes Fenster. Die Kameraansicht lässt sich nur darin verschieben, und die Inhalte dahinter bleiben unzugänglich.",
    summary: "Open Source und kostenlos, aber mit erheblichen Leistungsproblemen. Der Export schlug sowohl im Kompatibilitätsmodus als auch im Beta-Modus wiederholt fehl, daher fehlen Leistungsdaten zum Export.",
  },
  openscreen: {
    ui: "Durchschnittlich.",
    ux: "Etwas eigenartig: Die Auswahl der Desktopaufnahme erfordert mehrere Schritte, es ist unklar, wie sich aufgenommene Dateien löschen lassen, und beim Schließen des Fensters wird die App automatisch beendet.",
    summary: "Open Source und kostenlos.",
  },
  minshot: {
    ui: "Ausgefeilt, mit vielen durchdachten Details.",
    ux: "Die Funktionen sind sehr eng integriert und clever gestaltet, lassen sich ohne Anleitung aber nicht immer leicht entdecken. Nach der Eingewöhnung sehr praktisch.",
    summary: "Klein und schön gestaltet, allerdings fehlen automatische Kamerabewegungen bei den Grundfunktionen.",
  },
  screendrop: {
    ui: "Schön, sehr aufgeräumt und schlicht.",
    ux: "",
    summary: "Kostenlos, kompakt und schön gestaltet, mit einigen Grundfunktionen. Der Export ist jedoch so langsam, dass er fast unbrauchbar ist. Möglicherweise liegt ein Fehler bei hohen Auflösungen vor.",
  },
  bettershot: {
    ui: "Identisch mit Screendrop.",
    ux: "Die Einführung ist sehr schlecht. Selbst die Vergabe von Berechtigungen wird nicht richtig erklärt, sodass man sie manuell in den Einstellungen aktivieren muss.",
    summary: "Funktionen und Oberfläche sind mit Screendrop nahezu identisch. Der Vergleich der Repositories zeigt, dass BetterShot früher angelegt wurde, später jedoch große Mengen Screendrop-Code ohne Quellenangabe kopierte. Bitte bilde dir selbst ein Urteil.",
  },
  screeen: { summary: 'Nicht getestet, da der Download kostenpflichtig ist; nur zur Information aufgeführt.' },
  screenmovie: { summary: 'Der Download ist kostenpflichtig; noch nicht getestet.' },
  matte: {
    ui: 'Ausgefeilt und aufgeräumt.',
    ux: 'Die Interaktionen sind intuitiv, allerdings gibt es viele Einstellungen.',
    summary: 'Kein einfacher Bildschirmrekorder: Der Schwerpunkt liegt auf dem Rendern und Animieren von 3D-Gerätemockups. Die Möglichkeiten unterscheiden sich deutlich von anderen Bildschirmrekordern, und die Einarbeitung ist aufwendiger.',
  },
  screenflare: {
    ui: 'Schlicht und aufgeräumt, mit einem eher nativen Erscheinungsbild.',
    ux: 'Einige Interaktionen sind verbesserungsbedürftig; beispielsweise können sich zwei Clips auf der Zeitleiste überlappen.',
    summary: 'Die App ist extrem klein und deckt die Grundfunktionen gut ab. Sie befindet sich allerdings noch in einem frühen Stadium und hat recht viele Bugs. Beispielsweise führt aktivierte Bewegungsunschärfe zu einem völlig fehlerhaften Export, während die Vorschau keine Bewegungsunschärfe unterstützt. Diese Probleme beeinflussen die Gesamtbewertung erheblich.',
  },
  screencam: { ui: 'Viele durchdachte Details und Mikrointeraktionen, insgesamt mit nativem Erscheinungsbild.', ux: 'Viele innovative Interaktionen: Zoomzentrum durch Ziehen verschieben, per Doppelklick fokussieren sowie Zoomstärke und -geschwindigkeit über die Wellenform eines Zoom-Clips anpassen.', summary: 'Leichtgewichtig, günstig und funktionsreich.' },
  'screen-sage-pro': { ui: 'Professionell, ausgefeilt und mit nativem Erscheinungsbild.', summary: 'Leicht und funktionsreich, mit einzigartigen Animationen für Kamera-Layouts.' },
  'screen-studio': { ui: 'Ausgefeilt, auch wenn einige Bedienelemente etwas grob wirken.', ux: 'Der Maßstab in dieser Kategorie.', summary: 'Sozusagen die Standardantwort.' },
  shotbase: { ui: 'Erstklassig; sowohl Details als auch Gesamtstil wirken sorgfältig ausgearbeitet.', ux: 'Kleinere Probleme: Die Aufnahmeleiste bleibt auf dem ursprünglichen Desktop, sodass die Stopptaste nach einem Desktopwechsel schwer zu finden ist.', summary: 'Erstklassige UI, aber wenig Funktionen und deutliche Leistungsprobleme.' },
  screencharm: { ui: 'Durchschnittlich und insgesamt überdimensioniert, besonders die Kameraansicht während der Aufnahme.', ux: 'Aufnahmeleiste und Kamera bleiben auf dem Start-Desktop, wodurch die Stoppfunktion nach einem Wechsel schwer zu finden ist.', summary: 'Insgesamt durchschnittlich und ohne besondere Merkmale.' },
  prequel: { ui: 'Ausgefeilt.', summary: 'Die UI ist insgesamt gut, doch die Leistungsprobleme fallen deutlich auf und die App befindet sich noch in einem frühen Stadium.' },
  glisio: { summary: 'Keine erfolgreiche Aufnahme möglich: Sowohl Screenshots als auch Aufnahmen stürzten sofort ab.' },
  kapture: { ui: 'Durchschnittlich.', summary: 'Nichts sticht besonders hervor, und es gibt einige offensichtliche Fehler.' },
  'screen-glide': { ui: 'Unausgereift, größtenteils mit Systemkomponenten umgesetzt und ungeschickt angeordnet.', summary: 'Die UI ist unausgereift und der Funktionsumfang gering, dennoch ist die App nicht besonders kompakt.' },
  screenkite: { ui: 'Ordentlich, professionell und nativ wirkend, aber mit zu hoher Informationsdichte.', ux: 'Die übermäßige Informationsdichte macht manche Interaktionen unnötig umständlich.', summary: 'Die App bietet so viele Funktionen, dass sie trotz nativer Entwicklung recht groß bleibt, eine gewisse Einarbeitung erfordert und bei der UX noch weiter verbessert werden muss.' },
};

const ptBR: Record<string, SubjectiveReview> = {
  snapzy: {
    ui: "Simples e limpa.",
    summary: "É principalmente uma ferramenta de captura de tela, sem funções como movimento automático de câmera, desfoque de movimento ou visualização da webcam.",
  },
  'creavit-studio': {
    ui: "De primeira linha: interface simples e limpa, com muitas animações e detalhes muito bem cuidados.",
    ux: "A única ferramenta que experimentei até agora que coloca a barra de gravação no notch. A desvantagem é que ela entra em conflito com outros aplicativos de notch quando usados juntos.",
    summary: "Design de primeira linha, mas com problemas significativos de desempenho. O uso intenso do notch pela barra de gravação é uma faca de dois gumes.",
  },
  focusee: {
    ui: "Mediana, cheia de gradientes azuis e roxos.",
    ux: "Há um pouco demais de pop-ups, pontos de notificação e distrações semelhantes.",
    summary: "Os gradientes azuis e roxos por toda parte são insuportáveis. Há alguns recursos de IA integrados, como redução de ruído, remoção de fundo, avatares virtuais e cortes preliminares com base nas legendas, então o preço também é um pouco alto.",
  },
  'cleanshot-x': {
    ui: 'Mantém a interface bonita e refinada que caracteriza o CleanShot.',
    summary: 'Oferece recursos básicos, mas não muitos.',
  },
  cap: {
    ui: "Razoável.",
    summary: "Código aberto, gratuito e com recursos bastante completos.",
  },
  recordly: {
    ui: "Mediana.",
    ux: "Vários problemas: a barra de gravação é uma janela em tela cheia que impede a interação com o conteúdo atrás dela. Após iniciar a gravação, o indicador também ocupa uma janela grande; a câmera só pode ser reposicionada dentro dela e o conteúdo atrás continua inacessível.",
    summary: "Código aberto e gratuito, mas com problemas significativos de desempenho. A exportação falhou repetidamente tanto no modo de compatibilidade quanto no modo beta, por isso não há dados de desempenho de exportação.",
  },
  openscreen: {
    ui: "Mediana.",
    ux: "Um pouco estranha: selecionar a gravação da área de trabalho exige várias etapas, não fica claro como excluir os arquivos gravados e fechar a janela encerra o aplicativo automaticamente.",
    summary: "De código aberto e gratuito.",
  },
  minshot: {
    ui: "Refinada, com muitos detalhes bem pensados.",
    ux: "As funções são muito bem integradas e o design é engenhoso, mas algumas podem ser difíceis de descobrir sem orientação. Muito prático depois que você se acostuma.",
    summary: "Pequeno e bem cuidado, mas falta o movimento automático de câmera entre as funções básicas.",
  },
  screendrop: {
    ui: "Bonita, muito limpa e simples.",
    ux: "",
    summary: "Gratuita, compacta e bonita, com algumas funções básicas. Porém, a exportação é tão lenta que fica quase inutilizável, talvez devido a um bug em altas resoluções.",
  },
  bettershot: {
    ui: "Idêntica à do Screendrop.",
    ux: "A orientação inicial é muito ruim; até a configuração de permissões é mal explicada, exigindo que sejam ativadas manualmente nos Ajustes.",
    summary: "As funções e a interface são quase idênticas às do Screendrop. A comparação dos repositórios indica que o BetterShot foi criado antes, mas depois copiou grandes quantidades de código do Screendrop sem atribuição. Avalie por conta própria.",
  },
  screeen: { summary: 'Não testado porque o download exige pagamento; listado apenas como referência.' },
  screenmovie: { summary: 'O download exige pagamento; ainda não testado.' },
  matte: {
    ui: 'Refinada e limpa.',
    ux: 'As interações são intuitivas, mas há muitas configurações.',
    summary: 'Não é apenas um gravador de tela: o foco principal é renderizar e animar mockups de dispositivos em 3D. Seus recursos diferem bastante dos de outros gravadores, com uma curva de aprendizado maior.',
  },
  screenflare: {
    ui: 'Simples e limpa, com aparência próxima de um app nativo.',
    ux: 'Algumas interações precisam melhorar; por exemplo, dois clipes na linha do tempo podem se sobrepor.',
    summary: 'O aplicativo é extremamente pequeno e atende bem às funções básicas. No entanto, ainda está em estágio inicial e tem vários bugs. Por exemplo, ativar o desfoque de movimento gera uma exportação completamente defeituosa, e a prévia não oferece suporte a esse efeito. Esses problemas afetam bastante a avaliação geral.',
  },
  screencam: { ui: 'Muitos detalhes e microinterações, com aparência geral próxima de um app nativo.', ux: 'Várias interações inovadoras: arrastar a tela para mover o centro do zoom, clicar duas vezes para focar e ajustar nível e velocidade pela forma de onda dos clipes Zoom.', summary: 'Leve, barato e rico em recursos.' },
  'screen-sage-pro': { ui: 'Profissional, refinado e com aparência nativa.', summary: 'Leve e rico em recursos, com animações exclusivas de layout da câmera.' },
  'screen-studio': { ui: 'Refinado, embora alguns controles pareçam um pouco grosseiros.', ux: 'A referência da categoria.', summary: 'Pode ser considerado a resposta padrão.' },
  shotbase: { ui: 'Excelente; tanto os detalhes quanto o estilo geral demonstram muito cuidado.', ux: 'Tem pequenos problemas: a barra de gravação fica na área de trabalho inicial e, ao trocar, o botão de parar se torna difícil de encontrar.', summary: 'UI excelente, mas poucos recursos e problemas significativos de desempenho.' },
  screencharm: { ui: 'Mediano e grande demais no geral, sobretudo a visualização da câmera durante a gravação.', ux: 'A barra de gravação e a câmera ficam na área de trabalho inicial, dificultando encontrar o controle de parar após a troca.', summary: 'Mediano no geral e sem características marcantes.' },
  prequel: { ui: 'Refinada.', summary: 'A UI é boa no geral, mas os problemas de desempenho se destacam e o aplicativo ainda está em estágio inicial.' },
  glisio: { summary: 'Não foi possível gravar: tanto as capturas quanto as gravações travaram imediatamente.' },
  kapture: { ui: 'Mediana.', summary: 'Nada se destaca especialmente, e há alguns bugs evidentes.' },
  'screen-glide': { ui: 'Rudimentar, feita principalmente com componentes do sistema e com um layout pouco adequado.', summary: 'A UI é rudimentar e há poucos recursos, mas o aplicativo também não é especialmente compacto.' },
  screenkite: { ui: 'Razoável, com aparência profissional e nativa, mas com densidade de informação excessiva.', ux: 'A densidade excessiva de informação torna algumas interações menos práticas.', summary: 'Tem tantos recursos que o aplicativo continua relativamente grande apesar do desenvolvimento nativo, exige algum tempo de aprendizado e ainda precisa melhorar a UX.' },
};

const reviews: Record<Locale, Record<string, SubjectiveReview>> = {
  en, 'zh-CN': zhCN, 'zh-TW': zhTW, ja, ko, es, fr, de, 'pt-BR': ptBR,
};

export const subjectiveReviewKeys: SubjectiveReviewKey[] = ['summary', 'ui', 'ux'];

export const subjectiveReviewFor = (locale: Locale, recorderId: string, key: SubjectiveReviewKey) =>
  reviews[locale]?.[recorderId]?.[key] ?? reviews.en[recorderId]?.[key];
