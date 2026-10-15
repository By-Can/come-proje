import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  redactSecrets,
  validateHttpMethod,
  validateKpanelUrl,
  validateOutputPath,
  validateRouteAllowlist
} from './kpanel-readonly-guard.mjs';

const UNKNOWN_ENDPOINT = '/Locations/GetExcelReport';
const KPANEL_ORIGIN = 'https://kpanel.comerent.net';

export function classifyEndpoint(path, methodHint = 'UNKNOWN', operation = 'UNKNOWN', sourceEvidence = null) {
  const method = typeof methodHint === 'string' ? methodHint.toUpperCase() : 'UNKNOWN';
  const methodVerified = sourceEvidence?.method === method;
  const operationVerified = sourceEvidence?.operation === operation;
  const hasSource = typeof sourceEvidence?.source === 'string' && sourceEvidence.source.length > 0;
  let verifiedRoute = false;
  try {
    const url = validateKpanelUrl(new URL(path, KPANEL_ORIGIN).href);
    validateRouteAllowlist(url.pathname);
    verifiedRoute = true;
  } catch {
    verifiedRoute = false;
  }

  if (verifiedRoute && ['GET', 'HEAD'].includes(method)) {
    validateHttpMethod(method);
    return {
      classification: 'SAFE_GET_VERIFIED',
      method,
      callableByAuditPolicy: true,
      reason: 'Exact verified KPanel route and read-only method.'
    };
  }
  if (method === 'POST' && operation === 'READ_QUERY' && methodVerified && operationVerified && hasSource) {
    return {
      classification: 'POST_READ_LIKE_BLOCKED_BY_POLICY',
      method,
      callableByAuditPolicy: false,
      reason: 'Static source identifies a read-like POST; POST is prohibited by policy.'
    };
  }
  if (method === 'POST' && operation === 'WRITE' && methodVerified && operationVerified && hasSource) {
    return {
      classification: 'WRITE_POST_BLOCKED',
      method,
      callableByAuditPolicy: false,
      reason: 'Static source identifies a write POST; state-changing requests are prohibited.'
    };
  }
  return {
    classification: 'UNKNOWN_DO_NOT_CALL',
    method: 'UNKNOWN',
    callableByAuditPolicy: false,
    reason: 'Method or exact route is not supported by verified read-only evidence.'
  };
}

export function parseHistoricalBacklog(markdown) {
  const issues = [];
  let priority = 'UNKNOWN';
  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(P[0-3])\b/);
    if (heading) {
      priority = heading[1];
      continue;
    }
    const bullet = line.match(/^\s*[*-]\s+(.+)$/);
    if (bullet) {
      if (/^\s*\*.*\*\s*$/.test(bullet[1])) continue;
      issues.push({
        historicalPriority: priority,
        claim: bullet[1].replace(/\s+/g, ' ').trim(),
        source: 'BACKLOG.md',
        sourceTimestamp: null,
        currentPublicStatus: 'UNKNOWN',
        currentEvidence: 'No verified URL mapping or current public observation is available.'
      });
    }
  }
  return issues;
}

export async function buildMasterAuditReport({
  crawlReport = null,
  backlogText,
  generatedAt = new Date().toISOString()
} = {}) {
  const historicalText = backlogText ?? await fs.readFile('BACKLOG.md', 'utf8').catch(() => '');
  const findings = Array.isArray(crawlReport?.observations) ? crawlReport.observations : [];
  const publicEvidenceClass = !crawlReport
    ? 'UNKNOWN'
    : crawlReport.coverage?.status === 'BLOCKED_BY_POLICY'
      ? 'BLOCKED_BY_POLICY'
      : 'VERIFIED';
  const priorityMatrix = Object.fromEntries(
    ['P0', 'P1', 'P2', 'P3'].map(priority => [
      priority,
      findings.filter(finding => finding.priority === priority)
    ])
  );

  return redactSecrets({
    generatedAt,
    assessment: 'NOT_READY_FOR_HUMAN_REVIEW',
    sourceManifest: {
      publicCrawl: crawlReport ? {
        evidenceClass: publicEvidenceClass,
        source: 'tools/public-seo-crawler.mjs',
        sourceRunId: crawlReport.sourceRunId ?? null,
        generatedAt: crawlReport.generatedAt ?? null,
        coverage: crawlReport.coverage ?? null,
        pageRequestCount: crawlReport.summary?.pageRequestCount ?? null
      } : {
        evidenceClass: 'UNKNOWN',
        source: null,
        sourceRunId: null,
        generatedAt: null,
        coverage: null,
        pageRequestCount: null
      },
      kpanel: {
        evidenceClass: 'UNKNOWN',
        source: null,
        sourceRunId: null,
        generatedAt: null,
        note: 'No current KPanel source manifest is available; no KPanel request was made.'
      },
      backlog: {
        evidenceClass: 'VERIFIED',
        source: 'BACKLOG.md',
        sourceRunId: null,
        generatedAt: null,
        meaning: 'Verified as historical backlog text only, not as a current production finding.'
      }
    },
    // Separate immutable request outcomes from final-page aggregates.
    // Never reconstruct historical success or 404 status from deduplicated pages.
    publicRequestManifest: Array.isArray(crawlReport?.requestManifest)
      ? crawlReport.requestManifest
      : [],
    findings,
    priorityMatrix,
    historicalIssues: parseHistoricalBacklog(historicalText),
    kpanelEndpointCandidates: [{
      path: UNKNOWN_ENDPOINT,
      ...classifyEndpoint(UNKNOWN_ENDPOINT),
      evidenceClass: 'UNKNOWN',
      source: 'tools/kpanel-static-js-context.mjs candidate list; no checked-in source observation establishes the method.',
      sourceTimestamp: null,
    }],
    unresolvedWork: [
      'Historical BACKLOG.md claims remain separate from current findings until verified public URLs and matching evidence are available.',
      'KPanel data, source reports, endpoint methods other than verified allowlisted routes, and edit feasibility remain UNKNOWN.',
      'Actual Google/Bing indexation, booking impact, and customer impact are not measured by this crawler.',
      'No KPanel change or production SEO change is authorized; owner approval is required before any production action.'
    ]
  });
}

