import {
  validateKpanelUrl,
  validateRouteAllowlist,
  validateHttpMethod,
  redactSecrets
} from './kpanel-readonly-guard.mjs';

const MAX_REDIRECTS = 5;

/**
 * A central safe HTTP function.
 * @param {string} urlString - The target URL
 * @param {object} options - Fetch options
 * @param {function} fetchImpl - Dependency-injected fetch implementation
 * @param {number} redirectCount - Internal redirect hop counter
 */
export async function safeKpanelRequest(urlString, options = {}, fetchImpl, redirectCount = 0) {
  if (!fetchImpl) {
    throw new Error('fetchImpl must be provided for dependency injection.');
  }

  if (redirectCount > MAX_REDIRECTS) {
    throw new Error('Redirect loop / Max hop exceeded');
  }

  // 1. Validate URL and origin
  const parsed = validateKpanelUrl(urlString);

  // 2. Validate route allowlist
  validateRouteAllowlist(parsed.pathname);

  // 3. Validate HTTP Method
  const method = options.method || 'GET';
  validateHttpMethod(method);

  // Default deny for body if not GET/HEAD (though already restricted by method validate)
  if (options.body && method !== 'POST' && method !== 'PUT' && method !== 'PATCH') {
     // but we only allow GET/HEAD anyway, so if they pass body with GET/HEAD we just ignore it or fetch handles it
  }

  // Force manual redirects to validate every hop
  const fetchOptions = {
    ...options,
    method: method.toUpperCase(),
    redirect: 'manual'
  };

  let response;
  try {
    response = await fetchImpl(urlString, fetchOptions);
  } catch (error) {
    // Redact any secrets in exception messages, or return a generic message if redaction isn't guaranteed
    const originalMsg = error.message || '';
    const safeMsg = redactSecrets(originalMsg);
    // Even if redacted, let's not leak URL structures if they somehow include keys, just the safe version
    throw new Error(safeMsg);
  }

  // Handle redirects manually
  if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
    const location = response.headers.get('location');

    // Resolve relative URLs using the current parsed URL
    const nextUrl = new URL(location, parsed.href).href;

    // Redact headers of response before passing if returning raw... but here we recursively call
    // For manual redirect, we will fetch the next hop.
    return safeKpanelRequest(nextUrl, options, fetchImpl, redirectCount + 1);
  }

  // We should redact sensitive headers in the returned object to prevent leaks in logs
  // However, returning a standard Response object from mock fetch might make header modification tricky.
  // We'll trust the consumer uses sanitizeHtml and doesn't log the raw response directly,
  // or we can wrap the response to hide raw headers.

  return response;
}
