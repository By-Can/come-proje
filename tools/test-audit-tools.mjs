import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchUrlWithManualRedirects,
  isAllowedByRobots,
  isPublicIp,
  parseRobotsRules,
  MAX_RESPONSE_BYTES,
  REQUEST_DELAY_MS,
  runPublicSeoCrawler,
  validateCrawlerUrl
} from './public-seo-crawler.mjs';
import {
  buildMasterAuditReport,
  classifyEndpoint,
  parseHistoricalBacklog
} from './generate-master-audit.mjs';

const robotsFixture = 'User-agent: *\nAllow: /\n';

function response(status, body = '', headers = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Map(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])),
    text: async () => body
  };
}

function sitemapUrlset(urls) {
  return `<urlset>${urls.map(url => `<url><loc>${url}</loc></url>`).join('')}</urlset>`;
}

function fixtureFetch(fixtures, calls = []) {
  return async (url, options) => {
    assert.equal(options.method, 'GET');
    assert.equal(options.redirect, 'manual');
    calls.push(url);
    const fixture = fixtures[new URL(url).pathname];
    if (typeof fixture === 'function') return fixture(url, options);
    return fixture ?? response(404);
  };
}

test('crawler rejects insecure, external, credentialed, and non-default-port URLs', () => {
  assert.equal(validateCrawlerUrl('https://www.comerent.net/page').hostname, 'www.comerent.net');
  for (const url of [
    'http://comerent.net/',
    'https://evil.example/',
    'https://comerent.net:444/'
  ]) {
    assert.throws(() => validateCrawlerUrl(url), /HTTPS same-site policy/);
  }
  const credentialedUrl = new URL('https://comerent.net/');
  credentialedUrl.username = 'user';
  credentialedUrl.password = 'fixture';
  assert.throws(() => validateCrawlerUrl(credentialedUrl.href), /HTTPS same-site policy/);
  assert.equal(isPublicIp('8.8.8.8'), true);
  for (const address of ['127.0.0.1', '10.0.0.1', '169.254.1.1', '192.168.1.1', '::1', 'fc00::1']) {
    assert.equal(isPublicIp(address), false, address);
  }
});

test('manual redirects block external hosts, scheme changes, loops, and unbounded hops', async () => {
  for (const location of [
    'https://evil.example/',
    'http://www.comerent.net/',
    '//evil.example/',
    '/booking'
  ]) {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return response(302, '', { location });
    };
    await assert.rejects(fetchUrlWithManualRedirects('https://comerent.net/start', fetchImpl));
    assert.equal(calls, 1, 'redirect target must be rejected before a network request');
  }

  const loopFetch = async () => response(302, '', { location: '/loop' });
  await assert.rejects(
    fetchUrlWithManualRedirects('https://comerent.net/loop', loopFetch),
    /Redirect cycle blocked/
  );

  let hop = 0;
  const longChainFetch = async () => response(302, '', { location: `/hop-${++hop}` });
  await assert.rejects(
    fetchUrlWithManualRedirects('https://comerent.net/hop-0', longChainFetch),
    /Max redirect hops exceeded/
  );
  assert.equal(hop, 6);

  let policyCalls = 0;
  const policyRedirect = async () => {
    policyCalls += 1;
    return response(302, '', { location: '/private' });
  };
  await assert.rejects(
    fetchUrlWithManualRedirects('https://comerent.net/start', policyRedirect, {
      robotsRules: [{ allow: false, path: '/private' }]
    }),
    /robots.txt policy/
  );
  assert.equal(policyCalls, 1);
});

