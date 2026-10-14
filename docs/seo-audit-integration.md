# SEO audit integration handoff

## Source comparison

The source PRs were inspected without changing either source branch:

| Source | Commit | Reused / observed | Main risks |
| --- | --- | --- | --- |
| PR #7 | `b33170b973c7779b663f63a4e8354b4a0c93cd4a` | 120-page sitemap-plus-link crawl, manual redirect structure, endpoint registry and master-report path | Redirect validation did not enforce HTTPS or reject private DNS answers; sitemap recursion and bodies were unbounded; robots and action paths were not handled; final URLs were double-counted; orphan/indexability claims exceeded crawl evidence; `/Locations/GetExcelReport` was assigned POST without grounded method evidence. |
| PR #8 | `0e5b9b28245ec48d72e7c8be9ecf84be08f86d92` | Alternative passive DataTables parsing idea | Replaced sitemap discovery with 12 guessed BACKLOG paths, followed redirects automatically, used exact-request URLs for canonical checks, and its crawler tests only checked file existence. Its parser was not copied as a competing discovery tool. |

The integration uses PR #7's broader crawl model and the repository's existing passive KPanel static-JS discovery. The fixture tests are new and exercise behavior rather than file presence. Neither source PR nor strategy PR #6 is modified.

## Safety and evidence

- `tools/public-seo-crawler.mjs` is a single opt-in public crawl path. It makes HTTPS GETs only to exact `comerent.net` / `www.comerent.net` hosts, manually validates every redirect, pins DNS-resolved public addresses, caps redirects, sitemap depth/files/URLs, response bytes, timeouts, page count, links per page, and uses sequential one-second request spacing.
- `robots.txt` is read first. Robots-denied URLs and booking/cart/payment/account/action paths are not fetched. The crawler does not guess page paths and does not submit forms or use POST.
- Effective URLs normalize www/non-www and trailing slash variants before page-level aggregates. 404 responses are recorded as status observations without canonical checks.
- A capped sitemap/link crawl reports partial coverage and unlinked sitemap URLs only as low-confidence candidates, never confirmed orphans. HTTP 200 and robots signals are basic indexability hints; search-engine indexation remains UNKNOWN.
- The master report generator emits only safe summaries, labels evidence as VERIFIED / INFERRED / UNKNOWN, separates historical `BACKLOG.md` statements from current findings, and lists missing KPanel evidence as UNKNOWN. `/Locations/GetExcelReport` is explicitly `UNKNOWN_DO_NOT_CALL`.
- KPanel read-only restrictions in `docs/kpanel-audit-operations.md` and the existing route/method guards are unchanged. No KPanel or public-site live request was run for this integration.

## Commands and status

- `npm test` runs the existing KPanel safety suite and deterministic crawler/report fixtures.
- Latest local `npm test` result: **63 tests passed, 0 failed**.
- `node tools/generate-master-audit.mjs` writes `audit/reports/master-audit.json` and `.md`; absent public or KPanel evidence is emitted as UNKNOWN, not filled with fallback counts.
- `node tools/public-seo-crawler.mjs --live` is the explicit public-crawl opt-in. It is not part of PR CI; it honors robots and the configured rate bounds. Production edits still require explicit owner approval.
- `.github/workflows/audit-fixture-tests.yml` runs only `npm ci` and offline tests with `contents: read`; it does not run a crawl or use secrets.
- Integration draft PR: [#10](https://github.com/By-Can/come-proje/pull/10), targeting `main`. The workflow run [38607059126](https://github.com/By-Can/come-proje/actions/runs/38607059126) is `action_required` with zero jobs, so there is no successful GitHub CI result to claim.
- A generated public crawl and complete KPanel source manifest are still absent. The report is therefore **NOT READY FOR HUMAN REVIEW** as a production audit, and no production action is authorized.
