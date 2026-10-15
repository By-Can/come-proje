import { classifyRequestLevelEvidence } from './public-seo-batch-plan.mjs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/**
 * Offline, fail-closed reconciliation of separately collected bounded crawls.
 * Only request-level outcomes may establish that a URL was actually inspected.
 * Never treats a 404, redirect alias, blocked URL or missing manifest as success.
 */
export function reviewPublicSitemapBatches(reports) {
  if (!Array.isArray(reports) || reports.length === 0) {
    return { status: 'INSUFFICIENT_EVIDENCE', reasons: ['NO_REPORTS'], allBatchesVerified: false };
  }
  const reasons = new Set();
  const verifiedUrls = new Set();
  const reviewedUrls = new Set();
  const batchIds = new Set();
  const allRequestedUrls = new Set();
  let reference = null;
  let observedRequestCount = 0;
  let missingManifestCount = 0;
  let totalReportedSelectedUrls = 0;

  for (const report of reports) {
    const batch = report?.coverage?.sitemapBatch ??
      report?.sourceManifest?.publicCrawl?.coverage?.sitemapBatch;
    const requests = report?.requestManifest ?? report?.publicRequestManifest;
    if (!batch || !Array.isArray(requests)) {
      reasons.add('MISSING_BATCH_OR_REQUEST_MANIFEST');
      missingManifestCount++;
      continue;
    }
    const { batchIndex, batchCount, pageLimit, eligibleCandidateCount,
      selectedUrlCount, inventorySha256 } = batch;
    const valid = Number.isSafeInteger(batchIndex) && batchIndex >= 0 &&
      Number.isSafeInteger(batchCount) && batchCount > 0 &&
      Number.isSafeInteger(pageLimit) && pageLimit >= 1 && pageLimit <= 120 &&
      Number.isSafeInteger(eligibleCandidateCount) && eligibleCandidateCount > 0 &&
      Number.isSafeInteger(selectedUrlCount) && selectedUrlCount > 0 &&
      selectedUrlCount <= pageLimit && batchIndex < batchCount &&
      Math.ceil(eligibleCandidateCount / pageLimit) === batchCount &&
      /^[a-f0-9]{64}$/.test(inventorySha256 ?? '');
    if (!valid) {
      reasons.add('INVALID_BATCH_METADATA');
      continue;
    }
    const metadata = JSON.stringify([inventorySha256, batchCount, pageLimit, eligibleCandidateCount]);
    if (reference === null) {
      reference = { inventorySha256, batchCount, pageLimit, eligibleCandidateCount, metadata };
    } else if (reference.metadata !== metadata) {
      reasons.add('INVENTORY_OR_BATCH_LAYOUT_MISMATCH');
    }
    if (batchIds.has(batchIndex)) reasons.add('DUPLICATE_BATCH_INDEX');
    batchIds.add(batchIndex);
    totalReportedSelectedUrls += selectedUrlCount;
    if (requests.length !== selectedUrlCount) reasons.add('REQUEST_COUNT_MISMATCH');

    // Only accept request manifests; deduplicated pages are not evidence.
    let evaluated;
    try {
      evaluated = classifyRequestLevelEvidence(requests);
    } catch {
      reasons.add('INVALID_REQUEST_EVIDENCE');
      continue;
    }
    observedRequestCount += requests.length;
    for (const item of requests) {
      const url = item.requestedUrl;
      if (allRequestedUrls.has(url)) reasons.add('DUPLICATE_URL_ACROSS_BATCHES');
      allRequestedUrls.add(url);
    }
    for (const url of evaluated.verifiedHttp200HtmlUrls) verifiedUrls.add(url);
    for (const item of evaluated.requiresReview) reviewedUrls.add(item.requestedUrl);
  }
  if (!reference) reasons.add('NO_VALID_BATCH_METADATA');
  const expected = reference?.batchCount ?? 0;
  if (batchIds.size !== expected || [...Array(expected).keys()].some(id => !batchIds.has(id))) {
    reasons.add('MISSING_BATCHES');
  }
  if (reference && totalReportedSelectedUrls !== reference.eligibleCandidateCount) {
    reasons.add('INCOMPLETE_OR_OVERSTATED_SELECTION');
  }
  if (reference && allRequestedUrls.size !== reference.eligibleCandidateCount) {
    reasons.add('INCOMPLETE_OR_OVERLAPPING_REQUEST_COVERAGE');
  }
  if (reviewedUrls.size) reasons.add('NON_SUCCESS_REQUESTS_REQUIRE_REVIEW');

  return {
    status: reasons.size ? 'REQUIRES_REVIEW' : 'VERIFIED_DIRECT_200_HTML_FOR_BOUNDED_INVENTORY',
    allBatchesVerified: reasons.size === 0,
    inventorySha256: reference?.inventorySha256 ?? null,
    batchCountExpected: expected,
    batchesObserved: [...batchIds].sort((a, b) => a - b),
    eligibleCandidateCount: reference?.eligibleCandidateCount ?? null,
    reportedSelectedUrlCount: totalReportedSelectedUrls,
    observedRequestCount,
    distinctRequestedUrlCount: allRequestedUrls.size,
    verifiedDirectHtml200Count: verifiedUrls.size,
    requiresReviewCount: reviewedUrls.size,
    missingManifestCount,
    reasons: [...reasons].sort(),
    note: 'Only bounded inventory and direct HTTP 200 HTML outcomes are evaluated; no search indexing or sitewide SEO correctness is inferred.'
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('Offline use: node tools/public-seo-batch-review.mjs <master-audit-0.json> <master-audit-1.json>');
    process.exitCode = 2;
  } else {
    Promise.all(files.map(async file => JSON.parse(await readFile(file, 'utf8'))))
      .then(reports => {
        const result = reviewPublicSitemapBatches(reports);
        console.log(JSON.stringify(result, null, 2));
        if (!result.allBatchesVerified) process.exitCode = 1;
      })
      .catch(error => {
        console.error('Offline batch evidence could not be verified:', error.message);
        process.exitCode = 1;
      });
  }
}
