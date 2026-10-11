import path from 'path';

// 1. DOĞRULANMIŞ KPanel ORIGIN
const ALLOWED_ORIGIN = 'https://kpanel.comerent.net';

export function validateKpanelUrl(urlString) {
  // Reject protocol-relative URLs implicitly handled by URL parsing if they don't have a protocol
  // But explicitly checking if the original string starts with // just in case
  if (urlString.startsWith('//')) {
    throw new Error('Protocol-relative URLs are not allowed');
  }

  let parsed;
  try {
    parsed = new URL(urlString);
  } catch (err) {
    throw new Error('Invalid URL');
  }

  if (parsed.username || parsed.password) {
      throw new Error('URL contains embedded credentials, which is not allowed');
  }

  // Origin check
  if (parsed.origin !== ALLOWED_ORIGIN) {
    throw new Error(`Origin ${parsed.origin} is not allowed. Only ${ALLOWED_ORIGIN} is allowed.`);
  }

  return parsed;
}

// 2. DOĞRULANMIŞ READ-ONLY ROUTE ALLOWLIST
const ALLOWED_PATHNAMES = [
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

export function validateRouteAllowlist(pathname) {
  if (!ALLOWED_PATHNAMES.includes(pathname)) {
    throw new Error(`Pathname ${pathname} is not in the allowlist.`);
  }
}

// 3. HTTP METHOD GÜVENLİĞİ
const ALLOWED_METHODS = ['GET', 'HEAD'];

export function validateHttpMethod(method) {
  const upperMethod = method ? method.toUpperCase() : 'GET';
  if (!ALLOWED_METHODS.includes(upperMethod)) {
    throw new Error(`HTTP method ${upperMethod} is strictly forbidden.`);
  }
}

// 5. SECRET / AUTH DATA GÜVENLİĞİ
const SENSITIVE_KEYS = [
  'password', 'parola', 'username', 'kullanici_adi',
  'token', 'access_token', 'refresh_token',
  'session', 'sessionid', 'cookie', 'set-cookie',
  'authorization', 'api-key', 'apikey', 'x-api-key',
  'csrf', 'csrf-token', 'xsrf'
];

export function redactSecrets(data) {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Advanced string replacement for secrets in arbitrary strings
    let result = data;

    // Pattern to catch common Authorization and cookie patterns and replace their value
    // Matches: "Authorization: Bearer mysecret" or "cookie: session=123;"
    // We enforce that the secretValue isn't another keyword by looking ahead or just by iterating
    // but the easiest is just a more strict mapping, or doing it until stable.
    const authRegex = /(authorization|cookie|set-cookie|api-key|apikey|token|password|parola|session|csrf|xsrf)([=:\s]+)((?:bearer\s+|basic\s+)?)['"]?([^\s;"',!]+)/gi;

    // To prevent matching "token: authorization:", we only replace if secretValue is not in SENSITIVE_KEYS.
    // Wait, the real fix is we just replace everything that matches, but since multiple secrets could chain,
    // we should just run the replacement multiple times or do it recursively on the string.
    let previous;
    do {
      previous = result;
      result = result.replace(authRegex, (match, key, sep, typePrefix, secretValue) => {
        // If the secret value is another sensitive key (like in "token: authorization: bearer 12345secret!"),
        // the regex matches "token: authorization". We still want to redact "12345secret" eventually.
        // Actually, just making secretValue non-greedy or running it twice fixes overlapping matches.
        return `${key}${sep}${typePrefix}[REDACTED]`;
      });
    } while (result !== previous);

    // A second pass to catch the remaining "bearer [secret]" that might be orphaned by the above if they were chained
    const fallbackAuthRegex = /(?:^|\b)(Bearer|Basic)\s+([^\s;"',!]+)/gi;
    result = result.replace(fallbackAuthRegex, (match, p1, p2) => {
       if (p2 === '[REDACTED]') return match; // Already redacted
       return `${match.substring(0, match.lastIndexOf(p2))}[REDACTED]`;
    });

    // Handle just bearer / basic on their own if they are bare strings
    const exactBareAuthRegex = /^(Bearer|Basic)\s+([^\s;"',]+)$/i;
    result = result.replace(exactBareAuthRegex, (match, p1, p2) => {
       // Keep original test behavior that expects just [REDACTED] if the whole string was just Bearer token.
       // The previous implementation mapped "Bearer eyJhbGci..." to "[REDACTED]".
       return '[REDACTED]';
    });

    return result;
  }

  if (Array.isArray(data)) {
    return data.map(item => redactSecrets(item));
  }

  if (typeof data === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      const isSensitive = SENSITIVE_KEYS.some(sensitiveKey => key.toLowerCase() === sensitiveKey);
      if (isSensitive) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactSecrets(value);
      }
    }
    return result;
  }

  return data;
}

// 7. DOSYA YAZMA / PATH TRAVERSAL KORUMASI
const ALLOWED_OUTPUT_ROOTS = [
  path.resolve(process.cwd(), 'audit/evidence'),
  path.resolve(process.cwd(), 'audit/findings'),
  path.resolve(process.cwd(), 'audit/reports')
];

export function validateOutputPath(targetPath) {
  const resolvedPath = path.resolve(process.cwd(), targetPath);

  // Check if it escapes the roots or has null bytes
  if (targetPath.includes('\0')) {
    throw new Error('Path traversal detected: null byte');
  }

  let isAllowed = false;
  for (const root of ALLOWED_OUTPUT_ROOTS) {
    if (resolvedPath.startsWith(root + path.sep) || resolvedPath === root) {
      isAllowed = true;
      break;
    }
  }

  if (!isAllowed) {
    throw new Error('Path traversal detected: target path is outside allowed output roots');
  }

  return resolvedPath;
}