test('robots rules are parsed and disallowed action paths are not requested', async () => {
  const rules = parseRobotsRules('User-agent: *\nDisallow: /booking\nAllow: /booking/help\n');
  assert.equal(isAllowedByRobots('https://comerent.net/booking', rules.rules), false);
  assert.equal(isAllowedByRobots('https://comerent.net/booking/help', rules.rules), true);

  const calls = [];
  const fetchImpl = fixtureFetch({
    '/robots.txt': response(200, 'User-agent: *\nDisallow: /booking\n'),
    '/sitemap.xml': response(200, sitemapUrlset(['https://comerent.net/booking'])),
    '/': response(200, '<html><head><title>Home</title></head><body><a href="/booking">Book</a></body></html>', {
      'content-type': 'text/html'
    })
  }, calls);
  const report = await runPublicSeoCrawler({ fetchImpl, delayMs: 0 });
  assert.equal(calls.some(url => new URL(url).pathname === '/booking'), false);
  assert.equal(report.sitemap.skippedActionUrls.length, 1);
});

test('response caps fail closed and production request spacing remains conservative', async () => {
  const calls = [];
  const oversizedRobots = fixtureFetch({
    '/robots.txt': response(200, 'x'.repeat(MAX_RESPONSE_BYTES + 1)),
    '/sitemap.xml': response(200, sitemapUrlset([]))
  }, calls);
  const report = await runPublicSeoCrawler({ fetchImpl: oversizedRobots, delayMs: 0 });
  assert.equal(report.robots.status, 'BLOCKED_BY_POLICY');
  assert.equal(calls.length, 1);
  assert.equal(REQUEST_DELAY_MS, 1000);
});

test('crawler requests remain sequential and GET-only', async () => {
  let active = 0;
  let maxActive = 0;
  const fetchImpl = async url => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    await new Promise(resolve => setImmediate(resolve));
    active -= 1;
    if (new URL(url).pathname === '/robots.txt') return response(200, robotsFixture);
    if (new URL(url).pathname === '/sitemap.xml') return response(200, sitemapUrlset(['https://comerent.net/page']));
    return response(200, '<html><title>Page</title></html>', { 'content-type': 'text/html' });
  };
  await runPublicSeoCrawler({ fetchImpl, delayMs: 0 });
  assert.equal(maxActive, 1);
});

test('sitemap recursion is same-site, cycle-safe, and bounded by depth', async () => {
  const calls = [];
  const fixtures = {
    '/robots.txt': response(200, robotsFixture),
    '/sitemap.xml': response(200, '<sitemapindex><sitemap><loc>https://comerent.net/sitemap-1.xml</loc></sitemap><sitemap><loc>https://outside.example/sitemap.xml</loc></sitemap></sitemapindex>'),
    '/sitemap-1.xml': response(200, '<sitemapindex><sitemap><loc>https://comerent.net/sitemap.xml</loc></sitemap><sitemap><loc>https://comerent.net/sitemap-2.xml</loc></sitemap></sitemapindex>'),
    '/sitemap-2.xml': response(200, sitemapUrlset(['https://comerent.net/page-one'])),
    '/': response(200, '<html><title>Home</title></html>', { 'content-type': 'text/html' }),
    '/page-one': response(200, '<html><title>One</title></html>', { 'content-type': 'text/html' })
  };
  const report = await runPublicSeoCrawler({ fetchImpl: fixtureFetch(fixtures, calls), delayMs: 0 });
  assert.equal(calls.filter(url => new URL(url).pathname === '/sitemap.xml').length, 1);
  assert.equal(calls.some(url => new URL(url).hostname === 'outside.example'), false);
  assert.equal(report.sitemap.filesFetched.length, 3);
  assert.equal(report.summary.sitemapUrlCount, 1);

  const deepFixtures = {
    '/robots.txt': response(200, robotsFixture),
    '/sitemap.xml': response(200, '<sitemapindex><sitemap><loc>/sitemap-1.xml</loc></sitemap></sitemapindex>'),
    '/sitemap-1.xml': response(200, '<sitemapindex><sitemap><loc>/sitemap-2.xml</loc></sitemap></sitemapindex>'),
    '/sitemap-2.xml': response(200, '<sitemapindex><sitemap><loc>/sitemap-3.xml</loc></sitemap></sitemapindex>'),
    '/sitemap-3.xml': response(200, '<sitemapindex><sitemap><loc>/sitemap-4.xml</loc></sitemap></sitemapindex>'),
    '/sitemap-4.xml': response(200, sitemapUrlset(['https://comerent.net/too-deep'])),
    '/': response(200, '<html><title>Home</title></html>', { 'content-type': 'text/html' })
  };
  const deepCalls = [];
  const deepReport = await runPublicSeoCrawler({ fetchImpl: fixtureFetch(deepFixtures, deepCalls), delayMs: 0 });
  assert.equal(deepCalls.some(url => new URL(url).pathname === '/sitemap-4.xml'), false);
  assert.equal(deepReport.coverage.sitemapComplete, false);
});

