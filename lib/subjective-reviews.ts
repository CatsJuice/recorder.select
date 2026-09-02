import type { Locale } from './i18n';

export type SubjectiveReviewKey = 'ui' | 'ux' | 'summary';
type SubjectiveReview = Partial<Record<SubjectiveReviewKey, string>>;

const zhCN: Record<string, SubjectiveReview> = {
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
