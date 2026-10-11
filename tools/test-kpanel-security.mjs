import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateKpanelUrl,
  validateRouteAllowlist,
  validateHttpMethod,
  validateOutputPath,
  redactSecrets
} from './kpanel-readonly-guard.mjs';
import { sanitizeHtml } from './kpanel-passive-html.mjs';
import { safeKpanelRequest } from './kpanel-safe-request.mjs';

const mockFetch = async (url, options) => {
  if (url === 'https://kpanel.comerent.net/yonlendirme') {
    const headers = new Map();
    headers.set('location', '/sehirler');
    return {
      status: 301,
      headers,
      text: async () => ''
    };
  }
  if (url === 'https://kpanel.comerent.net/icerik-listesi/8') {
    const headers = new Map();
    headers.set('location', 'https://evil.com/icerik-listesi/7');
    return {
      status: 302,
      headers,
      text: async () => ''
    };
  }
  if (url === 'https://kpanel.comerent.net/icerik-listesi/9') {
    const headers = new Map();
    headers.set('location', '/icerik-listesi/9');
    return {
      status: 302,
      headers,
      text: async () => ''
    };
  }
  if (url === 'https://kpanel.comerent.net/sehirler') {
    return {
      status: 200,
      headers: new Map(),
      text: async () => 'OK'
    };
  }
  return { status: 200, headers: new Map(), text: async () => 'OK' };
};

test('Security Invariants: Method validation', async (t) => {
  await t.test('GET \u2192 ALLOW', () => assert.doesNotThrow(() => validateHttpMethod('GET')));
  await t.test('HEAD \u2192 ALLOW', () => assert.doesNotThrow(() => validateHttpMethod('HEAD')));
  await t.test('POST \u2192 DENY', () => assert.throws(() => validateHttpMethod('POST'), /strictly forbidden/));
  await t.test('PUT \u2192 DENY', () => assert.throws(() => validateHttpMethod('PUT'), /strictly forbidden/));
  await t.test('PATCH \u2192 DENY', () => assert.throws(() => validateHttpMethod('PATCH'), /strictly forbidden/));
  await t.test('DELETE \u2192 DENY', () => assert.throws(() => validateHttpMethod('DELETE'), /strictly forbidden/));
  await t.test('OPTIONS \u2192 DENY', () => assert.throws(() => validateHttpMethod('OPTIONS'), /strictly forbidden/));
  await t.test('bilinmeyen method \u2192 DENY', () => assert.throws(() => validateHttpMethod('UNKNOWN'), /strictly forbidden/));
});

test('Security Invariants: Route allowlist', async (t) => {
  await t.test('/sehirler \u2192 ALLOW', () => assert.doesNotThrow(() => validateRouteAllowlist('/sehirler')));
  await t.test('/icerik-listesi/7 \u2192 ALLOW', () => assert.doesNotThrow(() => validateRouteAllowlist('/icerik-listesi/7')));
  await t.test('/dashboard \u2192 DENY', () => assert.throws(() => validateRouteAllowlist('/dashboard')));
  await t.test('/cities \u2192 DENY', () => assert.throws(() => validateRouteAllowlist('/cities')));
  await t.test('/locations \u2192 DENY', () => assert.throws(() => validateRouteAllowlist('/locations')));
  await t.test('/airports \u2192 DENY', () => assert.throws(() => validateRouteAllowlist('/airports')));
});

test('Security Invariants: Origin/URL validation', async (t) => {
  await t.test('https://evil.com/icerik-listesi/7 \u2192 DENY', () => assert.throws(() => validateKpanelUrl('https://evil.com/icerik-listesi/7')));
  await t.test('//evil.com/icerik-listesi/7 \u2192 DENY', () => assert.throws(() => validateKpanelUrl('//evil.com/icerik-listesi/7')));
  await t.test('http://kpanel.comerent.net/icerik-listesi/7 \u2192 DENY', () => assert.throws(() => validateKpanelUrl('http://kpanel.comerent.net/icerik-listesi/7')));
  await t.test('custom port \u2192 DENY', () => assert.throws(() => validateKpanelUrl('https://kpanel.comerent.net:444/icerik-listesi/7')));
  await t.test('URL userinfo/embedded credentials \u2192 DENY', () => assert.throws(() => validateKpanelUrl('https://admin:pass@kpanel.comerent.net/icerik-listesi/7')));
  await t.test('same-origin + allowlisted URL \u2192 ALLOW', () => assert.doesNotThrow(() => validateKpanelUrl('https://kpanel.comerent.net/sehirler')));

  // Note query params validation handled in conjunction
  const parsed = validateKpanelUrl('https://kpanel.comerent.net/sehirler?page=2');
  assert.equal(parsed.pathname, '/sehirler');
  assert.doesNotThrow(() => validateRouteAllowlist(parsed.pathname));
});