export function renderMasterAuditMarkdown(report) {
  const rows = findings => findings.length
    ? findings.map(finding => (
      `| ${finding.priority ?? 'UNKNOWN'} | ${finding.evidenceClass ?? 'UNKNOWN'} / ${finding.confidence ?? 'UNKNOWN'} | \`${finding.url ?? 'UNKNOWN'}\` | ${String(finding.type ?? 'Observation').replaceAll('|', '\\|')} | ${String(finding.proof ?? '').replaceAll('|', '\\|')} | ${String(finding.customerImpactHypothesis ?? 'UNKNOWN').replaceAll('|', '\\|')} | ${String(finding.recommendedOwnerAction ?? 'UNKNOWN').replaceAll('|', '\\|')} | ${String(finding.risk ?? 'UNKNOWN').replaceAll('|', '\\|')} | ${String(finding.acceptanceTest ?? 'UNKNOWN').replaceAll('|', '\\|')} | ${finding.kpanelFeasibility ?? 'UNKNOWN'} | ${finding.humanApprovalRequired === false ? 'NO' : 'YES'} |`
    ))
    : ['| — | — | — | No current public observations supplied | — | — | — | — | — | — | — |'];
  const historicalRows = report.historicalIssues.length
    ? report.historicalIssues.map(item => (
      `| ${item.historicalPriority} | ${String(item.claim).replaceAll('|', '\\|')} | UNKNOWN | ${item.currentEvidence} |`
    ))
    : ['| — | No historical backlog source available | UNKNOWN | — |'];

  return [
    '# Come Rent Master Audit',
    '',
    `Generated: ${report.generatedAt}`,
    `Assessment: **${report.assessment}**`,
    '',
    '## Source manifest',
    '',
    '| Source | Evidence class | Run ID | Timestamp | Coverage / note |',
    '| --- | --- | --- | --- | --- |',
    ...Object.entries(report.sourceManifest).map(([name, source]) => (
      `| ${name} | ${source.evidenceClass} | ${source.sourceRunId ?? 'UNKNOWN'} | ${source.generatedAt ?? 'UNKNOWN'} | ${source.note ?? source.meaning ?? (source.coverage ? JSON.stringify(source.coverage) : 'UNKNOWN')} |`
    )),
    '',
    '## Current observations (P0–P3)',
    '',
    '| Priority | Evidence / confidence | Exact URL | Observation | Proof | Customer impact hypothesis | Owner action | Risk | Acceptance test | KPanel feasibility | Human approval |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows(report.findings),
    '',
    'Schema, FAQ, and indexability signals are opportunities or preliminary eligibility observations only; this report does not establish search-engine indexation or a universal schema requirement.',
    '',
    '## Historical backlog claims — not current findings',
    '',
    '| Historical priority | Claim from BACKLOG.md | Current public status | Evidence / limitation |',
    '| --- | --- | --- | --- |',
    ...historicalRows,
    '',
    '## KPanel endpoint candidate',
    '',
    ...report.kpanelEndpointCandidates.map(candidate => (
      `- \`${candidate.path}\`: method **${candidate.method}**, classification **${candidate.classification}**; do not call. ${candidate.source}`
    )),
    '',
    '## Unresolved work',
    '',
    ...report.unresolvedWork.map(item => `- ${item}`),
    ''
  ].join('\n');
}

export async function writeMasterAuditReport(report) {
  const jsonPath = validateOutputPath('audit/reports/master-audit.json');
  const markdownPath = validateOutputPath('audit/reports/master-audit.md');
  const safeReport = redactSecrets(report);
  await fs.writeFile(jsonPath, JSON.stringify(safeReport, null, 2), 'utf8');
  await fs.writeFile(markdownPath, redactSecrets(renderMasterAuditMarkdown(safeReport)), 'utf8');
  return { jsonPath, markdownPath };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildMasterAuditReport()
    .then(async report => {
      await writeMasterAuditReport(report);
      console.log('Master audit generated with UNKNOWN current public and KPanel evidence.');
    })
    .catch(error => {
      console.error('Master audit generation failed:', redactSecrets(error.message));
      process.exitCode = 1;
    });
}
