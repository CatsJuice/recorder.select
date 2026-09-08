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
