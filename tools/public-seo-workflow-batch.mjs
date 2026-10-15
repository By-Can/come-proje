import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export function resolvePublicSeoWorkflowBatch({ eventName, dispatchInput, request }) {
  if (eventName !== 'workflow_dispatch' && eventName !== 'push') {
    throw new Error('Only manual workflow_dispatch or approved main-branch request-file push is permitted');
  }
  const raw = eventName === 'workflow_dispatch'
    ? (dispatchInput === undefined || dispatchInput === '' ? 'default' : dispatchInput)
    : (request?.batchIndex ?? 'default');
  if (typeof raw !== 'string' && typeof raw !== 'number') {
    throw new TypeError('Batch selection must be a scalar string or number');
  }
  const batch = String(raw).trim();
  if (batch !== 'default' && !/^(?:0|[1-9][0-9]{0,2})$/.test(batch)) {
    throw new RangeError('Invalid batch selection (expected default or integer 0..999)');
  }
  return batch;
}

export function writeWorkflowBatchSelection({ eventName, dispatchInput, request, outputPath }) {
  const batch = resolvePublicSeoWorkflowBatch({ eventName, dispatchInput, request });
  if (typeof outputPath !== 'string' || !outputPath) {
    throw new Error('GITHUB_OUTPUT file is required');
  }
  fs.appendFileSync(outputPath, `batch_index=${batch}\n`, 'utf8');
  return batch;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const eventName = process.env.GITHUB_EVENT_NAME;
    const request = eventName === 'push'
      ? JSON.parse(fs.readFileSync('audit/triggers/public-seo-request.json', 'utf8'))
      : null;
    const batch = writeWorkflowBatchSelection({
      eventName,
      dispatchInput: process.env.REQUESTED_BATCH_INDEX,
      request,
      outputPath: process.env.GITHUB_OUTPUT
    });
    console.log(`Offline workflow batch selector accepted: ${batch}`);
  } catch (error) {
    console.error('Offline workflow batch selector rejected:', error.message);
    process.exitCode = 1;
  }
}
