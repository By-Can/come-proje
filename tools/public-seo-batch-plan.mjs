/**
 * Deterministic, offline-only selection of bounded public sitemap batches.
 * This does not infer successful previous scans or accept historical checkpoints.
 */
export function planPublicSitemapBatch({ candidates, pageLimit, batchIndex }) {
  if (!Array.isArray(candidates) || candidates.some(url => typeof url !== 'string' || !url)) {
    throw new TypeError('Candidates must be nonempty URL strings');
  }
  if (!Number.isSafeInteger(pageLimit) || pageLimit < 1 || pageLimit > 120) {
    throw new RangeError('Batch size must be an integer from 1 to 120');
  }
  if (!Number.isSafeInteger(batchIndex) || batchIndex < 0) {
    throw new RangeError('Batch index must be a nonnegative integer');
  }
  const eligible = [...new Set(candidates)].sort();
  const batchCount = Math.ceil(eligible.length / pageLimit);
  if (batchIndex >= batchCount) {
    throw new RangeError('Batch index exceeds the current verified sitemap inventory');
  }
  const start = batchIndex * pageLimit;
  return {
    batchIndex,
    batchCount,
    pageLimit,
    eligibleCandidateCount: eligible.length,
    selectedUrls: eligible.slice(start, start + pageLimit),
    selectionBasis: 'CURRENT_SITEMAP_AND_START_URL_ONLY',
    isHistoricalCheckpoint: false,
    note: 'Selection is deterministic for this run; previously audited URL status is not assumed.'
  };
}

/**
 * Only record request-level HTTP 200 HTML outcomes as verified successful.
 * 404, redirects without observed 200 HTML, blocked, and failures need review.
 * Aggregated page reports are not accepted as proof of prior requests.
 */
export function classifyRequestLevelEvidence(manifest) {
  if (!Array.isArray(manifest)) throw new TypeError('A request-level manifest array is required');
  const completed = [];
  const review = [];
  for (const entry of manifest) {
    if (!entry || typeof entry.requestedUrl !== 'string' || !entry.requestedUrl) {
      throw new TypeError('Every request must include a requestedUrl');
    }
    const isHtml200 = entry.statusCode === 200 && entry.result === 'FETCHED' &&
      entry.contentType === 'text/html' && typeof entry.finalUrl === 'string' &&
      entry.finalUrl.length > 0 && typeof entry.observedAt === 'string' &&
      entry.observedAt.length > 0;
    if (isHtml200) completed.push(entry.requestedUrl);
    else review.push({ requestedUrl: entry.requestedUrl, result: entry.result ?? 'UNKNOWN' });
  }
  return { verifiedHttp200HtmlUrls: [...new Set(completed)], requiresReview: review };
}
