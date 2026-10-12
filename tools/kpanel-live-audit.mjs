import fs from 'fs/promises';

import { auditRoute } from './kpanel-readonly-audit.mjs';
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
 * Security rules:
 * - Authentication cookie is injected here only.
 * - Cookie is never logged or written to evidence.
 * - URL/method/origin/route/redirect validation remains the responsibility
 *   of safeKpanelRequest(), which calls this adapter only after validation.
 */
async function liveFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});

  // Force the trusted runtime secret instead of accepting a caller-supplied
  // Cookie header.
  headers.set('Cookie', cookie);

  return globalThis.fetch(url, {
    ...options,
    headers
  });
}

function evidenceFilename(route) {
  const safeName = route
    .replace(/^\/+/, '')
    .replaceAll('/', '-')
    .replace(/[^a-zA-Z0-9_-]/g, '-');

  return `audit/evidence/kpanel-${safeName}.html`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const report = {
  generatedAt: new Date().toISOString(),
  targetOrigin: BASE_URL,
  mode: 'READ_ONLY',
  allowedMethods: ['GET', 'HEAD'],
  totalRoutes: ROUTES.length,
  succeeded: 0,
  failed: 0,
  routes: []
};

console.log(`Starting KPanel READ-ONLY audit for ${ROUTES.length} allowlisted routes.`);

for (let index = 0; index < ROUTES.length; index += 1) {
  const route = ROUTES[index];
  const url = `${BASE_URL}${route}`;
  const outputFile = evidenceFilename(route);

  console.log(`[${index + 1}/${ROUTES.length}] GET ${route}`);

  try {
    await auditRoute(url, outputFile, liveFetch);

    report.routes.push({
      route,
      method: 'GET',
      result: 'OK',
      evidence: outputFile
    });

    report.succeeded += 1;

    console.log(`OK ${route}`);
  } catch (error) {
    const safeMessage = redactSecrets(
      error instanceof Error ? error.message : String(error)
    );

    report.routes.push({
      route,
      method: 'GET',
      result: 'FAILED',
      error: safeMessage
    });

    report.failed += 1;

    console.error(`FAILED ${route}: ${safeMessage}`);

    /*
     * Fail closed.
     * If one route triggers an authentication redirect, disallowed redirect,
     * origin violation, method violation, or another guard failure, do not
     * continue probing additional routes.
     */
    console.error('AUDIT_STOPPED_BY_READ_ONLY_POLICY');
    break;
  }

  // Keep requests sequential and deliberately low-rate.
  if (index < ROUTES.length - 1) {
    await sleep(500);
  }
}

const jsonReportPath = validateOutputPath(
  'audit/reports/kpanel-live-audit.json'
);

const markdownReportPath = validateOutputPath(
  'audit/reports/kpanel-live-audit.md'
);

await fs.writeFile(
  jsonReportPath,
  JSON.stringify(redactSecrets(report), null, 2),
  'utf8'
);

const markdown = [
  '# KPanel Live READ-ONLY Audit',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  `Target: ${report.targetOrigin}`,
  '',
  `Mode: ${report.mode}`,
  '',
  `Routes planned: ${report.totalRoutes}`,
  '',
  `Succeeded: ${report.succeeded}`,
  '',
  `Failed: ${report.failed}`,
  '',
  '## Route Results',
  '',
  ...report.routes.map(item => {
    if (item.result === 'OK') {
      return `- OK — \`${item.method} ${item.route}\` — evidence: \`${item.evidence}\``;
    }

    return `- FAILED — \`${item.method} ${item.route}\` — ${item.error}`;
  }),
  ''
].join('\n');

await fs.writeFile(
  markdownReportPath,
  redactSecrets(markdown),
  'utf8'
);

console.log('');
console.log(`Audit completed: ${report.succeeded} OK / ${report.failed} FAILED`);
console.log('Report: audit/reports/kpanel-live-audit.json');
console.log('Report: audit/reports/kpanel-live-audit.md');

if (report.failed > 0) {
  process.exitCode = 1;
}
