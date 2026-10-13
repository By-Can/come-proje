import fs from 'fs/promises';

const ORIGIN = 'https://kpanel.comerent.net';

const ASSETS = [
  '/assets/js/kpaneljs/ContentsJS/contents.common.js',
  '/assets/js/kpaneljs/RedirectionsJS/redirections.create.js',
  '/assets/js/kpaneljs/LabelsJS/labels.common.js',
  '/assets/js/kpaneljs/CitiesJS/cities.common.js',
  '/assets/js/kpaneljs/LocationJS/locations.common.js',
  '/assets/js/kpaneljs/VehicleGroupsJS/vehicle-groups.common.js'
];

const TARGET_PATHS = [
  '/Cities/GetCities',
  '/Contents/BulkUpdateContentOrder',
  '/Contents/GetContents',
  '/Labels/GetLabels',
  '/Locations/BulkUpdateLocationStatus',
  '/Locations/GetExcelReport',
  '/Redirections/SaveNewRedirection',
  '/VehicleGroups/GetVehicleGroups'
];

async function fetchAsset(pathname) {
  const url = new URL(pathname, ORIGIN);

  if (url.origin !== ORIGIN || !ASSETS.includes(url.pathname)) {
    throw new Error('Asset is not in the exact static allowlist.');
  }

  const response = await fetch(url, {
    method: 'GET',
    redirect: 'manual',
    headers: {
      'User-Agent': 'ComeRent-KPanel-StaticJS-Context/1.0'
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

  return response.text();
}

function compact(value) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}()[\],;:])\s*/g, '$1')
    .trim();
}

function inferFromContext(context, targetOffset) {
  const methodRegex = /\b(?:type|method)\s*:\s*['"`]([A-Za-z]+)['"`]/gi;
  const methods = [];
  let match;

  while ((match = methodRegex.exec(context)) !== null) {
    methods.push({
      method: match[1].toUpperCase(),
      distance: Math.abs(match.index - targetOffset)
    });
  }

  methods.sort((a, b) => a.distance - b.distance);

  let invocation = 'UNKNOWN';

  if (/\$\.ajax\s*\(/i.test(context)) invocation = 'JQUERY_AJAX';
  else if (/\.DataTable\s*\(/i.test(context)) invocation = 'DATATABLE';
  else if (/\bfetch\s*\(/i.test(context)) invocation = 'FETCH';
  else if (/\$\.(?:get|getJSON)\s*\(/i.test(context)) invocation = 'JQUERY_GET';
  else if (/\$\.post\s*\(/i.test(context)) invocation = 'JQUERY_POST';
  else if (/window\.location|location\.href|location\.assign|window\.open/i.test(context)) invocation = 'NAVIGATION_OR_DOWNLOAD';

  let methodHint = methods[0]?.method || 'UNKNOWN';

  if (methodHint === 'UNKNOWN') {
    if (invocation === 'JQUERY_GET') methodHint = 'GET';
    else if (invocation === 'JQUERY_POST') methodHint = 'POST';
    else if (invocation === 'NAVIGATION_OR_DOWNLOAD') methodHint = 'GET_NAVIGATION';
  }

  return {
    methodHint,
    invocation,
    nearbyMethods: methods.slice(0, 5).map(item => item.method)
  };
}

const report = {
  generatedAt: new Date().toISOString(),
  targetOrigin: ORIGIN,
  mode: 'PASSIVE_PUBLIC_STATIC_JS_CONTEXT',
  sourceRequests: ASSETS.length,
  findings: []
};

for (const asset of ASSETS) {
  const source = await fetchAsset(asset);

  for (const target of TARGET_PATHS) {
    let from = 0;

    while (true) {
      const index = source.indexOf(target, from);
      if (index === -1) break;

      const start = Math.max(0, index - 700);
      const end = Math.min(source.length, index + target.length + 700);
      const rawContext = source.slice(start, end);
      const targetOffset = index - start;
      const inference = inferFromContext(rawContext, targetOffset);

      report.findings.push({
        asset,
        path: target,
        methodHint: inference.methodHint,
        invocation: inference.invocation,
        nearbyMethods: inference.nearbyMethods,
        context: compact(rawContext).slice(0, 1400)
      });

      from = index + target.length;
    }
  }
}

await fs.mkdir('audit/reports', { recursive: true });

await fs.writeFile(
  'audit/reports/kpanel-static-js-context.json',
  JSON.stringify(report, null, 2),
  'utf8'
);

const markdown = [
  '# KPanel Static JS Context Report',
  '',
  'Generated: ' + report.generatedAt,
  '',
  'Mode: PASSIVE PUBLIC STATIC JS CONTEXT',
  '',
  'Findings: ' + report.findings.length,
  '',
  ...report.findings.map(item => [
    '## ' + item.path,
    '',
    '- Asset: `' + item.asset + '`',
    '- Method hint: `' + item.methodHint + '`',
    '- Invocation: `' + item.invocation + '`',
    '- Nearby methods: ' + (item.nearbyMethods.length ? item.nearbyMethods.map(x => '`' + x + '`').join(', ') : 'none'),
    '',
    '```text',
    item.context,
    '```',
    ''
  ].join('\n'))
].join('\n');

await fs.writeFile(
  'audit/reports/kpanel-static-js-context.md',
  markdown,
  'utf8'
);

console.log('Static JS context findings:', report.findings.length);

for (const item of report.findings) {
  console.log(item.path, '=>', item.methodHint, '/', item.invocation);
}
