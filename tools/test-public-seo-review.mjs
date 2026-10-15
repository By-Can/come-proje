import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { planPublicSitemapBatch } from './public-seo-batch-plan.mjs';
import { reviewPublicSitemapBatches } from './public-seo-batch-review.mjs';
import { resolvePublicSeoWorkflowBatch } from './public-seo-workflow-batch.mjs';
import { crawlerUrlPolicyReason } from './public-seo-crawler.mjs';
import { buildMasterAuditReport, renderMasterAuditMarkdown } from './generate-master-audit.mjs';

const urls = ['https://comerent.net/', ...Array.from({ length: 4 }, (_, i) =>
  `https://comerent.net/city-${i + 1}`)];
const direct200 = requestedUrl => ({
  requestedUrl, finalUrl: requestedUrl,
  statusCode: 200, contentType: 'text/html', result: 'FETCHED',
  observedAt: '2026-10-15T13:00:00.000Z', redirectChain: [requestedUrl]
});
const makeReport = (batchIndex, overrides = {}) => {
  const batch = planPublicSitemapBatch({ candidates: urls, pageLimit: 3, batchIndex });
  return {
    sourceManifest: { publicCrawl: { coverage: {
      sitemapComplete: true,
      sitemapBatch: {
        ...batch, selectedUrlCount: batch.selectedUrls.length
      }
    } } },
    publicRequestManifest: batch.selectedUrls.map(direct200),
    ...overrides
  };
};

test('offline batch reconciliation recognizes exactly covered current inventory', () => {
  const a = makeReport(0), b = makeReport(1);
  const result = reviewPublicSitemapBatches([a, b]);
  assert.equal(result.status, 'VERIFIED_DIRECT_200_HTML_FOR_BOUNDED_INVENTORY');
  assert.equal(result.allBatchesVerified, true);
  assert.equal(result.verifiedDirectHtml200Count, 5);
  assert.equal(result.distinctRequestedUrlCount, 5);
  assert.deepEqual(result.batchesObserved, [0, 1]);
  assert.deepEqual(result.reasons, []);
  assert.equal(result.inventorySha256, a.sourceManifest.publicCrawl.coverage.sitemapBatch.inventorySha256);
});

test('incomplete, duplicate, changed sitemap and missing manifest fail closed', () => {
  const a = makeReport(0), b = makeReport(1);
  assert.equal(reviewPublicSitemapBatches([a]).allBatchesVerified, false);
  const duplicate = reviewPublicSitemapBatches([a, a]);
  assert.equal(duplicate.allBatchesVerified, false);
  assert.ok(duplicate.reasons.includes('DUPLICATE_BATCH_INDEX'));
  const altered = structuredClone(b);
  altered.sourceManifest.publicCrawl.coverage.sitemapBatch.inventorySha256 = 'f'.repeat(64);
  const changed = reviewPublicSitemapBatches([a, altered]);
  assert.ok(changed.reasons.includes('INVENTORY_OR_BATCH_LAYOUT_MISMATCH'));
  const missing = structuredClone(b);
  delete missing.publicRequestManifest;
  assert.ok(reviewPublicSitemapBatches([a, missing]).reasons.includes('MISSING_BATCH_OR_REQUEST_MANIFEST'));
  const repeated = structuredClone(b);
  repeated.publicRequestManifest[0].requestedUrl = a.publicRequestManifest[0].requestedUrl;
  assert.ok(reviewPublicSitemapBatches([a, repeated]).reasons.includes('DUPLICATE_URL_ACROSS_BATCHES'));
  // Counts, HTTP status and inventory fingerprint still match, but the
  // second report actually requested another URL: selection must be rejected.
  const substituted = structuredClone(b);
  const replacementUrl = 'https://comerent.net/not-selected';
  substituted.publicRequestManifest[0].requestedUrl = replacementUrl;
  substituted.publicRequestManifest[0].finalUrl = replacementUrl;
  substituted.publicRequestManifest[0].redirectChain = [replacementUrl];
  const substitution = reviewPublicSitemapBatches([a, substituted]);
  assert.equal(substitution.allBatchesVerified, false);
  assert.ok(substitution.reasons.includes('SELECTED_REQUEST_URLS_MISMATCH'));
  // All listed URLs respond 200, but sitemap collection was incomplete:
  // coverage must not be reported as a verified whole-inventory audit.
  const partial = structuredClone(b);
  partial.sourceManifest.publicCrawl.coverage.sitemapComplete = false;
  const incompleteSitemap = reviewPublicSitemapBatches([a, partial]);
  assert.equal(incompleteSitemap.allBatchesVerified, false);
  assert.ok(incompleteSitemap.reasons.includes('SITEMAP_INCOMPLETE_OR_UNVERIFIED'));
  const missingCompleteness = structuredClone(b);
  delete missingCompleteness.sourceManifest.publicCrawl.coverage.sitemapComplete;
  assert.equal(reviewPublicSitemapBatches([a, missingCompleteness]).allBatchesVerified, false);
});

test('HTTP 404, redirected aliases, failed and query-redacted outcomes cannot prove full coverage', () => {
  const a = makeReport(0), b = makeReport(1);
  for (const different of [
    { statusCode: 404, result: 'HTTP_404' },
    { result: 'FETCH_FAILED', statusCode: null },
    { result: 'BLOCKED_BY_POLICY', statusCode: null },
    { finalUrl: 'https://comerent.net/other', redirectChain: ['https://comerent.net/city-2','https://comerent.net/other'] },
    { requestedUrl: 'https://comerent.net/page?id=%5BREDACTED%5D' }
  ]) {
    const modified = structuredClone(a);
    Object.assign(modified.publicRequestManifest[1], different);
    const result = reviewPublicSitemapBatches([modified, b]);
    assert.equal(result.allBatchesVerified, false);
    assert.ok(result.reasons.includes('NON_SUCCESS_REQUESTS_REQUIRE_REVIEW') ||
      result.reasons.includes('INCOMPLETE_OR_OVERLAPPING_REQUEST_COVERAGE'));
  }
});

