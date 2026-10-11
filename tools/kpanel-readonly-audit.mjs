import fs from 'fs/promises';
import { validateOutputPath } from './kpanel-readonly-guard.mjs';
import { safeKpanelRequest } from './kpanel-safe-request.mjs';
import { sanitizeHtml } from './kpanel-passive-html.mjs';

/**
 * Conducts a readonly audit of a given KPanel route safely.
 * @param {string} url - Target URL to audit
 * @param {string} outputFilePath - Target file path relative to cwd
 * @param {function} fetchImpl - Mock fetch function
 */
export async function auditRoute(url, outputFilePath, fetchImpl) {
  // Validate path traversal BEFORE attempting any request
  const safeOutput = validateOutputPath(outputFilePath);

  // Perform safe request
  const response = await safeKpanelRequest(url, { method: 'GET' }, fetchImpl);

  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';

  let finalContent = text;

  if (contentType.includes('text/html')) {
    // Force sanitization of HTML before writing
    finalContent = sanitizeHtml(text);
  }

  // Write safe evidence
  await fs.writeFile(safeOutput, finalContent, 'utf-8');
}
