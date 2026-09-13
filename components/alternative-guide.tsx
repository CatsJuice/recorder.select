/* eslint-disable @next/next/no-html-link-for-pages -- Use document navigation: this vinext version has known RSC navigation failures (docs/seo-and-performance.md). */
import { recorders, type Recorder, type Platform } from '../lib/recorders';
import { alternativePaths, type GuideLanguage } from '../lib/alternative-guide';
import { siteUrl } from '../lib/site-metadata';
import './alternative-guide.css';

const alternatives = recorders.filter(recorder => recorder.id !== 'screen-studio');
const platformNames = { mac: 'macOS', win: 'Windows', linux: 'Linux' };

/** All product facts share the comparison table's dataset; null never means free or unsupported. */
export function AlternativeGuide({ language }: { language: GuideLanguage }) {
  const zh = language === 'zh-CN';
  const copy = (en: string, cn: string) => zh ? cn : en;
  const title = copy('Screen Studio alternatives', 'Screen Studio 平替与录屏软件对比');
  const bool = (value: unknown) => value === true ? copy('Yes', '支持') : value === false ? copy('No', '不支持') : copy('Unknown', '未知');
  const price = (recorder: Recorder) => ([
    ['monthlyPrice', copy('/ month', '/ 月')], ['quarterlyPrice', copy('/ quarter', '/ 季度')],
    ['yearlyPrice', copy('/ year', '/ 年')], ['lifetimePrice', copy('one-time', '买断')],
  ] as const).flatMap(([key, unit]) => typeof recorder[key] === 'number'
    ? [`$${recorder[key]} ${unit}`] : []).join(' · ') || copy('Not documented', '暂无记录');
  const links = (items: Recorder[]) => <ul className="guide-products">{items.map(recorder => <li key={recorder.id}><a href={`#${recorder.id}`}>{recorder.name}</a></li>)}</ul>;
  const url = new URL(alternativePaths[language], siteUrl).href;
  const structuredData = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', '@id': `${url}#webpage`, url, name: title, inLanguage: language,
      isPartOf: { '@id': `${siteUrl}#website` }, mainEntity: { '@id': `${url}#alternatives` }, breadcrumb: { '@id': `${url}#breadcrumb` } },
    { '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Recorder Select', item: siteUrl.href },
      { '@type': 'ListItem', position: 2, name: title, item: url },
    ] },
    { '@type': 'ItemList', '@id': `${url}#alternatives`, name: title, numberOfItems: alternatives.length,
      itemListOrder: 'https://schema.org/ItemListUnordered', itemListElement: alternatives.map((recorder, index) => ({
        '@type': 'ListItem', position: index + 1, item: { '@type': 'SoftwareApplication', name: recorder.name,
          url: recorder.website, applicationCategory: 'MultimediaApplication',
          operatingSystem: recorder.platforms?.map(platform => platformNames[platform]).join(', ') },
      })) },
  ] };

  return <main className="alternative-guide" lang={language} data-content-language={language}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
    <nav className="guide-nav" aria-label={copy('Guide navigation', '指南导航')}>
      <a href="/">Recorder Select</a>
      <a href={alternativePaths[zh ? 'en' : 'zh-CN']} hrefLang={zh ? 'en' : 'zh-CN'} lang={zh ? 'en' : 'zh-CN'}>{zh ? 'English' : '简体中文'}</a>
    </nav>
    <header>
      <p className="guide-kicker">{copy('Screen recorder comparison', '录屏软件选购指南')}</p>
      <h1>{title}</h1>
      <p>{copy(`Compare ${alternatives.length} alternatives for Mac, Windows and Linux. Start with your operating system and budget, then compare the recording, cursor and export features that matter to your workflow.`, `对比 ${alternatives.length} 款适用于 Mac、Windows 和 Linux 的替代工具。先按系统与预算缩小范围，再比较录制、光标效果和导出能力，找到适合自己工作流程的录屏软件。`)}</p>
      <a className="guide-cta" href="/">{copy('Open the interactive comparison', '打开完整交互对比表')}</a>
    </header>
    <nav className="guide-contents" aria-label={copy('On this page', '本页目录')}>
      {([['platforms', copy('Mac, Windows & Linux', '按操作系统选择')], ['free-open-source', copy('Free & open source', '免费与开源')], ['comparison', copy('Feature comparison', '功能与价格对比')], ['workflow', copy('Auto zoom & demos', '自动缩放与演示')], ['methodology', copy('Benchmarks & sources', '实测与数据来源')]]).map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
    </nav>
    <section>
      <h2>{copy('What makes a good Screen Studio alternative?', '什么样的软件适合替代 Screen Studio？')}</h2>
      <p>{copy('Screen Studio combines macOS screen capture with automatic zoom and cursor smoothing for demos and tutorials. A replacement should solve the reason you are switching: another operating system, a different payment model, editable effects or a better fit for your recording workflow.', 'Screen Studio 将 macOS 录屏、自动缩放和平滑光标结合起来，适合制作演示和教程。选择平替时，先明确更换的原因：需要其他操作系统、希望改变付费方式、需要更灵活的效果编辑，还是录制流程不够合适。')} <a href="https://screen.studio/">{copy('See Screen Studio’s official feature overview.', '查看 Screen Studio 官方功能介绍。')}</a></p>
      <p>{copy('The directory below includes both demo-focused editors and broader capture tools. They are candidates to compare, not identical replacements or a best-to-worst ranking. Use the same short recording in your shortlisted apps before deciding.', '下方目录同时包含偏重演示编辑的软件和更通用的屏幕捕获工具。它们是可供比较的候选项，并非功能完全相同的替代品，也不是优劣排行榜。建议用同一段录制任务试用候选软件后再决定。')}</p>
    </section>
    <section id="platforms">
      <h2>{copy('Choose a screen recorder for your operating system', '按操作系统选择录屏软件')}</h2>
      {(['mac', 'win', 'linux'] as Platform[]).map(platform => <section key={platform} id={`${platform}-alternatives`}>
        <h3>{copy(`Screen Studio alternatives for ${platformNames[platform]}`, `${platformNames[platform]} 录屏软件与 Screen Studio 平替`)}</h3>
        <p>{platform === 'mac' ? copy('Check Apple silicon or Intel compatibility, system audio capture and the ability to edit your recording after capture. For frequent demos, compare preview responsiveness as well as final export time.', '检查 Apple 芯片或 Intel 兼容性、系统音频录制，以及录制后的编辑能力。经常制作演示时，除导出耗时外，也要留意编辑预览是否流畅。') : platform === 'win' ? copy('Start with tools that list Windows support. Then check your Windows version, microphone and system audio workflow, and whether cursor effects remain editable after recording.', '先选择明确支持 Windows 的工具，再核对系统版本、麦克风与系统音频录制方式，以及录制后能否继续编辑光标效果。') : copy('Check the app’s Linux package and its support for your desktop session, including Wayland or X11 capture and audio. Platform availability alone does not confirm every feature works in your environment.', '检查 Linux 安装包和桌面会话兼容性，包括 Wayland 或 X11 环境下的画面与音频捕获。标记支持某个平台，并不意味着所有功能都适用于你的环境。')}</p>
        {links(alternatives.filter(recorder => recorder.platforms?.includes(platform)))}
      </section>)}
    </section>
    <section id="free-open-source">
      <h2>{copy('Free and open-source Screen Studio alternatives', '免费与开源的 Screen Studio 平替')}</h2>
      <p>{copy('Open source describes source-code availability; it does not guarantee free hosted services, free packaged downloads or every export feature. The following tools are marked open source in our dataset. Check their official license and download terms.', '开源表示源代码可获取，不代表托管服务、打包下载或全部导出功能都免费。以下工具在我们的数据中标记为开源，请通过官网核对许可证与下载条款。')}</p>
      {links(alternatives.filter(recorder => recorder.isOpenSource === true))}
      <p>{copy('OpenScreen describes its recorder and editor as free and open source. Recordly also presents an open-source recording workflow. Try a complete export before choosing: check watermark rules, resolution, recording limits and any paid services separately.', 'OpenScreen 在官网将其录屏与编辑器介绍为免费开源工具，Recordly 也提供开源录屏工作流程。选用前请完整导出一次，分别检查水印、分辨率、录制时长限制及额外付费服务。')} <a href="https://getopenscreen.com/">OpenScreen</a> · <a href="https://recordly.dev/">Recordly</a></p>
    </section>
    <section id="comparison">
      <h2>{copy('Compare features and documented prices', '对比功能与已收录价格')}</h2>
      <p>{copy('Prices below are recorded in USD, with each billing period shown separately. Missing prices mean not documented, not free. An open-source flag is separate from pricing. Visit the linked official website to confirm current plans and platform requirements.', '下表价格以美元计价，并分别注明付费周期。没有价格记录不代表免费，开源状态与收费方式也分别列出。请通过产品链接前往官网，确认当前套餐与系统要求。')}</p>
      <div className="guide-table-scroll" role="region" aria-label={copy('Recorder comparison table; scroll horizontally for more columns', '录屏对比表，可横向滚动查看其余列')} tabIndex={0}>
        <table><caption>{copy('Screen Studio baseline and alternative screen recorders', 'Screen Studio 基准与替代录屏工具')}</caption><thead><tr>
          {[copy('Recorder', '录屏工具'), copy('Platforms', '平台'), copy('Open source', '开源'), copy('Cursor replacement', '替换光标'), copy('GIF export', 'GIF 导出'), copy('Documented prices (USD)', '已收录价格（美元）')].map(label => <th scope="col" key={label}>{label}</th>)}
        </tr></thead><tbody>{recorders.map(recorder => <tr key={recorder.id} id={recorder.id}>
          <th scope="row"><a href={recorder.website}>{recorder.name}</a>{recorder.id === 'screen-studio' && <small>{copy('Baseline', '对比基准')}</small>}</th>
          <td>{recorder.platforms?.map(platform => platformNames[platform]).join(', ') || copy('Unknown', '未知')}</td>
          <td>{recorder.isOpenSource === null ? copy('Unknown', '未知') : recorder.isOpenSource ? copy('Yes', '是') : copy('No', '否')}</td>
          <td>{bool(recorder.supportsCursorStyleReplacement)}</td><td>{bool(recorder.supportsGifExport)}</td><td>{price(recorder)}</td>
        </tr>)}</tbody></table>
      </div>
      <p><a href="/">{copy('Compare the full dataset, adjust feature weights and explore measured performance.', '查看完整数据、调整功能权重并探索性能实测。')}</a></p>
    </section>
    <section id="workflow">
      <h2>{copy('Auto zoom, cursor effects and product demos', '自动缩放、光标效果与产品演示录屏')}</h2>
      <p>{copy('Auto zoom is only one part of a polished tutorial. Check whether you can reposition zooms, control timing, hide or replace the cursor, keep small text readable and export the aspect ratio you need. Cursor replacement in the table does not imply automatic zoom or cursor smoothing.', '自动缩放只是教程观感的一部分。还应检查能否重新定位缩放区域、调整节奏、隐藏或替换光标、保持小字清晰，并导出需要的画面比例。表格中的“替换光标”不代表自动缩放或光标平滑。')}</p>
      <p>{copy('For a Windows or Mac auto-editing candidate, FocuSee’s official site describes an automatic screen-recording editing workflow. Compare its output with Screen Studio using the same clicks, typing and narration; similar feature names do not establish equal animation quality.', '需要 Windows 或 Mac 自动编辑工具时，可以查看 FocuSee 官网介绍的录屏自动编辑流程。用相同的点击、输入和讲解与 Screen Studio 对比导出结果；相似的功能名称并不代表相同的动画质量。')} <a href="https://focusee.imobie.com/">{copy('FocuSee official features', 'FocuSee 官方功能说明')}</a></p>
      <h3>{copy('A practical trial recording', '用一次真实录制完成试用')}</h3>
      <ol>
        <li>{copy('Record a window, type in a small text field and move between two controls while narrating.', '录制一个窗口，在小输入框内打字，切换两个控件，同时进行讲解。')}</li>
        <li>{copy('Edit a zoom, adjust the cursor and remove a pause. Check whether the editor stays responsive.', '编辑一次缩放、调整光标并删除停顿，检查编辑器是否仍然流畅。')}</li>
        <li>{copy('Export the same resolution and frame rate in each app. Compare text clarity, audio sync, export time and file size.', '在各软件中按相同分辨率和帧率导出，对比文字清晰度、音画同步、导出耗时与文件体积。')}</li>
      </ol>
    </section>
    <section id="methodology">
      <h2>{copy('How to read our data and benchmarks', '如何理解数据与性能实测')}</h2>
      <p>{copy('This guide uses the same maintained product dataset as the interactive comparison. Product names link to official websites. Unknown capabilities remain unknown, and the list order is not an editorial recommendation. You can submit corrections from the comparison site.', '本指南与交互对比表共用维护中的产品数据，产品名称链接至官网。未知能力保留为未知，列表顺序不表示编辑推荐排名。发现问题时，可以通过网站提交修正。')}</p>
      <p>{copy('Our performance data covers measured recording, playback and export workloads on macOS. Compare the machine, app version and workload before drawing conclusions. A macOS result is not a Windows or Linux benchmark; an unmeasured app is not a slow app. Weighted comparison scores are preference-based calculations, not user reviews.', '我们的性能数据涵盖 macOS 上实测的录制、播放与导出任务。得出结论前，请对照设备、软件版本和测试负载。macOS 结果不能作为 Windows 或 Linux 的测试成绩；未测试不代表性能差。加权得分是根据偏好计算的结果，不是用户评分。')}</p>
      <a href="/submit">{copy('Contribute a recorder or correction', '补充录屏软件或修正数据')}</a>
    </section>
  </main>;
}