test('master report evaluates direct HTTP evidence instead of trusting effective-page aggregates', async () => {
  const crawl = {
    sourceRunId: 'offline-fixture',
    generatedAt: '2026-10-15T13:00:00.000Z',
    observations: [],
    summary: { pageRequestCount: 2 },
    coverage: { status: 'PARTIAL' },
    pages: [{ finalUrl: urls[0], statusCode: 200 }],
    requestManifest: [
      direct200(urls[0]),
      { requestedUrl: urls[1], finalUrl: urls[1], statusCode: 404,
        result: 'HTTP_404', contentType: 'text/html', observedAt: '2026-10-15T13:00:00Z' }
    ]
  };
  const report = await buildMasterAuditReport({ crawlReport: crawl, backlogText: '' });
  assert.equal(report.publicRequestEvidence.status, 'PARTIAL_REQUIRES_REVIEW');
  assert.equal(report.publicRequestEvidence.verifiedDirectHtml200Count, 1);
  assert.equal(report.publicRequestEvidence.requiresReviewCount, 1);
  assert.equal(report.publicRequestManifest[1].statusCode, 404);
  assert.match(renderMasterAuditMarkdown(report), /Request-level HTTP evidence/);
  const legacy = await buildMasterAuditReport({ crawlReport: { observations: [], pages: crawl.pages }, backlogText: '' });
  assert.equal(legacy.publicRequestEvidence.status, 'UNKNOWN_NO_REQUEST_MANIFEST');
});

test('manual and push batch selectors validate correct event and input without network', () => {
  assert.equal(resolvePublicSeoWorkflowBatch({ eventName: 'workflow_dispatch', dispatchInput: '' }), 'default');
  assert.equal(resolvePublicSeoWorkflowBatch({ eventName: 'workflow_dispatch', dispatchInput: '1' }), '1');
  assert.equal(resolvePublicSeoWorkflowBatch({ eventName: 'push', request: { batchIndex: 0 } }), '0');
  assert.equal(resolvePublicSeoWorkflowBatch({ eventName: 'push', request: {} }), 'default');
  for (const bad of ['-1', '1000', '1; echo unsafe', '01', '3\nunsafe']) {
    assert.throws(
      () => resolvePublicSeoWorkflowBatch({ eventName: 'workflow_dispatch', dispatchInput: bad }),
      /Invalid batch selection/
    );
  }
  assert.throws(() => resolvePublicSeoWorkflowBatch({ eventName: 'schedule', dispatchInput: '0' }), /Only manual/);
});

test('the actual workflow calls the tested selector, keeps read-only and opt-in gates', () => {
  const workflow = fs.readFileSync('.github/workflows/public-seo-readonly-crawl.yml', 'utf8');
  assert.match(workflow, /node tools\/public-seo-workflow-batch\.mjs/);
  assert.match(workflow, /if: github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /'audit\/triggers\/public-seo-request\.json'/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /run: npm test/);
  assert.match(workflow, /--batch-index=\$BATCH_INDEX/);
  assert.doesNotMatch(workflow, /cron:/);
});

test('actual offline workflow entrypoint writes only validated batch output', () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'comerent-batch-'));
  try {
    const output = path.join(folder, 'github-output');
    fs.writeFileSync(output, '');
    const run = (val) => spawnSync(process.execPath, ['tools/public-seo-workflow-batch.mjs'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_EVENT_NAME: 'workflow_dispatch',
        REQUESTED_BATCH_INDEX: val,
        GITHUB_OUTPUT: output
      }
    });
    const good = run('1');
    assert.equal(good.status, 0, good.stderr);
    assert.equal(fs.readFileSync(output, 'utf8'), 'batch_index=1\n');
    const bad = run('1;false');
    assert.notEqual(bad.status, 0);
    assert.equal(fs.readFileSync(output, 'utf8'), 'batch_index=1\n');
  } finally {
    fs.rmSync(folder, { recursive: true, force: true });
  }
});

test('commercial and informational URLs remain eligible; portal/action URLs stay blocked', () => {
  for (const url of [
    'https://comerent.net/acente-kiralama-rehberi',
    'https://comerent.net/b2b-cozumleri',
    'https://comerent.net/musteri-hizmetleri',
    'https://comerent.net/uyelik-avantajlari',
    'https://comerent.net/bayilik-nasil-alinir',
    'https://comerent.net/acente/rehber',
    'https://comerent.net/ankara-arac-kiralama'
  ]) {
    assert.equal(crawlerUrlPolicyReason(url), null, url);
  }
  for (const url of [
    'https://comerent.net/acente',
    'https://comerent.net/acente-kayit',
    'https://comerent.net/acente-uyelik-bilgilerim',
    'https://comerent.net/acente-portal',
    'https://comerent.net/acente/profil',
    'https://comerent.net/b2b',
    'https://comerent.net/b2b-giris',
    'https://comerent.net/musteri',
    'https://comerent.net/musteri-hesap',
    'https://comerent.net/bayilik-basvurusu',
    'https://comerent.net/rezervasyon',
    'https://comerent.net/odeme',
    'https://comerent.net/acente/uyelik'
  ]) {
    assert.equal(crawlerUrlPolicyReason(url), 'ACTION_PATH_BLOCKED', url);
  }
});
