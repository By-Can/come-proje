import fs from 'fs/promises';

const ORIGIN = 'https://kpanel.comerent.net';

const ASSETS = [
  '/assets/js/kpaneljs/ContentsJS/contents.common.js',
  '/assets/js/kpaneljs/RedirectionsJS/redirections.common.js',
  '/assets/js/kpaneljs/RedirectionsJS/redirections.create.js',
  '/assets/js/kpaneljs/ContentGroupsJS/content-groups.common.js',
  '/assets/js/kpaneljs/LabelsJS/labels.common.js',
  '/assets/js/kpaneljs/CitiesJS/cities.common.js',
  '/assets/js/kpaneljs/LocationJS/locations.common.js',
  '/assets/js/kpaneljs/LocationJS/locations-vendor.modal.js',
  '/assets/js/kpaneljs/VehicleGroupsJS/vehicle-groups.common.js'
];

function normalizePath(raw, baseUrl) {
  if (typeof raw !== 'string') return null;

  let value = raw.trim().replaceAll('\\/', '/');
  if (!value) return null;

  if (
    value.startsWith('#') ||
    /^(?:javascript:|data:|mailto:|tel:)/i.test(value) ||
    value.includes('${') ||
    value.includes('{{') ||
    value.includes('<%')
  ) {
    return null;
  }

  let url;
  try {
    url = new URL(value, baseUrl);
  } catch {
    return null;
  }

  if (url.origin !== ORIGIN) return null;

  const keys = [...new Set([...url.searchParams.keys()].filter(Boolean))].sort();
  const safeQuery = keys.length
    ? '?' + keys.map(key => encodeURIComponent(key) + '=[REDACTED]').join('&')
    : '';

  return url.pathname + safeQuery;
}

function addCandidate(map, candidate) {
  if (!candidate?.path) return;

  const key = [
    candidate.path,
    candidate.methodHint || 'UNKNOWN',
    candidate.sourcePattern || 'UNKNOWN'
  ].join('|');

  if (!map.has(key)) map.set(key, candidate);
}

