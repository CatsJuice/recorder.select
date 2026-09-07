import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { parse } from 'acorn';
import postcss from 'postcss';
const directory = path.resolve(process.argv[2] || 'dist-xhs');
const files = fs.readdirSync(directory);
assert(files.includes('index.html'), 'Root index.html required');
assert(files.every(file => /\.(html|css|js|png|jpe?g|gif|webp|svg|woff2?|json)$/.test(file)), 'Unsupported artifact file');
assert.equal(files.filter(file => file.endsWith('.html')).length, 1);
const html = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
assert(!/<(?:iframe|object|base)\b|\bon\w+\s*=|type=["']module|http-equiv=["']Content-Security-Policy/i.test(html));
assert(/lang="zh-CN"/.test(html) && /charset="UTF-8"/i.test(html) && /viewport-fit=cover/.test(html));
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  assert(match[1].startsWith('./'), `Nonrelative resource: ${match[1]}`);
  assert(fs.existsSync(path.join(directory, match[1])), `Missing resource: ${match[1]}`);
}
assert([...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].every(match => /src=/.test(match[1]) && !match[2].trim()));
const js = fs.readFileSync(path.join(directory, 'app.js'), 'utf8');
const ast = parse(js, { ecmaVersion: 2017, sourceType: 'script' });
const forbidden = /fetch\(|XMLHttpRequest|WebAssembly|new\s+(?:Worker|SharedWorker|WebSocket|EventSource|RTCPeerConnection|Function)\b|\beval\(|navigator\.(?:clipboard|geolocation|bluetooth|usb|hid|serial|credentials|locks|serviceWorker)|window\.(?:open|prompt)\(/;
assert(!forbidden.test(js), 'Forbidden capability in artifact');
assert(!/web-llm|LocalChatWidget|local-chat-widget/.test(js), 'Chat in artifact');
function walk(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'Literal' && typeof node.value === 'string' && /^\.?\/[^\s]+\.(webp|png|svg)$/.test(node.value)) {
    assert(node.value.startsWith('./'), `Absolute image: ${node.value}`);
    assert(fs.existsSync(path.join(directory,node.value)), `Missing image: ${node.value}`);
  }
  for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(walk); else if (value && typeof value === 'object') walk(value);
}
walk(ast);
const css = fs.readFileSync(path.join(directory, 'app.css'), 'utf8');
postcss.parse(css).walkAtRules(rule => assert(!['import','layer','property'].includes(rule.name), `Uncompiled CSS: ${rule.name}`));
assert(!/url\(\s*["']?https?:/i.test(css), 'External CSS resource');
for (const match of `${js}\n${css}\n${html}`.matchAll(/data:[^;,]+;base64,([A-Za-z0-9+/=]+)/g)) assert(Buffer.from(match[1],'base64').length <= 1024 * 1024, 'Oversized base64');
console.log(`PASS: ${files.length} files; ES2017 classic script; local resources; capability and Chat scans; CSS structure; base64 budget`);
