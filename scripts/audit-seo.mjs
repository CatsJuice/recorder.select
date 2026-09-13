import assert from 'node:assert/strict';

// Run against a running production build or the public site after deployment.
const base = process.argv[2];
assert(base && /^https?:\/\//.test(base), 'Usage: node scripts/audit-seo.mjs http://127.0.0.1:4173');
const origin = 'https://recorder.select';
const paths = ['/screen-studio-alternatives', '/zh-cn/screen-studio-alternatives'];
const read = async path => {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, `${path}: HTTP 200`);
  assert(!/noindex/i.test(response.headers.get('x-robots-tag') || ''), `${path}: indexable response`);
  return response.text();
};
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(match => [match[1].toLowerCase(), match[2]]));
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map(match => attributes(match[0]));
const graphs = html => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
  .flatMap(match => JSON.parse(match[1])['@graph'] || []);
const home = await read('/');
const directory = graphs(home).find(item => item['@type'] === 'ItemList');
assert(directory?.numberOfItems > 1, 'Homepage includes structured data for the comparison');
assert(!home.includes('recorder-overview'), 'Homepage does not render the removed SEO block');
assert(!home.includes('Looking for a Screen Studio alternative?'), 'Homepage does not render guide copy');
for (const [index, path] of paths.entries()) {
  const html = await read(path);
  const links = tags(html, 'link');
  const meta = tags(html, 'meta');
  const graph = graphs(html);
  assert.equal(links.filter(link => link.rel === 'canonical').length, 1);
  assert.equal(links.find(link => link.rel === 'canonical').href, origin + path);
  for (const [language, target] of [['en', paths[0]], ['zh-CN', paths[1]], ['x-default', paths[0]]]) {
    assert(links.some(link => link.rel === 'alternate' && link.hreflang === language && link.href === origin + target), `${path}: reciprocal ${language} alternate`);
  }
  assert(!meta.some(item => /robots|googlebot/.test(item.name || '') && /noindex/.test(item.content)));
  assert(meta.some(item => item.property === 'og:url' && item.content === origin + path));
  assert(meta.some(item => item.name === 'description' && item.content.includes('Screen Studio')));
  assert.equal(tags(html, 'h1').length, 1);
  assert(tags(html, 'main').some(main => main.lang === (index ? 'zh-CN' : 'en')));
  const list = graph.find(item => item['@type'] === 'ItemList');
  assert.equal(list.numberOfItems, directory.numberOfItems - 1);
  assert.equal(list.itemListElement.length, list.numberOfItems);
  assert(!list.itemListElement.some(entry => entry.item.name === 'Screen Studio'));
  assert.equal(tags(html, 'tr').length, directory.numberOfItems + 1, 'HTML table has all recorders plus header');
  assert(graph.some(item => item['@type'] === 'BreadcrumbList'));
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  for (const link of tags(html, 'a').filter(link => link.href?.startsWith('#'))) {
    assert(ids.has(link.href.slice(1)), `${path}: anchor ${link.href} exists`);
  }
  console.log(`PASS ${path}: SSR content, metadata, languages, structured data and links`);
}
const sitemap = await read('/sitemap.xml');
for (const path of ['', '/submit', ...paths]) assert(sitemap.includes(`<loc>${origin}${path || '/'}</loc>`));
const robots = await read('/robots.txt');
assert(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
console.log('PASS sitemap.xml and robots.txt');