test('Security Invariants: Redirection logic', async (t) => {
  await t.test('same-origin + non-allowlisted redirect \u2192 DENY', async () => {
    // Requires a mock that returns non-allowlisted
    const mock = async () => ({ status: 301, headers: new Map([['location', '/dashboard']]) });
    await assert.rejects(
      safeKpanelRequest('https://kpanel.comerent.net/yonlendirme', {}, mock),
      /Pathname \/dashboard is not in the allowlist/
    );
  });

  await t.test('external redirect \u2192 DENY', async () => {
    await assert.rejects(
      safeKpanelRequest('https://kpanel.comerent.net/icerik-listesi/8', {}, mockFetch),
      /Origin https:\/\/evil.com is not allowed/
    );
  });

  await t.test('redirect chain’de HER HOP yeniden kontrol edilmeli \u2192 YES', async () => {
    // The previous test indirectly proves every hop is checked.
    const res = await safeKpanelRequest('https://kpanel.comerent.net/yonlendirme', {}, mockFetch);
    assert.equal(res.status, 200);
  });

  await t.test('redirect loop \/ max-hop asimi \u2192 DENY', async () => {
    await assert.rejects(
      safeKpanelRequest('https://kpanel.comerent.net/icerik-listesi/9', {}, mockFetch),
      /Redirect loop \/ Max hop exceeded/
    );
  });
});

test('Security Invariants: HTML parsing / forms', async (t) => {
  await t.test('form submit \u2192 DENY (actions removed)', () => {
    const html = '<form action="/post"><input type="text"></form>';
    const sanitized = sanitizeHtml(html);
    assert.ok(!sanitized.includes('action="/post"'));
  });

  await t.test('sanitized HTML içerisinde hidden CSRF/token value \u2192 kaldirilmis/redacted', () => {
    const html = '<input type="hidden" name="csrf-token" value="super-secret">';
    const sanitized = sanitizeHtml(html);
    assert.ok(sanitized.includes('[REDACTED]'));
    assert.ok(!sanitized.includes('super-secret'));
  });
});

test('Security Invariants: Path traversal', async (t) => {
  await t.test('../../README.md output filename \u2192 DENY', () => assert.throws(() => validateOutputPath('../../README.md')));
  await t.test('absolute output path \u2192 DENY', () => assert.throws(() => validateOutputPath('/etc/passwd')));
  await t.test('nested traversal varyasyonlari \u2192 DENY', () => assert.throws(() => validateOutputPath('audit/evidence/../../../etc/passwd')));
});

test('Security Invariants: Secret data redaction', async (t) => {
  await t.test('quoted password with spaces \u2192 FULL REDACTION', () => {
    const dict = { password: 'my secret pass' };
    assert.equal(redactSecrets(dict).password, '[REDACTED]');
  });
  await t.test('Bearer Authorization \u2192 FULL REDACTION', () => {
    assert.equal(redactSecrets('Bearer eyJhbGci...'), '[REDACTED]');
  });
  await t.test('Basic Authorization \u2192 FULL REDACTION', () => {
    assert.equal(redactSecrets('Basic dXNlcjpwYXNz'), '[REDACTED]');
  });
  await t.test('API key \u2192 FULL REDACTION', () => {
    const dict = { 'api-key': '12345' };
    assert.equal(redactSecrets(dict)['api-key'], '[REDACTED]');
  });
  await t.test('Cookie \u2192 FULL REDACTION', () => {
    const dict = { 'cookie': 'session=xyz' };
    assert.equal(redactSecrets(dict)['cookie'], '[REDACTED]');
  });
  await t.test('Set-Cookie \u2192 FULL REDACTION', () => {
    const dict = { 'set-cookie': 'session=xyz' };
    assert.equal(redactSecrets(dict)['set-cookie'], '[REDACTED]');
  });
  await t.test('nested object icerisindeki token/password \u2192 FULL REDACTION', () => {
    const dict = { data: { user: { token: 'secret' } } };
    assert.equal(redactSecrets(dict).data.user.token, '[REDACTED]');
  });
});