function extractCandidates(source, baseUrl) {
  const found = new Map();

  const patterns = [
    {
      sourcePattern: 'fetch',
      methodHint: 'GET_OR_CONFIGURED',
      regex: /\bfetch\s*\(\s*['"`]([^'"`]+)['"`]/gi
    },
    {
      sourcePattern: 'jquery-get',
      methodHint: 'GET',
      regex: /\$\.(?:get|getJSON)\s*\(\s*['"`]([^'"`]+)['"`]/gi
    },
    {
      sourcePattern: 'jquery-post',
      methodHint: 'POST',
      regex: /\$\.post\s*\(\s*['"`]([^'"`]+)['"`]/gi
    },
    {
      sourcePattern: 'axios-get',
      methodHint: 'GET',
      regex: /\baxios\.get\s*\(\s*['"`]([^'"`]+)['"`]/gi
    },
    {
      sourcePattern: 'axios-post',
      methodHint: 'POST',
      regex: /\baxios\.post\s*\(\s*['"`]([^'"`]+)['"`]/gi
    },
    {
      sourcePattern: 'ajax-url',
      methodHint: 'UNKNOWN',
      regex: /(?:ajax|url|endpoint|source|sAjaxSource)\s*[:=]\s*['"`]([^'"`]+)['"`]/gi
    },
    {
      sourcePattern: 'quoted-root-path',
      methodHint: 'UNKNOWN',
      regex: /['"`](\/[A-Za-z0-9À-ž_./?&=%:+-]+)['"`]/g
    }
  ];

  for (const pattern of patterns) {
    pattern.regex.lastIndex = 0;

    let match;
    while ((match = pattern.regex.exec(source)) !== null) {
      const path = normalizePath(match[1], baseUrl);
      if (!path) continue;

      addCandidate(found, {
        path,
        methodHint: pattern.methodHint,
        sourcePattern: pattern.sourcePattern
      });
    }
  }

  for (const match of source.matchAll(/\$\.ajax\s*\(\s*\{([\s\S]{0,2500}?)\}\s*\)/gi)) {
    const block = match[1] || '';
    const urlMatch = block.match(/\burl\s*:\s*['"`]([^'"`]+)['"`]/i);
    if (!urlMatch) continue;

    const methodMatch = block.match(/\b(?:type|method)\s*:\s*['"`]([A-Za-z]+)['"`]/i);
    const methodHint = methodMatch ? methodMatch[1].toUpperCase() : 'UNKNOWN';
    const path = normalizePath(urlMatch[1], baseUrl);

    if (path) {
      addCandidate(found, {
        path,
        methodHint,
        sourcePattern: 'jquery-ajax-block'
      });
    }
  }

  for (const match of source.matchAll(/\.DataTable\s*\(\s*\{([\s\S]{0,7000}?)\}\s*\)/gi)) {
    const block = match[1] || '';

    const directAjax = block.match(/\bajax\s*:\s*['"`]([^'"`]+)['"`]/i);
    if (directAjax) {
      const path = normalizePath(directAjax[1], baseUrl);
      if (path) {
        addCandidate(found, {
          path,
          methodHint: 'GET_OR_CONFIGURED',
          sourcePattern: 'datatable-ajax'
        });
      }
    }

    const objectAjax = block.match(/\bajax\s*:\s*\{([\s\S]{0,3500}?)\}/i);
    if (objectAjax) {
      const ajax = objectAjax[1] || '';
      const urlMatch = ajax.match(/\burl\s*:\s*['"`]([^'"`]+)['"`]/i);

      if (urlMatch) {
        const methodMatch = ajax.match(/\b(?:type|method)\s*:\s*['"`]([A-Za-z]+)['"`]/i);
        const methodHint = methodMatch ? methodMatch[1].toUpperCase() : 'GET_OR_CONFIGURED';
        const path = normalizePath(urlMatch[1], baseUrl);

        if (path) {
          addCandidate(found, {
            path,
            methodHint,
            sourcePattern: 'datatable-ajax-object'
          });
        }
      }
    }
  }

  return [...found.values()].sort((a, b) =>
    a.path.localeCompare(b.path) ||
    a.methodHint.localeCompare(b.methodHint) ||
    a.sourcePattern.localeCompare(b.sourcePattern)
  );
}

async function fetchAsset(pathname) {
  const url = new URL(pathname, ORIGIN);

  if (url.origin !== ORIGIN || !ASSETS.includes(url.pathname)) {
    throw new Error('Asset is not in the exact static allowlist.');
  }

  const response = await fetch(url, {
    method: 'GET',
    redirect: 'manual',
    headers: {
      'User-Agent': 'ComeRent-KPanel-StaticJS-Discovery/1.0'
    }
  });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (!location) throw new Error('Redirect without location.');

    const next = new URL(location, url);
    if (next.origin !== ORIGIN || !ASSETS.includes(next.pathname)) {
      throw new Error('Redirect escaped exact static allowlist.');
    }

    return fetchAsset(next.pathname);
  }

  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!/javascript|text\/plain|application\/octet-stream/i.test(contentType)) {
    throw new Error('Unexpected content type: ' + contentType);
  }

  return response.text();
}

const report = {
  generatedAt: new Date().toISOString(),
  targetOrigin: ORIGIN,
  mode: 'PASSIVE_PUBLIC_STATIC_JS_DISCOVERY',
  requests: ASSETS.length,
  succeeded: 0,
  failed: 0,
  assets: [],
  uniqueCandidates: []
};

const unique = new Map();

for (const asset of ASSETS) {
  const url = new URL(asset, ORIGIN).href;

  try {
    const source = await fetchAsset(asset);
    const candidates = extractCandidates(source, url);

    report.assets.push({
      asset,
      result: 'OK',
      byteLength: Buffer.byteLength(source),
      candidates
    });

    report.succeeded += 1;

    for (const candidate of candidates) {
      const key = candidate.path + '|' + candidate.methodHint;

      if (!unique.has(key)) {
        unique.set(key, {
          path: candidate.path,
          methodHint: candidate.methodHint,
          seenIn: [],
          patterns: []
        });
      }

      const entry = unique.get(key);

      if (!entry.seenIn.includes(asset)) entry.seenIn.push(asset);
      if (!entry.patterns.includes(candidate.sourcePattern)) {
        entry.patterns.push(candidate.sourcePattern);
      }
    }

    console.log('OK', asset, '-', candidates.length, 'candidate(s)');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    report.assets.push({
      asset,
      result: 'FAILED',
      error: message
    });

    report.failed += 1;
    console.error('FAILED', asset, '-', message);
  }
}

report.uniqueCandidates = [...unique.values()].sort((a, b) =>
  a.path.localeCompare(b.path) || a.methodHint.localeCompare(b.methodHint)
);

report.uniqueCandidateCount = report.uniqueCandidates.length;

await fs.mkdir('audit/reports', { recursive: true });

await fs.writeFile(
  'audit/reports/kpanel-static-js-discovery.json',
  JSON.stringify(report, null, 2),
  'utf8'
);

const markdown = [
  '# KPanel Static JS Endpoint Discovery',
  '',
  'Generated: ' + report.generatedAt,
  '',
  'Mode: PASSIVE PUBLIC STATIC JS DISCOVERY',
  '',
  'Static JS files planned: ' + ASSETS.length,
  '',
  'Succeeded: ' + report.succeeded,
  '',
  'Failed: ' + report.failed,
  '',
  'Unique endpoint candidates: ' + report.uniqueCandidateCount,
  '',
  '## Candidates',
  '',
  ...report.uniqueCandidates.map(item =>
    '- `' + item.path + '` — method: `' + item.methodHint +
    '` — scripts: ' + item.seenIn.map(x => '`' + x + '`').join(', ') +
    ' — patterns: ' + item.patterns.join(', ')
  ),
  '',
  '## Asset Summary',
  '',
  ...report.assets.map(item =>
    '- ' + item.result + ' — `' + item.asset + '`' +
    (item.result === 'OK'
      ? ' — ' + item.candidates.length + ' candidate(s), ' + item.byteLength + ' bytes'
      : ' — ' + item.error)
  ),
  ''
].join('\n');

await fs.writeFile(
  'audit/reports/kpanel-static-js-discovery.md',
  markdown,
  'utf8'
);

console.log('');
console.log(
  'Static JS discovery completed:',
  report.succeeded,
  'OK /',
  report.failed,
  'FAILED'
);
console.log('Unique endpoint candidates:', report.uniqueCandidateCount);

if (report.succeeded === 0) {
  process.exitCode = 1;
}
