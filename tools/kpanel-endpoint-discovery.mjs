import fs from 'fs/promises';
import * as cheerio from 'cheerio';

import { safeKpanelRequest } from './kpanel-safe-request.mjs';
import {
  validateOutputPath,
  redactSecrets
} from './kpanel-readonly-guard.mjs';

const BASE_URL = 'https://kpanel.comerent.net';

const ROUTES = [
  '/icerik-listesi/7',
  '/icerik-listesi/13',
  '/icerik-listesi/6',
  '/icerik-listesi/9',
  '/icerik-listesi/8',
  '/icerik-listesi/12',
  '/icerik-listesi/11',
  '/icerik-listesi/1',
  '/yonlendirme',
  '/icerik-grup-listesi',
  '/etiket-listesi',
  '/sehirler',
  '/lokasyon-listesi',
  '/arac-kategorisi'
];

const STATIC_EXTENSIONS = new Set([
  '.js',
  '.css',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.map'
]);

const cookie = process.env.KPANEL_SESSION_COOKIE;

if (!cookie) {
  console.error('AUTH_FAILED: KPANEL_SESSION_COOKIE is not configured.');
  process.exit(2);
}

if (typeof globalThis.fetch !== 'function') {
  console.error('RUNTIME_FAILED: global fetch is unavailable.');
  process.exit(3);
}

/**
 * Real network adapter.
 *
 * The session cookie exists only in memory and is injected here.
 * It is never written to reports or evidence.
 */
