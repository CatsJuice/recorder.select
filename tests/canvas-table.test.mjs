import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { createServer } from 'vite';

// Use the project's TypeScript resolver; no additional test runner dependency.
const server = await createServer({ configFile: false, server: { middlewareMode: true, watch: null, ws: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
after(() => server.close());
const layout = await server.ssrLoadModule('/lib/canvas-table-layout.ts');
const { createComparisonModel } = await server.ssrLoadModule('/lib/comparison-table-model.ts');
const { performanceTimelineScale, performanceTimelinePoints } = await server.ssrLoadModule('/lib/performance.ts');
const { createScoreContributions } = await server.ssrLoadModule('/lib/recorder-scoring.ts');
const { fieldDefinitions, fieldGroups, recorders } = await server.ssrLoadModule('/lib/recorders.ts');
const { CanvasTablePainter } = await server.ssrLoadModule('/lib/canvas-table-painter.ts');
const { CanvasTableMotion, motionHitTest, TABLE_MOTION_DURATION } = await server.ssrLoadModule('/lib/canvas-table-motion.ts');
const base = {
  products: recorders.slice(0, 3), compareMode: false, hideIdentical: false, identicalFieldKeys: new Set(),
  expandedGroups: Object.fromEntries(fieldGroups.map(group => [group.key, group.defaultExpanded ?? true])),
  subjectiveReviewsExpanded: false, performanceProfiles: {}, performanceStatus: 'loaded', fieldWeights: {}, locale: 'en',
  t: key => key, fieldLabel: field => field.label, fieldUnit: field => field.unit, groupLabel: group => group.label,
};

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
test('performance extremes compare only matching workloads; all equal values have no extreme', () => {
  const products = ['a', 'b', 'c'].map(id => ({ ...recorders[0], id }));
  const model = createComparisonModel({ ...base, products, expandedGroups: Object.fromEntries(fieldGroups.map(group => [group.key, true])), performanceProfiles: { a: { recording: run(10, '1080p') }, b: { recording: run(20, '1080p') }, c: { recording: run(1, '4K') } } });
  const row = model.rows.find(row => row.id === 'recordingCpuAverage');
  assert.equal(row.cell(0).extreme, 'low');
  assert.equal(row.cell(1).extreme, 'high');
  assert.equal(row.cell(2).extreme, undefined);
  assert.equal(row.cell(1).bar, 1);
  assert.equal(row.cell(0).secondary, '1080p');
  const tied = createComparisonModel({ ...base, products, expandedGroups: Object.fromEntries(fieldGroups.map(group => [group.key, true])), performanceProfiles: Object.fromEntries(products.map(product => [product.id, { recording: run(10, '1080p') }])) });
  const tiedRow = tied.rows.find(row => row.id === 'recordingCpuAverage');
  assert.ok(products.every((_, index) => tiedRow.cell(index).extreme === undefined));
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
