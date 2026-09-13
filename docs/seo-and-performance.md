# SEO and Lighthouse validation

Validated on 2026-09-09. Deployment and Google Search Console submission are separate release steps.

## Search content

Primary topics: screen recorder comparison, screen recording software, Mac and Windows screen recorders, Linux screen recorders, Screen Studio alternatives, auto zoom, and recorder performance benchmarks. These topics appear in descriptive metadata and readable page content, rather than relying on the keywords meta tag for Google rankings.

The homepage server-renders a heading, comparison guidance and a collapsible directory of all 25 recorders. The directory and JSON-LD use the same product data. WebSite, CollectionPage and an unordered ItemList describe the directory without inventing ratings, offers or ranking claims. English content is explicitly marked `lang="en"` when the interactive interface switches language.

Canonical URLs, Open Graph and Twitter metadata use the production domain. `/robots.txt` permits crawling and points to `/sitemap.xml`; the sitemap includes `/` and `/submit`. No artificial modification dates or nonexistent language URLs are emitted.

## Performance changes

- Load benchmark summaries for scoring/filtering first; fetch complete chart samples only when the performance section expands. The initial module is about 28 KB instead of 576 KB of minified JavaScript (about 616 KB source). Raw measurements remain unchanged.
- Render the chat composer in the initial HTML, outside the drawer's transformed surface, instead of waiting for a client-only portal.
- Use optional font loading and stop preloading the secondary monospace font.
- Position the mobile website-link layer correctly before hydration to eliminate its layout shift.
- Use document navigation for the submission flow. This avoids the installed vinext version's RSC prefetch/navigation error and unnecessary submission-page preloading.
- Include the selected language in the language button's accessible name; hide decorative count badges from assistive technology.

## Measurements

Lighthouse production builds on the same host and browser, with identical gzip proxy settings and default mobile simulation. Baseline source was taken from HEAD into an isolated temporary directory. The proxy is a test harness, not a production configuration change. Local raw HTTP measurements are not mixed with compressed or live measurements.

| Metric | Before | After |
| --- | ---: | ---: |
| Mobile performance | 83 | 89 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO checks | 100 | 100 |
| First contentful paint | 2.7 s | 2.7 s |
| Largest contentful paint | 3.9 s | 3.2 s |
| Total blocking time | 0 ms | 0 ms |
| Cumulative layout shift | 0.047 | 0 |

Reports are saved under `artifacts/seo/` (ignored by Git). These are individual lab measurements, not field Core Web Vitals or a promise of search indexing. The live site scored 66 for mobile performance before this work; that result has different network conditions and is not the comparison baseline above. Render-blocking CSS and the main interactive bundle remain opportunities for future reduction.

## Validation and release

- Production build and TypeScript check passed.
- ESLint passed with four existing image-element warnings when excluding generated `dist-xhs` output.
- All 54 table tests passed, including exact score-contribution equivalence between summary and complete benchmark data, plus chart loading and failure states.
- Browser checks passed for initial summary-only loading, full chart loading on expansion, no mobile horizontal overflow, directory links, JSON-LD count, canonical URLs, chat input/download confirmation and navigation to submission.
- The offline XHS build and its existing artifact audits passed after adapting its shared component entry point.

After deployment, verify the public robots/sitemap responses and repeat Lighthouse on `https://recorder.select/`. Then verify the domain in Google Search Console, submit `https://recorder.select/sitemap.xml`, and request indexing of the homepage. Search Console verification credentials are not part of the source repository.

## Screen Studio search intent expansion — 2026-09-10

The earlier work mentioned alternatives in homepage guidance and keywords, but had no dedicated landing page. This change adds two server-rendered guides:

- `/screen-studio-alternatives`: English Screen Studio alternative searches, including Mac, Windows, Linux, free/open-source and demo-editing questions.
- `/zh-cn/screen-studio-alternatives`: a complete Chinese guide for Screen Studio 平替, 录屏软件对比, 免费开源录屏 and platform-specific searches.

Both guides have distinct localized titles/descriptions and self-canonical URLs, reciprocal en/zh-CN/x-default language alternates, localized social metadata, visible language links, and CollectionPage, BreadcrumbList and unordered ItemList structured data. Their main content explicitly declares its language; hydration preserves the editorial language regardless of saved table language preferences. Both URLs are in the sitemap. No fabricated ratings, FAQ rich-result promises, freshness dates or ranking claims are added.

The HTML comparison and platform/open-source shortlists use the existing recorder dataset. Screen Studio is shown as the baseline and excluded from the alternative ItemList. Null prices remain undocumented; open source is not treated as free. The guide does not infer auto zoom from cursor replacement because the current dataset does not independently model auto-zoom support. Editorial descriptions link to primary product sources: [Screen Studio](https://screen.studio/), [OpenScreen](https://getopenscreen.com/), [Recordly](https://recordly.dev/) and [FocuSee](https://focusee.imobie.com/), consulted on 2026-09-10. This is not a full re-audit of every existing product fact.

### Verify and measure

Run `node scripts/audit-seo.mjs http://127.0.0.1:4173` against a running production build. It checks actual HTTP HTML without executing JavaScript: status, canonical URLs, reciprocal language alternates, robots, localized main content, table/list consistency, structured data, section anchors, absence of homepage SEO copy and sitemap inclusion. After deployment run the same audit against `https://recorder.select`.

### Homepage presentation correction

At the user's request, the entire homepage overview block (heading, prose, guide links and collapsible directory) has been removed, along with its styles and shared component slot. The homepage retains its comparison UI, metadata and structured data. Guide content remains readable on the dedicated routes, discoverable through the sitemap and reciprocal language links. No invisible keyword text or crawler-specific content is substituted. The historical homepage and Lighthouse findings above describe the earlier version, not the current homepage.

Validation on 2026-09-10: production build, TypeScript, ESLint for changed source files, and the production HTTP SEO audit passed. No browser visual audit or new Lighthouse run was performed. Public deployment and Search Console submission remain separate release steps.

After public release, submit the sitemap and inspect both guide URLs in Google Search Console. Confirm Google's chosen canonical and indexing status. Track impressions, clicks, CTR and average position by landing page, country and query group (Screen Studio alternatives, free/open-source, Windows/Mac/Linux, and Chinese 平替/录屏). Compare 28-day periods, allowing for crawl/indexing delays; no ranking baseline or verified search-volume estimate is available from this checkout.

The next content investments should follow actual Search Console queries: standalone platform guides with platform-specific evidence, auto-zoom capability verification, and repeatable demo exports or benchmarks. Avoid generating near-identical keyword pages. Broader recording searches include tutorials, troubleshooting and streaming tasks beyond this directory's present coverage; they require useful content that answers those tasks. Lighthouse SEO checks alone do not demonstrate ranking competitiveness.

Reference: Google's guidance on [useful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), [descriptive page titles](https://developers.google.com/search/docs/appearance/title-link), and [multilingual URLs](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites).