async function liveFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});

  // Never trust a caller-provided Cookie header.
  headers.set('Cookie', cookie);

  return globalThis.fetch(url, {
    ...options,
    headers
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isStaticAsset(pathname) {
  const lower = pathname.toLowerCase();

  for (const extension of STATIC_EXTENSIONS) {
    if (lower.endsWith(extension)) return true;
  }

  return false;
}

/**
 * Convert an endpoint-like string into a safe same-origin representation.
 *
 * Query parameter VALUES are never stored.
 * Only parameter names are retained.
 */
function normalizeCandidate(rawValue, pageUrl, { allowStatic = false } = {}) {
  if (typeof rawValue !== 'string') return null;

  let value = rawValue.trim();

  if (!value) return null;

  // Common JavaScript escaped slash representation.
  value = value.replaceAll('\\/', '/');

  const lower = value.toLowerCase();

  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:') ||
    lower.startsWith('#')
  ) {
    return null;
  }

  // Dynamic/template expressions cannot be safely resolved here.
  if (
    value.includes('${') ||
    value.includes('{{') ||
    value.includes('<%') ||
    value.includes('://')
      && !lower.startsWith('https://')
      && !lower.startsWith('http://')
  ) {
    return null;
  }

  let parsed;

  try {
    parsed = new URL(value, pageUrl);
  } catch {
    return null;
  }

  // Discovery is interested only in the exact KPanel origin.
  if (parsed.origin !== BASE_URL) {
    return null;
  }

  if (!allowStatic && isStaticAsset(parsed.pathname)) {
    return null;
  }

  const keys = [
    ...new Set(
      [...parsed.searchParams.keys()]
        .filter(Boolean)
        .sort()
    )
  ];

  const safeQuery = keys.length
    ? `?${keys.map(key => `${encodeURIComponent(key)}=[REDACTED]`).join('&')}`
    : '';

  return `${parsed.pathname}${safeQuery}`;
}

function addCandidate(collection, candidate) {
  if (!candidate?.path) return;

  const key = [
    candidate.path,
    candidate.discoverySource,
    candidate.methodHint || 'UNKNOWN'
  ].join('|');

  if (!collection.has(key)) {
    collection.set(key, candidate);
  }
}

function extractInlineScriptCandidates(scriptText, pageUrl, collection) {
  if (!scriptText) return;

  const patterns = [
    {
      name: 'ajax-url-property',
      methodHint: 'UNKNOWN',
      regex: /(?:ajax|url|endpoint|source|sAjaxSource)\s*[:=]\s*['"`]([^'"`]+)['"`]/gi
    },
    {
      name: 'fetch',
      methodHint: 'GET_OR_CONFIGURED',
      regex: /\bfetch\s*\(\s*['"`]([^'"`]+)['"`]/gi
    },
    {
      name: 'jquery-get',
      methodHint: 'GET',
      regex: /\$\.(?:get|getJSON)\s*\(\s*['"`]([^'"`]+)['"`]/gi
    },
    {
      name: 'jquery-post',
      methodHint: 'POST',
      regex: /\$\.post\s*\(\s*['"`]([^'"`]+)['"`]/gi
    },
    {
      name: 'axios-get',
      methodHint: 'GET',
      regex: /\baxios\.get\s*\(\s*['"`]([^'"`]+)['"`]/gi
    },
    {
      name: 'axios-post',
      methodHint: 'POST',
      regex: /\baxios\.post\s*\(\s*['"`]([^'"`]+)['"`]/gi
    },
    {
      name: 'quoted-root-path',
      methodHint: 'UNKNOWN',
      regex: /['"`](\/[A-Za-z0-9À-ž_./?&=%:+-]+)['"`]/g
    }
  ];

  for (const pattern of patterns) {
    pattern.regex.lastIndex = 0;

    let match;

    while ((match = pattern.regex.exec(scriptText)) !== null) {
      const path = normalizeCandidate(match[1], pageUrl);

      if (!path) continue;

      addCandidate(collection, {
        path,
        discoverySource: `inline-script:${pattern.name}`,
        methodHint: pattern.methodHint
      });
    }
  }
}

function extractAttributeCandidates($, pageUrl, collection) {
  $('*').each((_, element) => {
    const attributes = element.attribs || {};

    for (const [attributeName, attributeValue] of Object.entries(attributes)) {
      const lowerName = attributeName.toLowerCase();

      const interesting =
        lowerName === 'action' ||
        lowerName === 'data-url' ||
        lowerName === 'data-ajax' ||
        lowerName === 'data-source' ||
        lowerName === 'data-endpoint' ||
        lowerName === 'data-action' ||
        lowerName === 'data-href' ||
        (
          lowerName.startsWith('data-') &&
          (
            lowerName.includes('url') ||
            lowerName.includes('ajax') ||
            lowerName.includes('source') ||
            lowerName.includes('endpoint')
          )
        );

      if (!interesting) continue;

      const path = normalizeCandidate(attributeValue, pageUrl);

      if (!path) continue;

      addCandidate(collection, {
        path,
        discoverySource: `html-attribute:${lowerName}`,
        methodHint: lowerName === 'action' ? 'FORM_UNKNOWN' : 'UNKNOWN'
      });
    }
  });
}

function extractScriptSources($, pageUrl) {
  const sources = new Set();

  $('script[src]').each((_, element) => {
    const src = $(element).attr('src');

    const safeSource = normalizeCandidate(
      src,
      pageUrl,
      { allowStatic: true }
    );

    if (safeSource) {
      sources.add(safeSource);
    }
  });

  return [...sources].sort();
}

const report = {
  generatedAt: new Date().toISOString(),
  targetOrigin: BASE_URL,
  mode: 'PASSIVE_READ_ONLY_ENDPOINT_DISCOVERY',
  requestsExecutedAgainstDiscoveredCandidates: 0,
  sourcePageMethod: 'GET',
  totalSourcePages: ROUTES.length,
  succeeded: 0,
  failed: 0,
  pages: []
};

console.log(
  `Starting passive endpoint discovery across ${ROUTES.length} allowlisted KPanel pages.`
);

for (let index = 0; index < ROUTES.length; index += 1) {
  const route = ROUTES[index];
  const pageUrl = `${BASE_URL}${route}`;

  console.log(`[${index + 1}/${ROUTES.length}] GET ${route}`);

  try {
    /*
     * This request still passes through safeKpanelRequest:
     * exact origin, route allowlist, GET/HEAD-only policy and
     * redirect validation remain enforced.
     */
    const response = await safeKpanelRequest(
      pageUrl,
      { method: 'GET' },
      liveFetch
    );

    if (!response.ok) {
      throw new Error(`Source page returned HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('text/html')) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    /*
     * RAW HTML exists only in this process memory.
     * It is never written to disk.
     */
    const rawHtml = await response.text();
    const $ = cheerio.load(rawHtml);

    const candidates = new Map();

    extractAttributeCandidates($, pageUrl, candidates);

    $('script:not([src])').each((_, element) => {
      const scriptText = $(element).html() || '';

      extractInlineScriptCandidates(
        scriptText,
        pageUrl,
        candidates
      );
    });

    const scriptSources = extractScriptSources($, pageUrl);

    const safeCandidates = [...candidates.values()]
      .sort((a, b) => {
        const pathCompare = a.path.localeCompare(b.path);

        if (pathCompare !== 0) return pathCompare;

        return a.discoverySource.localeCompare(b.discoverySource);
      });

    report.pages.push({
      route,
      result: 'OK',
      httpStatus: response.status,
      scriptSources,
      discoveredCandidates: safeCandidates
    });

    report.succeeded += 1;

    console.log(
      `OK ${route} — ${safeCandidates.length} endpoint candidate(s), ` +
      `${scriptSources.length} same-origin script source(s)`
    );
  } catch (error) {
    const safeMessage = redactSecrets(
      error instanceof Error ? error.message : String(error)
    );

    report.pages.push({
      route,
      result: 'FAILED',
      error: safeMessage
    });

    report.failed += 1;

    console.error(`FAILED ${route}: ${safeMessage}`);
    console.error('DISCOVERY_STOPPED_BY_READ_ONLY_POLICY');

    // Fail closed.
    break;
  }

  if (index < ROUTES.length - 1) {
    await sleep(500);
  }
}

const uniqueCandidateMap = new Map();

for (const page of report.pages) {
  for (const candidate of page.discoveredCandidates || []) {
    const key = `${candidate.path}|${candidate.methodHint}`;

    if (!uniqueCandidateMap.has(key)) {
      uniqueCandidateMap.set(key, {
        path: candidate.path,
        methodHint: candidate.methodHint,
        seenOn: []
      });
    }

    const entry = uniqueCandidateMap.get(key);

    if (!entry.seenOn.includes(page.route)) {
      entry.seenOn.push(page.route);
    }
  }
}

report.uniqueCandidates = [...uniqueCandidateMap.values()]
  .sort((a, b) => a.path.localeCompare(b.path));

report.uniqueCandidateCount = report.uniqueCandidates.length;

/*
 * Important:
 * No discovered endpoint candidate is requested by this script.
 */
report.requestsExecutedAgainstDiscoveredCandidates = 0;

const jsonPath = validateOutputPath(
  'audit/reports/kpanel-endpoint-discovery.json'
);

const markdownPath = validateOutputPath(
  'audit/reports/kpanel-endpoint-discovery.md'
);

const safeReport = redactSecrets(report);

await fs.writeFile(
  jsonPath,
  JSON.stringify(safeReport, null, 2),
  'utf8'
);

const markdown = [
  '# KPanel Passive Endpoint Discovery',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  `Target: ${BASE_URL}`,
  '',
  'Mode: PASSIVE READ-ONLY',
  '',
  `Source pages planned: ${report.totalSourcePages}`,
  '',
  `Succeeded: ${report.succeeded}`,
  '',
  `Failed: ${report.failed}`,
  '',
  `Unique endpoint candidates: ${report.uniqueCandidateCount}`,
  '',
  `Requests sent to discovered candidates: ${report.requestsExecutedAgainstDiscoveredCandidates}`,
  '',
  '## Discovered Candidates',
  '',
  ...report.uniqueCandidates.map(candidate => {
    const seenOn = candidate.seenOn
      .map(route => `\`${route}\``)
      .join(', ');

    return (
      `- \`${candidate.path}\` — method hint: ` +
      `\`${candidate.methodHint}\` — seen on: ${seenOn}`
    );
  }),
  '',
  '## Source Page Summary',
  '',
  ...report.pages.map(page => {
    if (page.result !== 'OK') {
      return `- FAILED — \`${page.route}\` — ${page.error}`;
    }

    return (
      `- OK — \`${page.route}\` — ` +
      `${page.discoveredCandidates.length} candidate(s), ` +
      `${page.scriptSources.length} same-origin script source(s)`
    );
  }),
  ''
].join('\n');

await fs.writeFile(
  markdownPath,
  redactSecrets(markdown),
  'utf8'
);

console.log('');
console.log(
  `Discovery completed: ${report.succeeded} OK / ${report.failed} FAILED`
);
console.log(
  `Unique endpoint candidates: ${report.uniqueCandidateCount}`
);
console.log(
  'Requests to discovered candidates: 0'
);
console.log(
  'Report: audit/reports/kpanel-endpoint-discovery.json'
);
console.log(
  'Report: audit/reports/kpanel-endpoint-discovery.md'
);

if (report.failed > 0) {
  process.exitCode = 1;
}
