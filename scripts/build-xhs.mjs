import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import postcss from 'postcss';
import { transform } from 'lightningcss';

const root = process.cwd();
const out = path.join(root, 'dist-xhs');
await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });
function replace(source, pattern, value) {
  if (!source.match(pattern)) throw new Error(`XHS adaptation no longer matches: ${pattern}`);
  return source.replace(pattern, value);
}
const result = await build({
  entryPoints: ['xhs/main.tsx'], outfile: `${out}/app.js`, bundle: true,
  format: 'iife', target: ['es2017', 'chrome61'], minify: true, metafile: true,
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.hot': 'false' },
  plugins: [{ name: 'xhs-offline', setup(builder) {
    builder.onLoad({ filter: /\.(tsx?|jsx?)$/ }, async ({ path: file }) => {
      if (file.includes('node_modules')) return;
      let source = await fs.readFile(file, 'utf8');
      if (file === path.join(root, 'app/page.tsx')) {
        source = replace(source, /import Link from 'next\/link';/, '');
        source = replace(source, /import \{ GitHubLink \}[^\n]+\n/, '');
        source = replace(source, /<GitHubLink \/>/, '');
        source = replace(source, /import \{ LocalChatWidget \}[^\n]+\n/, '');
        source = replace(source, /  const \[chatHeight[^\n]+\n  const \[chatExpanded[^\n]+\n/, '');
        source = replace(source, /  const updateComparisonFromChat[\s\S]*?(?=  const displayedSelection)/, '');
        source = replace(source, /Math.max\(64, chatHeight \+ \(selected.length > 0 \? 72 : 16\)\)/, 'selected.length > 0 ? 100 : 24');
        source = replace(source, /<LocalChatWidget[^\n]+\n/, '');
        source = replace(source, /\$\{chatExpanded\?'chat-expanded':''\}/, '');
        source = replace(source, /style=\{\{bottom:chatHeight\+8\}\}/, '');
        source = replace(source, /<Link className="submit-link"[\s\S]*?<\/Link>/, '');
        source = source.replace(/<Link /g, '<a ').replace(/<\/Link>/g, '</a>').replace('href="/"', 'href="#compare"').replace('src="/recorder-select.svg"', 'src="./recorder-select.svg"');
      }
      if (file.endsWith('/recorders.ts')) source = source.replace(/icon: '\//g, "icon: './");
      if (file.endsWith('/i18n.tsx')) source = source.replace("useState<Locale>('en')", "useState<Locale>('zh-CN')").replace('|| navigator.language', "|| 'zh-CN'");
      if (file.endsWith('/canvas-comparison-table.tsx')) {
        source = replace(source, /href=\{products\[column\]\.website\} target="_blank" rel="noreferrer"/, 'role="button" tabIndex={0} onClick={() => alert(products[column].website)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); alert(products[column].website); } }}');
        source = source.replaceAll("panel.matches(':popover-open')", "panel.classList.contains('xhs-popover-open')").replaceAll('panel.hidePopover()', "panel.classList.remove('xhs-popover-open')").replaceAll('panel.showPopover()', "panel.classList.add('xhs-popover-open')").replace('popover="manual"', '');
      }
      return { contents: source, loader: file.endsWith('tsx') ? 'tsx' : file.endsWith('ts') ? 'ts' : 'js' };
    });
  }}],
});
if (Object.keys(result.metafile.inputs).some(name => /local-chat|web-llm|next\//.test(name))) throw new Error('Online/chat dependency in XHS bundle');
async function readCSS(file) {
  let css = await fs.readFile(file, 'utf8');
  const imports = [...css.matchAll(/@import ['"]([^'"]+)['"];?/g)];
  for (const match of imports) css = css.replace(match[0], match[1] === 'tailwindcss' || match[1] === './chat.css' ? '' : await readCSS(path.resolve(path.dirname(file), match[1])));
  return css;
}
const cssRoot = postcss.parse(await readCSS(path.join(root, 'app/globals.css')));
cssRoot.walkDecls(decl => {
  if (decl.value.includes('dvh')) decl.cloneBefore({ value: decl.value.replaceAll('dvh', 'vh') });
  if (decl.prop === 'overflow' && decl.value === 'clip') decl.cloneBefore({ value: 'hidden' });
  if (decl.prop === 'inset') {
    const parts = decl.value.split(/\s+/); const [a, b = a, c = a, d = b] = parts;
    ['top','right','bottom','left'].forEach((prop, index) => decl.cloneBefore({ prop, value: [a,b,c,d][index] }));
  }
  if (/^(margin|padding)-(inline|block)$/.test(decl.prop)) {
    const [a, b = a] = decl.value.split(/\s+/); const [kind, axis] = decl.prop.split('-');
    (axis === 'inline' ? ['left','right'] : ['top','bottom']).forEach((side, i) => decl.cloneBefore({ prop: `${kind}-${side}`, value: i ? b : a }));
  }
  if (/^min\(/.test(decl.value)) {
    const inner = decl.value.slice(4,-1); const comma = inner.indexOf(',');
    const first = inner.slice(0,comma); const second = inner.slice(comma+1);
    decl.cloneBefore({ value: /calc|%|vw|vh/.test(first) ? (first.includes('calc') ? first : `calc(${first})`) : second.trim() });
    if (decl.prop === 'width' && /px$/.test(first)) decl.cloneBefore({ prop:'max-width', value:first });
  }
  if (decl.prop === 'gap') decl.cloneBefore({ prop:'grid-gap' });
});
cssRoot.walkRules(rule => {
  const display = rule.nodes.find(node => node.prop === 'display');
  const gap = rule.nodes.find(node => node.prop === 'gap');
  if (display?.value === 'flex' && gap && gap.value !== '0') {
    const column = rule.nodes.some(node => node.prop === 'flex-direction' && node.value === 'column');
    const fallback = postcss.rule({ selector: rule.selectors.map(selector => `.no-flex-gap ${selector}>*+*`).join(',') });
    fallback.append({ prop: column ? 'margin-top' : 'margin-left', value: gap.value });
    rule.parent.insertAfter(rule, fallback);
  }
});
let css = transform({ filename: 'app.css', code: Buffer.from(cssRoot.toString()), targets: { chrome: 61 << 16 }, minify: true }).code.toString();
css += await fs.readFile('xhs/compat.css', 'utf8');
await fs.writeFile(`${out}/app.css`, css);
await fs.copyFile('xhs/index.html', `${out}/index.html`);
const records = await fs.readFile('lib/recorders.ts', 'utf8');
const assets = new Set(['recorder-select.svg', ...[...records.matchAll(/icon: '\/([^']+)'/g)].map(m => m[1])]);
for (const asset of assets) await fs.copyFile(`public/${asset}`, `${out}/${asset}`);
execFileSync('node', ['scripts/audit-xhs.mjs', out], { stdio:'inherit' });
await fs.mkdir('artifacts', { recursive: true });
execFileSync('node', ['.codex/skills/minitool-zip-builder/scripts/audit_artifact.mjs', out], { stdio:'inherit' });
const zip = path.join(root, 'artifacts/recorder-select-xhs.zip');
await fs.rm(zip, { force:true });
execFileSync('zip', ['-q','-r',zip,'.'], { cwd:out });
execFileSync('node', ['.codex/skills/minitool-zip-builder/scripts/audit_artifact.mjs', zip], { stdio:'inherit' });
console.log(zip);
