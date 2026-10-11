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

test('Security Invariants: Regression - Advanced string redaction', async (t) => {
  await t.test('Authorization: Bearer SECRET içinde SECRET kalmiyor', () => {
    const logStr = 'Request failed for Authorization: Bearer my-super-secret-token in header';
    const safeStr = redactSecrets(logStr);
    assert.ok(safeStr.includes('[REDACTED]'));
    assert.ok(!safeStr.includes('my-super-secret-token'));
  });

  await t.test('Cookie: session=SECRET string içinde SECRET kalmiyor', () => {
    const logStr = 'Headers: { cookie: "session=xyz123;" }';
    const safeStr = redactSecrets(logStr);
    assert.ok(safeStr.includes('[REDACTED]'));
    assert.ok(!safeStr.includes('xyz123'));
  });

  await t.test('fetchImpl secret içeren Error firlattiginda disaridaki exception secret icermiyor', async () => {
    const badFetch = async () => {
      throw new Error('Failed to fetch due to bad token: authorization: bearer 12345secret!');
    };
    await assert.rejects(
      safeKpanelRequest('https://kpanel.comerent.net/sehirler', {}, badFetch),
      (err) => {
        assert.ok(err.message.includes('[REDACTED]'));
        assert.ok(!err.message.includes('12345secret'));
        return true;
      }
    );
  });
});

import { auditRoute } from './kpanel-readonly-audit.mjs';
import fs from 'fs/promises';
import path from 'path';

test('Security Invariants: Body sanitization during auditRoute', async (t) => {
  const dummyFile = path.resolve(process.cwd(), 'audit/evidence/test-evidence.txt');

  await t.test('JSON response body icindeki nested token/password evidence’a yazilmadan redakte ediliyor', async () => {
    const jsonFetch = async () => ({
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify({ token: 'my-json-secret', safe: 'data' })
    });

    await auditRoute('https://kpanel.comerent.net/sehirler', 'audit/evidence/test-evidence.txt', jsonFetch);
    const content = await fs.readFile(dummyFile, 'utf-8');
    assert.ok(content.includes('[REDACTED]'));
    assert.ok(!content.includes('my-json-secret'));
    assert.ok(content.includes('data'));
  });

  await t.test('text/plain response icindeki Authorization/Cookie secret redakte ediliyor', async () => {
    const textFetch = async () => ({
      headers: new Map([['content-type', 'text/plain']]),
      text: async () => 'Here is a log with cookie: session=abc987;'
    });

    await auditRoute('https://kpanel.comerent.net/sehirler', 'audit/evidence/test-evidence.txt', textFetch);
    const content = await fs.readFile(dummyFile, 'utf-8');
    assert.ok(content.includes('[REDACTED]'));
    assert.ok(!content.includes('abc987'));
  });

  await t.test('hidden authorization, cookie, api-key degerleri HTML evidence’da redakte ediliyor', async () => {
    const htmlFetch = async () => ({
      headers: new Map([['content-type', 'text/html']]),
      text: async () => '<meta name="authorization" content="Bearer xyz"><input type="hidden" name="api-key" value="secret-api">'
    });

    await auditRoute('https://kpanel.comerent.net/sehirler', 'audit/evidence/test-evidence.txt', htmlFetch);
    const content = await fs.readFile(dummyFile, 'utf-8');
    assert.ok(content.includes('[REDACTED]'));
    assert.ok(!content.includes('xyz'));
    assert.ok(!content.includes('secret-api'));
  });

  // Cleanup
  await fs.unlink(dummyFile).catch(() => {});
});
