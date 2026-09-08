import { recorders } from '../lib/recorders';

const platformNames = { mac: 'macOS', win: 'Windows', linux: 'Linux' };

/** Server-rendered text keeps the software directory readable without Canvas or JavaScript. */
export function RecorderOverview() {
  return <section className="recorder-overview shell" lang="en" aria-labelledby="recorder-overview-title">
    <h1 id="recorder-overview-title">Compare screen recording software</h1>
    <p>Explore {recorders.length} screen recorders for Mac, Windows and Linux. Compare pricing, recording and editing features, auto zoom, cursor effects, and measured performance to find the right tool for tutorials, demos and presentations.</p>
    <details>
      <summary>Browse all {recorders.length} screen recorders</summary>
      <ul className="recorder-directory">{recorders.map(recorder => <li key={recorder.id}>
        <a href={recorder.website} target="_blank" rel="noreferrer">{recorder.name}<span aria-hidden="true"> ↗</span></a>
        <span>{recorder.platforms?.map(platform => platformNames[platform]).join(', ') || 'Platform not documented'}{recorder.isOpenSource ? ' · Open source' : ''}</span>
      </li>)}</ul>
    </details>
    <details>
      <summary>How to compare features, prices and benchmarks</summary>
      <p>Filter by operating system and the features you need, select recorders, then compare them side by side. If you are looking for Screen Studio alternatives, compare auto zoom, cursor styling, device frames and export options.</p>
      <p>Pricing includes monthly, yearly and lifetime plans where documented. Missing values mean unknown, not free. Check the software’s official website for current pricing and availability.</p>
      <p>Performance measurements cover recording, playback and export on macOS. Compare CPU usage, memory usage and export duration alongside the recorded workload. Scores reflect your chosen feature weights; they are not customer ratings. Unmeasured products and missing features are marked as unknown.</p>
    </details>
  </section>;
}