test('404 candidates use observed paths and do not create canonical findings', async () => {
  const fixtures = {
    '/robots.txt': response(200, robotsFixture),
    '/sitemap.xml': response(200, sitemapUrlset(['https://comerent.net/observed-missing'])),
    '/': response(200, '<html><head><title>Home</title><link rel="canonical" href="https://comerent.net/"></head><body><a href="/observed-missing">Missing</a></body></html>', {
      'content-type': 'text/html'
    }),
    '/observed-missing': response(404, '<html><title>Not Found</title></html>', { 'content-type': 'text/html' })
  };
  const report = await runPublicSeoCrawler({ fetchImpl: fixtureFetch(fixtures), delayMs: 0 });
  const missing = report.pages.find(page => page.statusCode === 404);
  assert.equal(missing.finalUrl, 'https://comerent.net/observed-missing');
  assert.equal(missing.document, null);
  assert.equal(report.observations.some(item => item.type.startsWith('CANONICAL') && item.url.endsWith('/observed-missing')), false);
  assert.equal(report.summary.http404CandidateCount, 1);
});

test('effective URLs are deduplicated before page-level title aggregation', async () => {
  const calls = [];
  const fixtures = {
    '/robots.txt': response(200, robotsFixture),
    '/sitemap.xml': response(200, sitemapUrlset([
      'https://www.comerent.net/',
      'https://comerent.net/alias'
    ])),
    '/': url => new URL(url).hostname === 'comerent.net'
      ? response(301, '', { location: 'https://www.comerent.net/' })
      : response(200, '<html><head><title>Same title</title><link rel="canonical" href="https://comerent.net/"></head><body><a href="/booking">Book</a></body></html>', {
        'content-type': 'text/html'
      }),
    '/alias': response(301, '', { location: 'https://comerent.net/' })
  };
  const report = await runPublicSeoCrawler({ fetchImpl: fixtureFetch(fixtures, calls), delayMs: 0 });
  assert.equal(report.summary.pageRequestCount, 3);
  assert.equal(report.summary.uniqueEffectivePageCount, 1);
  assert.equal(report.summary.requestCount, calls.length);
  assert.deepEqual(report.summary.titleDuplicateGroups, []);
  assert.equal(calls.some(url => new URL(url).pathname === '/booking'), false);
});

test('120-page cap reports 120 of 224 URLs as partial, never confirmed orphan pages', async () => {
  const urls = Array.from({ length: 224 }, (_, index) => `https://comerent.net/page-${index + 1}`);
  const html = '<html><head><title>Fixture</title></head><body>No outgoing links</body></html>';
  const fixtures = {
    '/robots.txt': response(200, robotsFixture),
    '/sitemap.xml': response(200, sitemapUrlset(urls)),
    '/': response(200, html, { 'content-type': 'text/html' })
  };
  const report = await runPublicSeoCrawler({ fetchImpl: fixtureFetch(fixtures), delayMs: 0 });
  assert.equal(report.summary.sitemapUrlCount, 224);
  assert.equal(report.coverage.pageRequestCount, 120);
  assert.equal(report.coverage.status, 'PARTIAL');
  assert.equal(report.coverage.orphanAssessment, 'CANDIDATE_ONLY_NOT_VERIFIED');
  assert.equal(report.linkGraph.orphanCandidates.every(candidate => candidate.confirmedOrphan === false), true);
});

