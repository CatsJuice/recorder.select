import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { createServer } from 'vite';

// Use the project's TypeScript resolver; no additional test runner dependency.
const server = await createServer({ configFile: false, server: { middlewareMode: true, watch: null, ws: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
after(() => server.close());
const layout = await server.ssrLoadModule('/lib/canvas-table-layout.ts');
const { createComparisonModel } = await server.ssrLoadModule('/lib/comparison-table-model.ts');
const { performanceTimelineScale, performanceTimelinePoints } = await server.ssrLoadModule('/lib/performance.ts');
const { calculateRecorderScore, createScoreContributions } = await server.ssrLoadModule('/lib/recorder-scoring.ts');
const { fieldDefinitions, fieldGroups, recorders } = await server.ssrLoadModule('/lib/recorders.ts');
const { CanvasTablePainter } = await server.ssrLoadModule('/lib/canvas-table-painter.ts');
const { CanvasTableMotion, motionHitTest, TABLE_MOTION_DURATION } = await server.ssrLoadModule('/lib/canvas-table-motion.ts');
const { CanvasTableGesture, attachTableGesture } = await server.ssrLoadModule('/lib/canvas-table-gesture.ts');
const { CanvasScrollEdge } = await server.ssrLoadModule('/lib/canvas-scroll-edge.ts');
const base = {
  products: recorders.slice(0, 3), compareMode: false, hideIdentical: false, identicalFieldKeys: new Set(),
  expandedGroups: Object.fromEntries(fieldGroups.map(group => [group.key, group.defaultExpanded ?? true])),
  subjectiveReviewsExpanded: false, performanceProfiles: {}, performanceStatus: 'loaded', fieldWeights: {}, locale: 'en',
  t: key => key, fieldLabel: field => field.label, fieldUnit: field => field.unit, groupLabel: group => group.label,
};

test('additional recording capabilities are supported only by Matte', () => {
  assert.equal(recorders.filter(recorder => recorder.id === 'matte').length, 1);
  for (const key of ['supportsVirtualMachineRecording', 'supportsSimultaneousMultiDeviceRecording']) {
    const field = fieldDefinitions.find(field => field.key === key);
    assert.equal(field?.group, 'recording');
    assert.equal(field?.type, 'boolean');
    for (const recorder of recorders) assert.equal(recorder[key] === true, recorder.id === 'matte', `${recorder.id}: ${key}`);
    const preview = fieldGroups.find(group => group.key === 'recording').getCollapsedPreview;
    const before = preview(recorders[0]).label.split('/').map(Number);
    const after = preview({ ...recorders[0], [key]: true }).label.split('/').map(Number);
    assert.equal(after[0], before[0] + 1);
    assert.equal(after[1], before[1]);
  }
});

test('touch intent ignores jitter and locks the dominant axis until the next contact', () => {
  const gesture = new CanvasTableGesture();
  gesture.start(100, 100, 200, 300, 0);
  gesture.move(104, 105, 10, 1000, 1000);
  assert.equal(gesture.axis, null);
  assert.equal(gesture.left, 200);
  assert.equal(gesture.top, 300);
  gesture.move(80, 88, 20, 1000, 1000);
  assert.equal(gesture.axis, 'x');
  gesture.move(70, 0, 30, 1000, 1000);
  assert.equal(gesture.left, 230);
  assert.equal(gesture.top, 300, 'cross-axis drift stays frozen');
  gesture.release(35);
  gesture.step(51, 1000, 1000);
  assert.ok(gesture.left > 230);
  assert.equal(gesture.top, 300, 'momentum is also locked');
  gesture.start(100, 100, gesture.left, 300, 60);
  gesture.move(88, 80, 80, 1000, 1000);
  assert.equal(gesture.axis, 'y');
  assert.equal(gesture.top, 320);
});

test('momentum is elapsed-time based, interruptible, bounded and cancelled after a hold', () => {
  const make = () => {
    const gesture = new CanvasTableGesture();
    gesture.start(100, 100, 100, 200, 0);
    gesture.move(80, 100, 20, 1000, 1000);
    gesture.release(20);
    return gesture;
  };
  const slow = make(), fast = make();
  slow.step(52, 1000, 1000);
  fast.step(36, 1000, 1000); fast.step(52, 1000, 1000);
  assert.ok(Math.abs(slow.left - fast.left) < .00001);
  fast.release(52, true);
  assert.equal(fast.step(68, 1000, 1000), false);
  const held = make(); held.release(150);
  assert.equal(held.step(166, 1000, 1000), false);
  const edge = make(); edge.step(60, 125, 1000);
  assert.equal(edge.left, 125);
  assert.equal(edge.step(80, 125, 1000), false);
  edge.start(0, 0, 0, 0, 100);
  edge.move(10, 30, 120, 0, 0);
  assert.equal(edge.left, 0); assert.equal(edge.top, 0);
});

test('gesture adapter coalesces input, suppresses drag clicks, preserves taps and cleans up', () => {
  const listeners = new Map();
  let capture = false, frames = 0, cancelledTaps = 0, writes = 0, left = 100;
  const root = {
    addEventListener: (name, handler) => listeners.set(name, handler),
    removeEventListener: name => listeners.delete(name),
    hasPointerCapture: () => capture, setPointerCapture: () => { capture = true; }, releasePointerCapture: () => { capture = false; },
  };
  const scroller = { scrollTop: 200, scrollWidth: 2000, scrollHeight: 3000, clientWidth: 390, clientHeight: 700,
    get scrollLeft() { return left; }, set scrollLeft(value) { writes++; left = value; } };
  const adapter = attachTableGesture(root, scroller, () => frames++, () => cancelledTaps++);
  const event = { pointerType: 'touch', isPrimary: true, pointerId: 1, clientX: 100, clientY: 100, timeStamp: 0, target: { closest: () => null } };
  listeners.get('pointerdown')(event);
  listeners.get('pointermove')({ ...event, clientX: 80, timeStamp: 20 });
  listeners.get('lostpointercapture')({ ...event, type: 'lostpointercapture', timeStamp: 20 });
  listeners.get('pointermove')({ ...event, clientX: 60, clientY: 0, timeStamp: 40 });
  assert.equal(writes, 0, 'events do not synchronously write scroll position');
  adapter.update(40);
  assert.equal(writes, 1); assert.equal(left, 140); assert.equal(scroller.scrollTop, 200);
  assert.equal(cancelledTaps, 2); assert.ok(frames > 0);
  listeners.get('pointerup')({ ...event, type: 'pointerup', timeStamp: 40 });
  adapter.update(56);
  assert.ok(left > 140);
  let prevented = 0;
  const click = { detail: 1, preventDefault: () => prevented++, stopPropagation() {} };
  listeners.get('click')(click); assert.equal(prevented, 1);
  listeners.get('pointerdown')({ ...event, timeStamp: 60 });
  listeners.get('pointerup')({ ...event, type: 'pointerup', timeStamp: 70 });
  listeners.get('click')(click); assert.equal(prevented, 1, 'tap remains native');
  listeners.get('pointerdown')({ ...event, timeStamp: 80 });
  listeners.get('pointerdown')({ ...event, isPrimary: false, pointerId: 2, timeStamp: 81 });
  listeners.get('pointermove')({ ...event, clientX: 0, timeStamp: 90 });
  const before = left; adapter.update(90); assert.equal(left, before, 'pinch cancels panning');
  adapter.dispose(); assert.equal(listeners.size, 0);
});

test('edge blur uses a 1x backing store while sampling the full retina source', () => {
  const previousDocument = globalThis.document;
  const calls = [];
  const canvas = () => ({ width: 0, height: 0, getContext: () => new Proxy({
    drawImage: (...args) => calls.push(args), createLinearGradient: () => ({ addColorStop() {} }),
  }, { get: (target, key) => key in target ? target[key] : () => {} }) });
  globalThis.document = { createElement: canvas };
  try {
    const edge = new CanvasScrollEdge(), target = canvas(), source = { width: 1170, height: 2100 };
    edge.draw(target, source, 80, 700, 3, 1, [[0, 48]]);
    assert.equal(target.width, 80); assert.equal(target.height, 700);
    assert.deepEqual(calls[0], [source, 840, 0, 330, 2100, 0, 30, 110, 700]);
    edge.dispose();
  } finally { globalThis.document = previousDocument; }
});

test('hit testing respects both frozen panes, exact edges and empty space', () => {
  const rows = [{ top: 0, height: 48 }, { top: 48, height: 72 }];
  assert.equal(layout.rowAt(rows, 48), 1);
  assert.equal(layout.rowAt(rows, 120), 2);
  const hit = (x, y) => layout.hitTest(rows, 30, 1000, 600, 296, 48, x, y);
  assert.deepEqual(hit(189, 167), { row: -1, column: -1 });
  assert.deepEqual(hit(190, 167), { row: -1, column: 2 });
  assert.deepEqual(hit(189, 168), { row: 1, column: -1 });
  assert.deepEqual(hit(338, 168), { row: 1, column: 3 });
  assert.equal(hit(1000, 200), null);
  assert.equal(hit(200, 240), null);
  assert.equal(layout.hitTest(rows, 0, 1000, 600, 0, 0, 200, 40), null);
});

test('visible work stays bounded at 10,000 columns × 10,000 rows', () => {
  const rows = Array.from({ length: 10000 }, (_, index) => ({ top: index * 60, height: 60 }));
  const range = layout.visibleRange(rows, 10000, 1440, 900, 100000, 300000);
  assert.ok(range.endColumn - range.firstColumn <= 10);
  assert.ok(range.endRow - range.firstRow <= 14);
  assert.equal(range.firstRow, 5000);
  assert.equal(range.firstColumn, Math.floor(100000 / 148));
  assert.equal(layout.columnWidth(1000, 2), 405);
});

test('collapsed descendants never enter the row model; nested expansion is retained', () => {
  const expanded = createComparisonModel({ ...base, expandedGroups: Object.fromEntries(fieldGroups.map(group => [group.key, true])) });
  const collapsed = createComparisonModel({ ...base, expandedGroups: Object.fromEntries(fieldGroups.map(group => [group.key, false])) });
  assert.ok(expanded.rows.length > collapsed.rows.length);
  const nested = fieldGroups.find(group => group.parentKey);
  assert.ok(!collapsed.rows.some(row => row.id === nested.key));
  assert.ok(expanded.rows.some(row => row.id === nested.key));
  for (let index = 1; index < expanded.rows.length; index++) assert.equal(expanded.rows[index].top, expanded.rows[index - 1].top + expanded.rows[index - 1].height);
});

test('hide-identical removes complete groups and metadata, retaining subjective reviews', () => {
  const model = createComparisonModel({ ...base, compareMode: true, hideIdentical: true, identicalFieldKeys: new Set(fieldDefinitions.map(field => field.key)) });
  assert.deepEqual(model.rows.map(row => row.id), ['subjectiveReviews']);
  const single = createComparisonModel({ ...base, products: [base.products[0]], compareMode: true, hideIdentical: true });
  assert.ok(single.rows.length > 1);
});

test('cell formatting retains false, zero, unknown, icons, units and cached values', () => {
  const product = { ...recorders[0], monthlyPrice: 0, supportsCli: false, appSizeMB: null, platforms: ['mac', 'win'] };
  const model = createComparisonModel({ ...base, products: [product], expandedGroups: Object.fromEntries(fieldGroups.map(group => [group.key, true])) });
  const value = key => model.rows.find(row => row.id === key).cell(0);
  assert.equal(value('monthlyPrice').text, 'free');
  assert.equal(value('supportsCli').boolean, false);
  assert.equal(value('appSizeMB').muted, true);
  assert.deepEqual(value('platforms').icons, ['mac', 'win']);
  assert.equal(value('monthlyPrice'), value('monthlyPrice'));
});

const run = (value, workloadLabel) => ({ workloadLabel, scenario: 'recording', summary: { durationSeconds: 1, averageCPUPercent: value, peakCPUPercent: value, averagePhysicalFootprintBytes: 1, peakPhysicalFootprintBytes: 1 }, samples: [{ elapsedSeconds: 0, cpuPercent: value, physicalFootprintBytes: 1 }, { elapsedSeconds: 1, cpuPercent: value, physicalFootprintBytes: 1 }] });
test('performance extremes compare the visible row across workload labels; ties remain neutral', () => {
  const products = ['a', 'b', 'c'].map(id => ({ ...recorders[0], id }));
  const model = createComparisonModel({ ...base, products, expandedGroups: Object.fromEntries(fieldGroups.map(group => [group.key, true])), performanceProfiles: { a: { recording: run(10, '1080p') }, b: { recording: run(20, '1080p') }, c: { recording: run(1, '4K') } } });
  const row = model.rows.find(row => row.id === 'recordingCpuAverage');
  assert.equal(row.cell(0).extreme, undefined);
  assert.equal(row.cell(1).extreme, 'high');
  assert.equal(row.cell(2).extreme, 'low');
  assert.equal(row.cell(1).bar, 1);
  assert.equal(row.cell(0).secondary, '1080p');
  const tied = createComparisonModel({ ...base, products, expandedGroups: Object.fromEntries(fieldGroups.map(group => [group.key, true])), performanceProfiles: Object.fromEntries(products.map(product => [product.id, { recording: run(10, '1080p') }])) });
  const tiedRow = tied.rows.find(row => row.id === 'recordingCpuAverage');
  assert.ok(products.every((_, index) => tiedRow.cell(index).extreme === undefined));
});

test('adding a slower exporter with an unknown workload updates extrema, including after filtering', () => {
  const products = ['fast', 'previous-slow', 'bettershot', 'missing'].map(id => ({ ...recorders[0], id }));
  const profiles = Object.fromEntries(products.slice(0, 3).map((product, index) => {
    const entry = run(1, ['1080p 60fps balance', '1080p 60fps', 'Export settings unspecified'][index]);
    return [product.id, { export: { ...entry, scenario: 'export', summary: { ...entry.summary, durationSeconds: [11.51, 30.34, 214.96][index] } } }];
  }));
  const rowFor = visible => createComparisonModel({ ...base, products: visible, performanceProfiles: profiles, expandedGroups: Object.fromEntries(fieldGroups.map(group => [group.key, true])) }).rows.find(row => row.id === 'exportDuration');
  const before = rowFor(products.slice(0, 2));
  assert.equal(before.cell(1).extreme, 'high');
  const after = rowFor(products);
  assert.deepEqual(products.map((_, index) => after.cell(index).extreme), ['low', undefined, 'high', undefined]);
  assert.equal(after.cell(2).bar, 1);
  assert.equal(after.cell(1).bar, 30.34 / 214.96);
  const filtered = rowFor(products.slice(1, 3));
  assert.equal(filtered.cell(0).extreme, 'low');
  assert.equal(filtered.cell(1).extreme, 'high');
  assert.equal(rowFor([products[2]]).cell(0).extreme, undefined);
});

test('reviewed outliers keep full bars but do not affect normal extrema or scaling', async () => {
  const { generatedPerformanceProfiles } = await server.ssrLoadModule('/lib/performance-profiles.generated.ts');
  assert.deepEqual(generatedPerformanceProfiles.bettershot.export.outlierFields, ['exportDuration']);
  const products = ['normal-a', 'normal-b', 'bettershot'].map(id => ({ ...recorders[0], id }));
  const profiles = Object.fromEntries(products.map((product, index) => {
    const entry = run(10 + index, 'test');
    return [product.id, { export: index === 2 ? generatedPerformanceProfiles.bettershot.export : { ...entry, scenario: 'export', summary: { ...entry.summary, durationSeconds: [10, 20][index] } } }];
  }));
  const modelFor = visible => createComparisonModel({ ...base, products: visible, performanceProfiles: profiles, expandedGroups: Object.fromEntries(fieldGroups.map(group => [group.key, true])) });
  const row = modelFor(products).rows.find(row => row.id === 'exportDuration');
  assert.deepEqual(products.map((_, index) => row.cell(index).bar), [.5, 1, 1]);
  assert.deepEqual(products.map((_, index) => row.cell(index).extreme), ['low', 'high', undefined]);
  assert.equal(row.cell(2).outlier, true);
  assert.equal(row.cell(2).text, '214.96 s');
  assert.equal(row.cell(2).secondary, profiles.bettershot.export.workloadLabel);
  assert.equal(modelFor(products).rows.find(row => row.id === 'exportCpuAverage').cell(2).outlier, false);
  const alone = modelFor([products[2]]).rows.find(row => row.id === 'exportDuration').cell(0);
  assert.equal(alone.outlier, true);
  assert.equal(alone.bar, 1);
  assert.equal(alone.extreme, undefined);
  const singleNormal = modelFor(products.slice(1)).rows.find(row => row.id === 'exportDuration');
  assert.equal(singleNormal.cell(0).bar, 1);
  assert.equal(singleNormal.cell(0).extreme, undefined);
});

test('outlier bars use a deeper fill and remain full height on desktop and mobile', () => {
  const painter = new CanvasTablePainter(() => {});
  const icons = [];
  painter.icon = (_ctx, key) => icons.push(key);
  const fills = [];
  const ctx = new Proxy({
    measureText: value => ({ width: value.length * 7 }),
    fillRect: (x, y, width, height) => fills.push({ color: ctx.fillStyle, x, y, width, height }),
  }, { get: (target, key) => key in target ? target[key] : () => {} });
  for (const mobile of [false, true]) {
    fills.length = 0;
    icons.length = 0;
    painter.cell(ctx, { text: '214.96 s', outlier: true, bar: 1 }, { height: 72 }, 0, 0, 156, mobile);
    assert.deepEqual(icons, ['warning']);
    assert.ok(fills.some(fill => fill.color === '#f4b4ae' && fill.y === 0 && fill.height === 72));
    fills.length = 0;
    painter.cell(ctx, { text: '20 s', extreme: 'high', bar: 1 }, { height: 72 }, 0, 0, 156, mobile);
    assert.ok(fills.some(fill => fill.color === '#fff0ed'));
  }
  painter.dispose();
});

test('timeline heat bands use all profiles and remain stable when products are filtered', () => {
  const products = [0, 25, 50, 75, 100].map((value, index) => ({ ...recorders[0], id: `heat-${index}` }));
  const profiles = Object.fromEntries(products.map((product, index) => [product.id, { recording: run(index * 25, '5K') }]));
  const scale = performanceTimelineScale(profiles, 'recording', 'cpu');
  assert.equal(scale.maximum, 100);
  assert.equal(scale.heatThresholds.length, 4);
  scale.heatThresholds.forEach((value, index) => assert.ok(Math.abs(value - (index + 1) / 5) < 1e-12));
  const options = { ...base, products, performanceProfiles: profiles, expandedGroups: Object.fromEntries(fieldGroups.map(group => [group.key, true])) };
  const cell = (model, column = 0) => model.rows.find(row => row.id === 'performanceRecordingCPU').cell(column);
  const all = cell(createComparisonModel(options), 2);
  const filtered = cell(createComparisonModel({ ...options, products: [products[2]], compareMode: true }));
  assert.deepEqual(filtered.sparkline, all.sparkline);
  assert.equal(filtered.sparkline[0][1], .5);
  assert.equal(filtered.heatThresholds, scale.heatThresholds);
  assert.equal(performanceTimelineScale(profiles, 'recording', 'cpu'), scale);
  assert.deepEqual(performanceTimelineScale(profiles, 'recording', 'memory').heatThresholds, []);
  assert.equal(performanceTimelineScale(profiles, 'preview', 'cpu').maximum, 0);
});

test('heat scales handle empty data, ties, invalid samples and system metric preference', () => {
  assert.deepEqual(performanceTimelineScale({}, 'recording', 'cpu'), { maximum: 0, heatThresholds: [] });
  const tied = { a: { recording: run(10) }, b: { recording: run(10) } };
  assert.deepEqual(performanceTimelineScale(tied, 'recording', 'cpu'), { maximum: 10, heatThresholds: [] });
  const mixed = run(1000);
  mixed.samples = [
    { elapsedSeconds: 0, cpuPercent: 1000, systemCPUPercent: 20, physicalFootprintBytes: 10 },
    { elapsedSeconds: 1, cpuPercent: 2000, systemCPUPercent: NaN, physicalFootprintBytes: 10 },
    { elapsedSeconds: 2, cpuPercent: 3000, physicalFootprintBytes: 10 },
    { elapsedSeconds: 3, cpuPercent: 4000, systemCPUPercent: 40, physicalFootprintBytes: 10 },
    { elapsedSeconds: Infinity, cpuPercent: 5000, systemCPUPercent: 500, physicalFootprintBytes: 10 },
  ];
  assert.deepEqual(performanceTimelinePoints(mixed, 'cpu'), [[0, 20], [3, 40]]);
  const scale = performanceTimelineScale({ a: { recording: mixed } }, 'recording', 'cpu');
  assert.equal(scale.maximum, 40);
  assert.ok(scale.heatThresholds.every((value, index, values) => value > 0 && value < 1 && (!index || value > values[index - 1])));
});

test('loading, failure and missing performance remain distinct', () => {
  for (const [status, text] of [['idle', 'performanceLoading'], ['loading', 'performanceLoading'], ['error', 'performanceLoadFailed'], ['loaded', 'unknown']]) {
    const model = createComparisonModel({ ...base, performanceStatus: status, expandedGroups: Object.fromEntries(fieldGroups.map(group => [group.key, true])) });
    assert.equal(model.rows.find(row => row.id === 'recordingCpuAverage').cell(0).text, text);
  }
});

test('peak-preserving timeline reduction is bounded and ordered', () => {
  const points = Array.from({ length: 100000 }, (_, index) => [index / 99999, index === 54321 ? 1 : .1]);
  const reduced = layout.downsample(points);
  assert.ok(reduced.length <= 322);
  assert.ok(reduced.some(point => point[1] === 1));
  assert.equal(reduced[0], points[0]);
  assert.equal(reduced.at(-1), points.at(-1));
  assert.ok(reduced.every((point, index) => !index || point[0] >= reduced[index - 1][0]));
});

test('numeric score ranks preserve free prices, ties, direction and unknowns', () => {
  const products = [0, 10, 10, 20, null].map((monthlyPrice, index) => ({ ...recorders[0], id: String(index), monthlyPrice, appSizeMB: monthlyPrice }));
  const fields = fieldDefinitions.filter(field => ['monthlyPrice', 'appSizeMB'].includes(field.key));
  const scores = createScoreContributions(products, fields);
  for (let field = 0; field < fields.length; field++) {
    assert.equal(scores['0'][field], 1);
    assert.equal(scores['1'][field], .5);
    assert.equal(scores['2'][field], .5);
    assert.ok(Math.abs(scores['3'][field] - .1) < 1e-10);
    assert.equal(scores['4'][field], 0);
  }
});

test('painter fetches only viewport cells, reuses text measurements and does not animate idle frames', () => {
  let fetched = 0;
  let measured = 0;
  let invalidated = 0;
  const rows = Array.from({ length: 10000 }, (_, index) => ({ id: `row-${index}`, label: 'Feature', level: 0, top: index * 60, height: 60, cell: () => { fetched++; return { text: 'Supported' }; } }));
  const products = Array.from({ length: 10000 }, (_, index) => ({ ...recorders[0], id: `product-${index}`, icon: undefined }));
  const ctx = new Proxy({ measureText: text => { measured++; return { width: text.length * 7 }; } }, { get: (target, key) => key in target ? target[key] : () => {} });
  const painter = new CanvasTablePainter(() => invalidated++);
  const scene = { products, rows, scores: {}, selected: new Set(), title: 'Recorders', subtitle: 'Select to compare', resetLabel: 'Reset', scoreLabel: 'score', emptyLabel: 'Empty' };
  const viewport = { width: 1440, height: 900, left: 100000, top: 300000 };
  const range = painter.draw(ctx, scene, viewport, null, null, null);
  const expected = (range.endColumn - range.firstColumn) * (range.endRow - range.firstRow);
  assert.equal(fetched, expected);
  assert.ok(fetched <= 140);
  const firstMeasurements = measured;
  painter.draw(ctx, scene, viewport, null, null, null);
  assert.equal(measured, firstMeasurements);
  assert.equal(invalidated, 0);
  painter.dispose();
  console.log(`100M logical cells: ${expected} body cells painted per 1440×900 frame; cached redraw adds 0 text measurements.`);
});

const motionScene = (rowIds, productIds = ['a', 'b', 'c']) => ({
  products: productIds.map(id => ({ ...recorders[0], id, icon: undefined })),
  rows: rowIds.map((id, index) => ({ id, label: id, level: 0, top: index * 60, height: 60, cell: column => ({ text: `${id}:${productIds[column]}` }) })),
  scores: {}, selected: new Set(), title: 'Recorders', subtitle: '', resetLabel: 'Reset', scoreLabel: 'score', emptyLabel: 'Empty',
});
const closeTo = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-5, `${actual} ≠ ${expected}`);

test('sorting translates whole columns by product ID on desktop and mobile', () => {
  for (const mobile of [false, true]) {
    const width = mobile ? 390 : 1000;
    const cellWidth = layout.columnWidth(width, 3, mobile);
    const motion = new CanvasTableMotion();
    motion.update({ ...motionScene(['row']), mobile }, width, 0);
    const target = { ...motionScene(['row'], ['c', 'b', 'a']), mobile };
    motion.update(target, width, 10);
    const start = motion.sample(10);
    assert.equal(start.running, true);
    assert.deepEqual(start.scene.columns.map(column => column.top), [2 * cellWidth, cellWidth, 0]);
    const middle = motion.sample(110);
    for (const [index, id] of ['c', 'b', 'a'].entries()) {
      assert.equal(middle.scene.products[index].id, id);
      assert.equal(middle.scene.rows[0].cell(index).text, `row:${id}`);
      closeTo(middle.scene.columns[index].width, cellWidth);
    }
    assert.ok(middle.scene.columns[0].top > 0 && middle.scene.columns[0].top < 2 * cellWidth);
    closeTo(middle.totalWidth, start.totalWidth);
    const done = motion.sample(10 + TABLE_MOTION_DURATION);
    assert.equal(done.scene, target);
    assert.equal(done.running, false);
  }
});

test('reordering retargets painted positions through reversal, filtering and resizing', () => {
  const motion = new CanvasTableMotion();
  const initial = motionScene(['row']);
  motion.update(initial, 1000, 0);
  motion.update(motionScene(['row'], ['c', 'b', 'a']), 1000, 10);
  const changes = [
    [90, initial, 1000],
    [150, motionScene(['row'], ['c', 'a']), 800],
    [200, initial, 1100],
  ];
  for (const [now, target, width] of changes) {
    const before = motion.sample(now).scene;
    motion.update(target, width, now);
    const after = motion.sample(now).scene;
    for (const previous of before.columns) {
      const current = after.columns.find(column => column.id === previous.id);
      closeTo(current.top, previous.top);
      closeTo(current.width, previous.width);
      closeTo(current.opacity, previous.opacity);
    }
  }
  assert.equal(motion.sample(450).scene, initial);
});

test('sorting culls by painted position and hits the topmost overlapping column', () => {
  const motion = new CanvasTableMotion();
  const ids = Array.from({ length: 100 }, (_, index) => `app-${index}`);
  motion.update(motionScene(['row'], ids), 1000, 0);
  motion.update(motionScene(['row'], ids.toReversed()), 1000, 10);
  const painter = new CanvasTablePainter(() => {});
  const ctx = new Proxy({ measureText: text => ({ width: text.length * 7 }) }, { get: (target, key) => key in target ? target[key] : () => {} });
  const start = motion.sample(10).scene;
  const painted = [];
  const cell = start.rows[0].cell;
  start.rows[0].cell = column => { painted.push(column); return cell(column); };
  const range = painter.draw(ctx, start, { width: 1000, height: 600, left: 0, top: 0 }, null, null, null);
  assert.deepEqual(range.columns, [94, 95, 96, 97, 98, 99]);
  assert.deepEqual(painted, range.columns, 'offscreen destination columns still paint at their current positions');
  assert.deepEqual(motionHitTest(start, 1000, 600, 0, 0, 200, 180), { row: 0, column: 99 });
  const crossing = motion.sample(10 + TABLE_MOTION_DURATION / 2).scene;
  const front = crossing.columns.at(-1);
  const left = front.top;
  for (const y of [40, 180]) {
    assert.deepEqual(motionHitTest(crossing, 1000, 600, left, 0, 210, y), { row: y < 168 ? -1 : 0, column: 99 });
  }
  assert.equal(motionHitTest(crossing, 1000, 600, left, 0, 990, 180), null, 'gaps between moving columns do not activate a product');
  painter.dispose();
});

test('reduced motion and disabled animation settle reordered columns immediately', () => {
  const motion = new CanvasTableMotion();
  const initial = motionScene(['row']);
  const target = motionScene(['row'], ['c', 'b', 'a']);
  motion.update(initial, 1000, 0);
  motion.update(target, 1000, 10, true);
  assert.equal(motion.sample(10).scene, target);
  assert.equal(motion.sample(10).running, false);
  motion.update(initial, 1000, 20);
  assert.equal(motion.sample(20).running, true);
  motion.finish();
  assert.equal(motion.sample(20).scene, initial);
});

test('technology labels align visible glyph bounds with icons and cache their measurements', () => {
  const painter = new CanvasTablePainter(() => {});
  let measurements = 0;
  let iconY = 0;
  let text = [];
  const metrics = value => ({ width: value.length * 7, actualBoundingBoxAscent: 7, actualBoundingBoxDescent: value.includes('g') ? 3 : 1 });
  const ctx = new Proxy({
    measureText: value => { measurements++; return metrics(value); },
    fillText: (value, x, y) => text.push({ value, y }),
  }, { get: (target, key) => key in target ? target[key] : () => {} });
  painter.icon = (_ctx, _key, _x, y) => { iconY = y; };
  for (const [icon, label] of [['native', 'Native'], ['electron', 'Electron'], ['tauri', 'Tauri'], ['native', 'Native\nLong']]) {
    for (const mobile of [false, true]) {
      const draw = () => painter.cell(ctx, { text: label, icons: [icon] }, { height: 60 }, 0, 100, 200, mobile);
      text = [];
      draw();
      const first = text[0], last = text.at(-1);
      const top = first.y - metrics(first.value).actualBoundingBoxAscent;
      const bottom = last.y + metrics(last.value).actualBoundingBoxDescent;
      closeTo((top + bottom) / 2, iconY);
      const measured = measurements;
      draw();
      assert.equal(measurements, measured, 'no new measurements on a cached redraw');
    }
  }
  const measured = measurements;
  painter.clearTextCache();
  painter.cell(ctx, { text: 'Native', icons: ['native'] }, { height: 60 }, 0, 100, 200);
  assert.ok(measurements > measured, 'font reload invalidates alignment metrics');
  painter.dispose();
});

test('expansion clips and fades new rows, moves neighbours, and releases the animation when done', () => {
  const motion = new CanvasTableMotion();
  const collapsed = motionScene(['group', 'tail']);
  const expanded = motionScene(['group', 'child', 'tail']);
  motion.update(collapsed, 1000, 0);
  assert.equal(motion.sample(0).running, false, 'no entrance animation on hydration');
  motion.update(expanded, 1000, 10);
  const start = motion.sample(10);
  assert.equal(start.scene.rows[1].height, 0);
  assert.equal(start.scene.rows[1].opacity, 0);
  assert.equal(start.scene.rows[2].top, 60);
  const middle = motion.sample(110);
  assert.ok(middle.scene.rows[1].height > 0 && middle.scene.rows[1].height < 60);
  assert.ok(middle.scene.rows[2].top > 60 && middle.scene.rows[2].top < 120);
  const end = motion.sample(10 + TABLE_MOTION_DURATION);
  assert.equal(end.running, false);
  assert.equal(end.scene, expanded, 'no retained transition scene after settling');
});

test('collapse keeps outgoing content until its height and opacity reach zero', () => {
  const motion = new CanvasTableMotion();
  motion.update(motionScene(['group', 'child', 'tail']), 1000, 0);
  const target = motionScene(['group', 'tail']);
  motion.update(target, 1000, 10);
  const middle = motion.sample(100);
  const child = middle.scene.rows[1];
  assert.equal(child.cell(0).text, 'child:a');
  assert.equal(child.targetIndex, -1);
  assert.ok(child.height > 0 && child.height < 60);
  assert.equal(middle.scene.rows[2].top, 60 + child.height);
  assert.equal(motion.sample(260).scene, target);
});

test('reversing an in-flight expansion starts from the exact displayed geometry', () => {
  const motion = new CanvasTableMotion();
  const closed = motionScene(['group', 'tail']);
  const opened = motionScene(['group', 'child', 'tail']);
  motion.update(closed, 1000, 0);
  motion.update(opened, 1000, 10);
  const before = motion.sample(110);
  motion.update(closed, 1000, 110);
  const after = motion.sample(110);
  before.scene.rows.forEach((row, index) => {
    closeTo(after.scene.rows[index].top, row.top);
    closeTo(after.scene.rows[index].height, row.height);
    closeTo(after.scene.rows[index].opacity, row.opacity);
  });
  assert.equal(motion.sample(360).scene, closed);
});

test('filtering columns preserves stable cell values and pointer targets while widths change', () => {
  const motion = new CanvasTableMotion();
  motion.update(motionScene(['row'], ['a', 'b', 'c']), 1000, 0);
  motion.update(motionScene(['row'], ['a', 'c']), 1000, 10);
  const middle = motion.sample(110).scene;
  assert.deepEqual(middle.products.map(product => product.id), ['a', 'b', 'c']);
  assert.deepEqual(middle.products.map((_, column) => middle.rows[0].cell(column).text), ['row:a', 'row:b', 'row:c']);
  const b = middle.columns[1];
  const c = middle.columns[2];
  assert.ok(b.width > 0 && b.width < 270);
  assert.equal(motionHitTest(middle, 1000, 600, 0, 0, 190 + b.top + 1, 180), null, 'exiting product is inert');
  assert.deepEqual(motionHitTest(middle, 1000, 600, 0, 0, 190 + c.top + 1, 180), { row: 0, column: 1 });
  assert.deepEqual(motionHitTest(middle, 1000, 600, 0, 0, 190 + c.top + 1, 40), { row: -1, column: 1 });
});

test('rapid successive filters retain earlier exits and can restore them without a jump', () => {
  const motion = new CanvasTableMotion();
  const full = motionScene(['row'], ['a', 'b', 'c']);
  motion.update(full, 1000, 0);
  motion.update(motionScene(['row'], ['b', 'c']), 1000, 10);
  motion.sample(90);
  motion.update(motionScene(['row'], ['c']), 1000, 90);
  const before = motion.sample(160);
  assert.deepEqual(before.scene.products.map((_, index) => before.scene.rows[0].cell(index).text), ['row:a', 'row:b', 'row:c']);
  motion.update(full, 1000, 160);
  const after = motion.sample(160);
  before.scene.columns.forEach((column, index) => closeTo(column.width, after.scene.columns[index].width));
  assert.equal(motion.sample(410).scene, full);
});

test('group chevrons and collapsed previews blend continuously, including a reversal', () => {
  const motion = new CanvasTableMotion();
  const closed = motionScene(['group']);
  closed.rows[0].expanded = false;
  const open = motionScene(['group', 'child']);
  open.rows[0].expanded = true;
  open.rows[0].cell = () => ({ text: '' });
  motion.update(closed, 1000, 0);
  motion.update(open, 1000, 10);
  const before = motion.sample(110).scene.rows[0];
  assert.ok(before.expandedProgress > 0 && before.expandedProgress < 1);
  const oldOpacity = before.cellLayers(0).find(layer => layer.cell.text === 'group:a').opacity;
  assert.ok(oldOpacity > 0 && oldOpacity < 1);
  motion.update(closed, 1000, 110);
  const after = motion.sample(110).scene.rows[0];
  closeTo(after.expandedProgress, before.expandedProgress);
  closeTo(after.cellLayers(0).filter(layer => layer.cell.text === 'group:a').reduce((sum, layer) => sum + layer.opacity, 0), oldOpacity);
});

test('reduced motion keeps target geometry and uses only a short fade; keyboard finish is instant', () => {
  const motion = new CanvasTableMotion();
  motion.update(motionScene(['group', 'tail']), 1000, 0, true);
  const expanded = motionScene(['group', 'child', 'tail']);
  motion.update(expanded, 1000, 10, true);
  const start = motion.sample(10);
  assert.deepEqual(start.scene.rows.map(row => [row.top, row.height]), expanded.rows.map(row => [row.top, row.height]));
  assert.equal(start.scene.rows[1].opacity, 0);
  assert.equal(motion.sample(160).running, false);
  motion.update(motionScene(['group']), 1000, 170, false);
  motion.finish();
  assert.equal(motion.sample(170).running, false);
  assert.equal(motion.sample(170).scene.rows.length, 1);
});

test('animation paints only visible cells and cleans up every outgoing column on no matches', () => {
  const motion = new CanvasTableMotion();
  const full = motionScene(Array.from({ length: 1000 }, (_, index) => `row-${index}`), Array.from({ length: 1000 }, (_, index) => `product-${index}`));
  motion.update(full, 1000, 0);
  motion.update({ ...full, products: [] }, 1000, 10);
  const scene = motion.sample(100).scene;
  let cells = 0;
  scene.rows.forEach(row => { const original = row.cell; row.cell = column => { cells++; return original(column); }; });
  const ctx = new Proxy({ measureText: text => ({ width: text.length * 7 }) }, { get: (target, key) => key in target ? target[key] : () => {} });
  const painter = new CanvasTablePainter(() => {});
  painter.draw(ctx, scene, { width: 1000, height: 600, left: 0, top: 0 }, null, null, null);
  assert.ok(cells < 200, `${cells} cells visited during exit`);
  assert.equal(motion.sample(260).scene.products.length, 0);
  assert.equal(motion.sample(260).scene.columns, undefined);
  painter.dispose();
});


test('mobile fields stack above values while category headings have no empty value strip', () => {
  const options = { ...base, expandedGroups: Object.fromEntries(fieldGroups.map(group => [group.key, true])) };
  const desktop = createComparisonModel(options);
  const mobile = createComparisonModel({ ...options, mobile: true });
  const find = (model, id) => model.rows.find(row => row.id === id);
  assert.equal(find(mobile, 'monthlyPrice').height, find(desktop, 'monthlyPrice').height + layout.MOBILE_LABEL_HEIGHT);
  assert.equal(find(mobile, 'subjectiveReviews').height, layout.MOBILE_LABEL_HEIGHT);
  assert.equal(find(mobile, 'performance').height, layout.MOBILE_LABEL_HEIGHT);
  assert.equal(find(mobile, 'performanceRecordingCPU').height, 84 + layout.MOBILE_LABEL_HEIGHT);
  assert.deepEqual(mobile.rows.map(row => row.id), desktop.rows.map(row => row.id));
  mobile.rows.forEach((row, index) => {
    assert.equal(row.labelHeight, layout.MOBILE_LABEL_HEIGHT);
    if (index) assert.equal(row.top, mobile.rows[index - 1].top + mobile.rows[index - 1].height);
  });
});

test('mobile labels stay hittable across horizontal scrolling and exact label/value boundaries', () => {
  const rows = [{ id: 'field', label: 'Field', top: 0, height: 100, labelHeight: 40, level: 0, cell: () => ({ text: 'value' }) }];
  const products = Array.from({ length: 10 }, (_, index) => ({ ...recorders[0], id: `mobile-${index}` }));
  const scene = { ...motionScene([]), mobile: true, rows, products };
  const hit = (left, x, y, top = 0) => {
    const expected = layout.hitTest(rows, products.length, 390, 700, left, top, x, y, true);
    assert.deepEqual(motionHitTest(scene, 390, 700, left, top, x, y), expected);
    return expected;
  };
  for (const left of [0, 148, 593]) {
    assert.deepEqual(hit(left, 12, 180), { row: 0, column: -1 });
    assert.deepEqual(hit(left, 389, 207), { row: 0, column: -1 });
    assert.deepEqual(hit(left, 12, 208), { row: 0, column: Math.floor((left + 12) / 148) });
  }
  assert.deepEqual(hit(148, 12, 100), { row: -1, column: 1 });
  assert.deepEqual(hit(148, 12, 168, 40), { row: 0, column: 1 });
  assert.equal(hit(0, 12, 268), null);
  assert.equal(hit(0, 390, 200), null);
  assert.equal(layout.columnWidth(390, 2, true), 195);
  assert.equal(layout.columnWidth(390, 1, true), 390);
});

test('mobile painter keeps label text fixed, scrolls values, and emits no grid borders', () => {
  const products = Array.from({ length: 5 }, (_, index) => ({ ...recorders[0], id: `mobile-${index}`, icon: undefined }));
  const rows = [{ id: 'field', label: 'Fixed field', top: 0, height: 100, labelHeight: 40, level: 0, cell: column => ({ text: `Value ${column}` }) }];
  const scene = { ...motionScene([]), mobile: true, products, rows };
  let text = [];
  let borders = 0;
  const ctx = new Proxy({ measureText: value => ({ width: value.length * 7 }), fillText: (value, x, y) => text.push({ value, x, y }), strokeRect: () => borders++ }, { get: (target, key) => key in target ? target[key] : () => {} });
  const painter = new CanvasTablePainter(() => {});
  painter.draw(ctx, scene, { width: 390, height: 700, left: 0, top: 0 }, null, null, null);
  const label = text.find(item => item.value === 'Fixed field');
  const value = text.find(item => item.value === 'Value 1');
  assert.ok(label.y < value.y);
  text = [];
  painter.draw(ctx, scene, { width: 390, height: 700, left: 148, top: 0 }, null, null, null);
  assert.deepEqual(text.find(item => item.value === 'Fixed field'), label);
  assert.equal(text.find(item => item.value === 'Value 1').x, value.x - 148);
  assert.equal(borders, 0);
  painter.dispose();
});

test('mobile filtering animates with full viewport columns and mode changes settle immediately', () => {
  const mobileScene = ids => ({ ...motionScene(['field'], ids), mobile: true, rows: [{ ...motionScene(['field']).rows[0], height: 100, labelHeight: 40 }] });
  const motion = new CanvasTableMotion();
  motion.update(mobileScene(['a', 'b', 'c']), 390, 0);
  assert.equal(motion.sample(0).totalWidth, 444);
  motion.update(mobileScene(['a', 'c']), 390, 10);
  const frame = motion.sample(110);
  assert.ok(frame.running);
  assert.deepEqual(motionHitTest(frame.scene, 390, 700, 60, 0, 20, 180), { row: 0, column: -1 });
  motion.finish();
  assert.equal(motion.sample(110).totalWidth, 390);
  motion.update(motionScene(['field'], ['a', 'c']), 1000, 120);
  assert.equal(motion.sample(120).running, false);
  assert.equal(motion.sample(120).totalWidth, 1000);
});

const stickyScene = () => {
  let top = 0;
  const rows = [
    ['parent', 0, 40, true], ['first-child', 1, 40, true], ['first-value', 2, 200],
    ['second-child', 1, 40, true], ['second-value', 2, 200],
    ['next-parent', 0, 40, true], ['last-value', 1, 100],
  ].map(([id, level, height, expanded]) => {
    const row = { id, label: id, level, height, expanded, labelHeight: 40, top, cell: () => ({ text: 'Value' }) };
    top += height;
    return row;
  });
  return { ...motionScene([]), mobile: true, rows };
};

test('mobile sticky headers stack ancestors and get pushed out at their own group boundary', () => {
  const { rows } = stickyScene();
  assert.deepEqual(layout.mobileStickyHeaders(rows, 100), [
    { row: 0, top: 168, height: 40, clipTop: 168 },
    { row: 1, top: 208, height: 40, clipTop: 208 },
  ]);
  assert.deepEqual(layout.mobileStickyHeaders(rows, 230).at(-1), { row: 1, top: 178, height: 40, clipTop: 208 });
  assert.deepEqual(layout.mobileStickyHeaders(rows, 250).map(header => header.row), [0, 3]);
  assert.deepEqual(layout.mobileStickyHeaders(rows, 490), [{ row: 0, top: 158, height: 40, clipTop: 168 }]);
  assert.deepEqual(layout.mobileStickyHeaders(rows, 520).map(header => header.row), [5]);
  assert.deepEqual(layout.mobileStickyHeaders(rows, 660), []);
  assert.deepEqual(layout.mobileStickyHeaders([], 0), []);
});

test('sticky hit testing uses visible clipped headers and keeps exiting headers inert', () => {
  const scene = stickyScene();
  for (const left of [0, 148]) {
    for (const [y, row] of [[180, 0], [210, 1], [220, 3]]) {
      assert.deepEqual(motionHitTest(scene, 390, 700, left, 230, 30, y), { row, column: -1 });
      assert.deepEqual(layout.hitTest(scene.rows, scene.products.length, 390, 700, left, 230, 30, y, true), { row, column: -1 });
    }
  }
  const exiting = { ...scene, rows: scene.rows.map((row, index) => ({ ...row, targetIndex: index === 1 ? -1 : index + 10 })) };
  assert.deepEqual(motionHitTest(exiting, 390, 700, 0, 100, 30, 180), { row: 10, column: -1 });
  assert.equal(motionHitTest(exiting, 390, 700, 0, 100, 30, 220), null);
});

test('painter redraws sticky ancestors outside the visible row range without duplicating labels', () => {
  const scene = stickyScene();
  scene.products = scene.products.map(product => ({ ...product, icon: undefined }));
  const text = [];
  const ctx = new Proxy({ measureText: value => ({ width: value.length * 7 }), fillText: (value, x, y) => text.push({ value, x, y }) }, { get: (target, key) => key in target ? target[key] : () => {} });
  const painter = new CanvasTablePainter(() => {});
  const range = painter.draw(ctx, scene, { width: 390, height: 700, left: 148, top: 100 }, null, null, null);
  assert.equal(range.firstRow, 2);
  assert.deepEqual(text.filter(item => item.value === 'parent'), [{ value: 'parent', x: 32, y: 188 }]);
  assert.deepEqual(text.filter(item => item.value === 'first-child'), [{ value: 'first-child', x: 42, y: 228 }]);
  painter.dispose();
});


test('app size bars share the visible maximum, mark extrema, and skip unknown sizes', () => {
  const products = [10, 50, 100, null].map((appSizeMB, index) => ({ ...recorders[0], id: `size-${index}`, appSizeMB }));
  const rowFor = products => createComparisonModel({ ...base, products }).rows.find(row => row.id === 'appSizeMB');
  const row = rowFor(products);
  assert.deepEqual(products.map((_, i) => row.cell(i).bar), [.1, .5, 1, undefined]);
  assert.deepEqual(products.map((_, i) => row.cell(i).extreme), ['low', undefined, 'high', undefined]);
  assert.equal(row.cell(3).muted, true);
  const filtered = rowFor(products.slice(0, 2));
  assert.equal(filtered.cell(0).bar, .2);
  assert.equal(filtered.cell(1).extreme, 'high');
  const tied = rowFor(products.slice(0, 2).map(product => ({ ...product, appSizeMB: 0 })));
  assert.equal(tied.cell(0).bar, 0);
  assert.equal(tied.cell(0).extreme, undefined);
});


test('recorder totals equal weighted contributions without deductions', () => {
  const fields = [{ key: 'first' }, { key: 'second' }];
  assert.equal(calculateRecorderScore([1, .5], fields, {}), 7.5);
  assert.equal(calculateRecorderScore([1, .5], fields, { first: 3, second: 8 }), 7);
  assert.equal(calculateRecorderScore([1, .5], fields, { first: 0, second: 0 }), 0);
});


test('Screendrop export measurement renders its warning and deeper background', async () => {
  const { generatedPerformanceProfiles } = await server.ssrLoadModule('/lib/performance-profiles.generated.ts');
  const products = recorders.filter(product => ['screendrop', 'bettershot', 'screen-studio'].includes(product.id));
  const column = products.findIndex(product => product.id === 'screendrop');
  const painter = new CanvasTablePainter(() => {});
  const icons = [];
  const fills = [];
  painter.icon = (_ctx, key) => icons.push(key);
  const ctx = new Proxy({
    measureText: value => ({ width: value.length * 7 }),
    fillRect: () => fills.push(ctx.fillStyle),
  }, { get: (target, key) => key in target ? target[key] : () => {} });
  for (const mobile of [false, true]) {
    const model = createComparisonModel({ ...base, mobile, products, performanceProfiles: generatedPerformanceProfiles, expandedGroups: Object.fromEntries(fieldGroups.map(group => [group.key, true])) });
    const row = model.rows.find(row => row.id === 'exportDuration');
    const cell = row.cell(column);
    assert.equal(cell.text, '140.47 s');
    assert.equal(cell.outlier, true);
    assert.equal(cell.bar, 1);
    assert.equal(cell.extreme, undefined);
    for (const dark of [false, true]) {
      painter.configure('Arial', dark);
      icons.length = 0;
      fills.length = 0;
      painter.cell(ctx, cell, row, 0, 0, 156, mobile);
      assert.deepEqual(icons, ['warning']);
      assert.ok(fills.includes(dark ? '#782e2a' : '#f4b4ae'));
    }
    assert.equal(model.rows.find(row => row.id === 'exportCpuAverage').cell(column).outlier, false);
  }
  painter.dispose();
});

test('header link overlay forwards wheel scrolling without doubling native body scrolling or capturing zoom', () => {
  const listeners = new Map();
  const root = {
    addEventListener: (name, handler) => listeners.set(name, handler),
    removeEventListener: name => listeners.delete(name),
    hasPointerCapture: () => false,
  };
  const scroller = { scrollLeft: 100, scrollTop: 200, scrollWidth: 2000, scrollHeight: 3000, clientWidth: 400, clientHeight: 700 };
  let frames = 0, prevented = 0;
  const adapter = attachTableGesture(root, scroller, () => frames++, () => {});
  const event = { target: { closest: selector => selector === '.canvas-table-links' ? {} : null }, deltaX: 60, deltaY: 0, deltaMode: 0, preventDefault: () => prevented++ };
  const wheel = listeners.get('wheel');
  wheel(event);
  assert.equal(scroller.scrollLeft, 160);
  assert.equal(scroller.scrollTop, 200);
  adapter.update(100);
  assert.equal(scroller.scrollLeft, 160, 'pending gesture frame does not undo wheel scrolling');
  wheel({ ...event, shiftKey: true, deltaX: 0, deltaY: 2, deltaMode: 1 });
  assert.equal(scroller.scrollLeft, 192, 'shift + line wheel scrolls horizontally');
  wheel({ ...event, deltaX: 1, deltaY: 1, deltaMode: 2 });
  assert.equal(scroller.scrollLeft, 592);
  assert.equal(scroller.scrollTop, 900);
  wheel({ ...event, deltaX: -9999 });
  assert.equal(scroller.scrollLeft, 0);
  wheel({ ...event, target: { closest: () => null } });
  wheel({ ...event, ctrlKey: true });
  wheel({ ...event, defaultPrevented: true });
  assert.equal(scroller.scrollLeft, 0, 'native body scroll, pinch zoom and handled events are untouched');
  assert.equal(prevented, 4);
  assert.equal(frames, 4);
  adapter.dispose();
  assert.equal(listeners.size, 0);
});