test('HTML parsing labels indexability as a hint and schema as an opportunity', async () => {
  const fixtures = {
    '/robots.txt': response(200, robotsFixture),
    '/sitemap.xml': response(200, sitemapUrlset(['https://comerent.net/sample'])),
    '/': response(200, '<html><title>Home</title></html>', { 'content-type': 'text/html' }),
    '/sample': response(200, '<html><head><title>Sample</title><meta name="robots" content="noindex"><link rel="canonical" href="https://www.comerent.net/sample/"><link rel="alternate" hreflang="en-US" href="https://www.comerent.net/sample/"><script type="application/ld+json">{"@graph":[{"@type":"Organization"}]}</script></head><body><h1>Sample</h1><h2>Sık sorulan sorular</h2></body></html>', {
      'content-type': 'text/html'
    })
  };
  const report = await runPublicSeoCrawler({ fetchImpl: fixtureFetch(fixtures), delayMs: 0 });
  const page = report.pages.find(item => item.finalUrl.endsWith('/sample'));
  assert.equal(page.document.canonical.status, 'MATCH');
  assert.equal(page.document.hreflang[0].langValid, true);
  assert.equal(page.document.schemaTypes.includes('Organization'), true);
  assert.equal(page.document.indexability.classification, 'BASIC_INDEXABILITY_HINT');
  assert.equal(page.document.indexability.status, 'NOINDEX_HINT');
  assert.equal(page.document.indexability.actualSearchIndexation, 'UNKNOWN_NO_SEARCH_CONSOLE_EVIDENCE');
  assert.equal(report.observations.some(item => item.type === 'FAQ_SCHEMA_ELIGIBILITY_REVIEW' && item.evidenceClass === 'INFERRED'), true);
});

test('master report keeps historical claims separate and unknown KPanel methods uncallable', async () => {
  const backlog = '## P0 - urgent\n* Canonical claim\n## P1 - later\n* Phone claim\n';
  const claims = parseHistoricalBacklog(backlog);
  assert.deepEqual(claims.map(item => item.currentPublicStatus), ['UNKNOWN', 'UNKNOWN']);

  const report = await buildMasterAuditReport({ backlogText: backlog, generatedAt: '2026-10-14T00:00:00.000Z' });
  assert.equal(report.sourceManifest.publicCrawl.evidenceClass, 'UNKNOWN');
  assert.equal(report.sourceManifest.kpanel.evidenceClass, 'UNKNOWN');
  assert.equal(report.kpanelEndpointCandidates[0].path, '/Locations/GetExcelReport');
  assert.equal(report.kpanelEndpointCandidates[0].method, 'UNKNOWN');
  assert.equal(report.kpanelEndpointCandidates[0].classification, 'UNKNOWN_DO_NOT_CALL');
  assert.equal(report.kpanelEndpointCandidates[0].callableByAuditPolicy, false);
  assert.equal(report.assessment, 'NOT_READY_FOR_HUMAN_REVIEW');
  assert.equal(classifyEndpoint('/sehirler', 'GET').classification, 'SAFE_GET_VERIFIED');
  assert.equal(classifyEndpoint('/example', 'POST', 'READ_QUERY').classification, 'POST_READ_LIKE_BLOCKED_BY_POLICY');
  assert.equal(classifyEndpoint('/example', 'POST', 'WRITE').classification, 'WRITE_POST_BLOCKED');
  assert.equal(classifyEndpoint('/Locations/GetExcelReport').classification, 'UNKNOWN_DO_NOT_CALL');
  assert.equal(classifyEndpoint('/Locations/GetExcelReportExtra', 'POST').classification, 'UNKNOWN_DO_NOT_CALL');
});
