import dns from 'node:dns/promises';
import https from 'node:https';
import { isIP } from 'node:net';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { redactSecrets } from './kpanel-readonly-guard.mjs';

const START_URL = 'https://comerent.net/';
const SITEMAP_URL = 'https://comerent.net/sitemap.xml';
export const ALLOWED_HOSTS = new Set(['comerent.net', 'www.comerent.net']);
export const MAX_REDIRECTS = 5;
export const MAX_PAGES = 120;
export const MAX_SITEMAP_DEPTH = 3;
export const MAX_SITEMAP_FILES = 20;
export const MAX_SITEMAP_URLS = 5000;
export const MAX_INTERNAL_LINKS_PER_PAGE = 200;
export const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
export const REQUEST_TIMEOUT_MS = 8000;
export const REQUEST_DELAY_MS = 1000;
const USER_AGENT = 'ComeRentAuditBot';

function getHeader(headers, name) {
  return typeof headers?.get === 'function'
    ? headers.get(name)
    : headers?.[name.toLowerCase()] ?? headers?.[name] ?? null;
}

function ipv4Number(address) {
  return address.split('.').reduce((value, part) => (value << 8) | Number(part), 0) >>> 0;
}

function inIpv4Range(address, network, prefix) {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipv4Number(address) & mask) === (ipv4Number(network) & mask);
}

export function isPublicIp(address) {
  const family = isIP(address);
  if (family === 4) {
    const blocked = [
      ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10],
      ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
      ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.88.99.0', 24],
      ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
      ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4]
    ];
    return !blocked.some(([network, prefix]) => inIpv4Range(address, network, prefix));
  }
  if (family === 6) {
    const first = Number.parseInt(address.split(':')[0] || '0', 16);
    return first >= 0x2000 && first <= 0x3fff && !/^2001:db8:/i.test(address);
  }
  return false;
}

export function validateCrawlerUrl(rawUrl, baseUrl = START_URL) {
  let parsed;
  try {
    parsed = new URL(rawUrl, baseUrl);
  } catch {
    throw new Error('Invalid crawler URL');
  }

  if (
    parsed.protocol !== 'https:' ||
    !ALLOWED_HOSTS.has(parsed.hostname.toLowerCase()) ||
    parsed.port ||
    parsed.username ||
    parsed.password ||
    (isIP(parsed.hostname) && !isPublicIp(parsed.hostname))
  ) {
    throw new Error('Crawler URL violates the HTTPS same-site policy');
  }

  parsed.hash = '';
  return parsed;
}

export function validateCrawlerRedirect(location, currentUrl, options = {}) {
  if (typeof location !== 'string' || !location.trim()) {
    throw new Error('Invalid redirect target');
  }
  let target;
  try {
    target = new URL(location, currentUrl);
  } catch {
    throw new Error('Invalid redirect URL');
  }
  if (!ALLOWED_HOSTS.has(target.hostname.toLowerCase())) {
    throw new Error('External redirect blocked');
  }
  if (target.protocol !== 'https:') {
    throw new Error('HTTPS downgrade blocked');
  }
  const validated = validateCrawlerUrl(target.href, currentUrl);
  const policyReason = crawlerUrlPolicyReason(validated.href, options);
  if (policyReason) throw new Error(`Redirect URL blocked by policy: ${policyReason}`);
  return validated.href;
}

async function resolvePublicAddresses(hostname) {
  const resolution = isIP(hostname)
    ? Promise.resolve([{ address: hostname, family: isIP(hostname) }])
    : dns.lookup(hostname, { all: true, verbatim: true });
  let timer;
  const addresses = await Promise.race([
    resolution,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('DNS resolution timed out')), REQUEST_TIMEOUT_MS);
    })
  ]).finally(() => clearTimeout(timer));
  if (!addresses.length || addresses.some(({ address }) => !isPublicIp(address))) {
    throw new Error('Private or non-public address blocked');
  }
  return addresses;
}

async function pinnedHttpsGet(urlString, options = {}) {
  const url = validateCrawlerUrl(urlString);
  const addresses = await resolvePublicAddresses(url.hostname);
  const timeoutMs = Math.min(options.timeoutMs ?? REQUEST_TIMEOUT_MS, REQUEST_TIMEOUT_MS);

  return new Promise((resolve, reject) => {
    const request = https.request(url, {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT, ...options.headers },
      timeout: timeoutMs,
      lookup(_hostname, lookupOptions, callback) {
        if (lookupOptions?.all) callback(null, addresses);
        else callback(null, addresses[0].address, addresses[0].family);
      }
    }, response => {
      const declaredLength = Number(getHeader(response.headers, 'content-length'));
      if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
        request.destroy(new Error('Response size limit exceeded'));
        return;
      }

      const chunks = [];
      let size = 0;
      response.on('data', chunk => {
        size += chunk.length;
        if (size > MAX_RESPONSE_BYTES) {
          request.destroy(new Error('Response size limit exceeded'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        const headers = new Map(
          Object.entries(response.headers).map(([name, value]) => [
            name.toLowerCase(),
            Array.isArray(value) ? value.join(', ') : String(value ?? '')
          ])
        );
        resolve({
          status: response.statusCode,
          ok: response.statusCode >= 200 && response.statusCode < 300,
          headers,
          text: async () => body
        });
      });
    });

    request.on('timeout', () => request.destroy(new Error('Request timed out')));
    request.on('error', reject);
    request.end();
  });
}

function normalizeUrl(rawUrl, baseUrl) {
  if (!rawUrl || typeof rawUrl !== 'string' || /^(?:javascript|mailto|tel|data):/i.test(rawUrl.trim())) {
    return null;
  }
  try {
    return validateCrawlerUrl(rawUrl.trim(), baseUrl).href;
  } catch {
    return null;
  }
}

function safeUrl(rawUrl, baseUrl) {
  try {
    const url = new URL(rawUrl, baseUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return '[UNSAFE_URL]';
    url.username = '';
    url.password = '';
    url.hash = '';
    const keys = [...url.searchParams.keys()];
    url.search = '';
    for (const key of keys) url.searchParams.append(key, '[REDACTED]');
    return url.href;
  } catch {
    return '[INVALID_URL]';
  }
}

function normalizedToken(value) {
  return decodeURIComponent(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('ı', 'i')
    .toLowerCase();
}

const ACTION_PATH_SEGMENT = /(?:^|\/)(?:book(?:ing)?|reserv(?:ation|e)|rezervasyon|cart|sepet|checkout|payment|pay|odeme|account|hesap|uye(?:[-_]?(?:giris|login))?|member[-_]?(?:login|signin)|login|logout|signin|signout|giris|cikis|action|actions|submit|cancel|iptal|delete|sil|remove|purchase|buy|order|siparis|register|signup|acente(?:[-_][a-z0-9-]+)?|bayilik[-_]basvurusu|basvuru(?:su)?|b2b(?:[-_][a-z0-9-]+)?|profil(?:im)?|uye(?:lik)?|musteri(?:[-_][a-z0-9-]+)?|giris[-_]yap|sifre|parola|password|forgot[-_]password|oturum|save|kaydet|update|edit|duzenle|create|ekle|islem|eylem)(?:\/|$)/i;
const ACTION_QUERY_NAME = /^(?:action|actions|act|method|do|operation|op|command|task|submit|intent|islem|eylem|delete|sil|remove|cancel|iptal|save|kaydet|update|edit|duzenle|create|ekle|booking|reservation|rezervasyon|checkout|payment|odeme|siparis|order|register|signup|login|logout)$/i;
const ACTION_QUERY_VALUE = /^(?:book(?:ing)?|reserv(?:ation|e)|rezervasyon|checkout|payment|odeme|delete|sil|remove|cancel|iptal|save|kaydet|update|edit|duzenle|create|ekle|submit|purchase|buy|order|siparis|register|signup|login|logout)$/i;

export function isSensitivePath(pathname) {
  try {
    return ACTION_PATH_SEGMENT.test(normalizedToken(pathname));
  } catch {
    return true;
  }
}

export function crawlerUrlPolicyReason(rawUrl, { includeQueryUrls = false } = {}) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return 'INVALID_URL';
  }
  if (isSensitivePath(url.pathname)) return 'ACTION_PATH_BLOCKED';
  for (const [name, value] of url.searchParams) {
    let normalizedName;
    let normalizedValue;
    try {
      normalizedName = normalizedToken(name);
      normalizedValue = normalizedToken(value.trim());
    } catch {
      return 'INVALID_QUERY_URL_BLOCKED';
    }
    if (ACTION_QUERY_NAME.test(normalizedName) || ACTION_QUERY_VALUE.test(normalizedValue)) {
      return 'ACTION_QUERY_BLOCKED';
    }
  }
  if (!includeQueryUrls && url.search) return 'QUERY_URL_SCOPE_EXCLUDED';
  return null;
}

function effectiveUrlKey(rawUrl) {
  const url = new URL(rawUrl);
  url.hostname = url.hostname.replace(/^www\./i, '');
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
  url.hash = '';
  url.searchParams.sort();
  return url.href;
}

function createThrottle(delayMs) {
  let lastRequestAt = 0;
  return async () => {
    const remaining = delayMs - (Date.now() - lastRequestAt);
    if (lastRequestAt && remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }
    lastRequestAt = Date.now();
  };
}

export async function fetchUrlWithManualRedirects(
  initialUrl,
  fetchImpl = pinnedHttpsGet,
  options = {},
  redirectCount = 0,
  chain = []
) {
  if (typeof options === 'number') {
    redirectCount = options;
    options = {};
  }
  const parsed = validateCrawlerUrl(initialUrl);
  if (redirectCount > MAX_REDIRECTS) throw new Error('Max redirect hops exceeded');
  if (chain.includes(parsed.href)) throw new Error('Redirect cycle blocked');
  const policyReason = crawlerUrlPolicyReason(parsed.href, options);
  if (policyReason) throw new Error(`URL blocked by policy: ${policyReason}`);
  if (options.robotsRules && !isAllowedByRobots(parsed.href, options.robotsRules)) {
    throw new Error('URL blocked by robots.txt policy');
  }
  await options.beforeRequest?.();

  const response = await fetchImpl(parsed.href, {
    method: 'GET',
    redirect: 'manual',
    headers: { 'User-Agent': USER_AGENT },
    timeoutMs: REQUEST_TIMEOUT_MS
  });
  const nextChain = [...chain, parsed.href];
  const location = getHeader(response.headers, 'location');
  if (response.status >= 300 && response.status < 400) {
    if (!location) throw new Error('Redirect without a location');
    const nextUrl = validateCrawlerRedirect(location, parsed.href, options);
    return fetchUrlWithManualRedirects(nextUrl, fetchImpl, options, redirectCount + 1, nextChain);
  }

  return { response, redirectChain: nextChain };
}

async function responseText(response) {
  const length = Number(getHeader(response.headers, 'content-length'));
  if (Number.isFinite(length) && length > MAX_RESPONSE_BYTES) {
    throw new Error('Response size limit exceeded');
  }
  const text = await response.text();
  if (Buffer.byteLength(text, 'utf8') > MAX_RESPONSE_BYTES) {
    throw new Error('Response size limit exceeded');
  }
  return text;
}

export function parseRobotsRules(text) {
  const groups = [];
  const sitemaps = [];
  let group = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split('#', 1)[0].trim();
    if (!line) continue;
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const name = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (name === 'sitemap') {
      sitemaps.push(value);
    } else if (name === 'user-agent') {
      if (!group || group.hasRules) {
        group = { agents: [], rules: [], hasRules: false };
        groups.push(group);
      }
      group.agents.push(value.toLowerCase());
    } else if ((name === 'allow' || name === 'disallow') && group && value) {
      group.rules.push({ allow: name === 'allow', path: value });
      group.hasRules = true;
    }
  }

  const matching = groups.filter(item => item.agents.includes(USER_AGENT.toLowerCase()));
  const selected = matching.length ? matching : groups.filter(item => item.agents.includes('*'));
  return { rules: selected.flatMap(item => item.rules), sitemaps };
}

export function isAllowedByRobots(url, rules) {
  const parsed = new URL(url);
  const pathname = parsed.pathname + parsed.search;
  const matches = rules
    .filter(({ path }) => {
      const escaped = path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*').replace(/\\\$$/, '$');
      return new RegExp(`^${escaped}`).test(pathname);
    })
    .sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow));
  return matches.length === 0 || matches[0].allow;
}

async function fetchSitemapUrls(sitemapUrl, context, depth = 0) {
  const urls = new Set();
  const normalized = validateCrawlerUrl(sitemapUrl).href;
  if (context.sitemapVisited.has(normalized)) return urls;
  if (depth > context.maxSitemapDepth || context.sitemapVisited.size >= MAX_SITEMAP_FILES) {
    context.sitemapComplete = false;
    return urls;
  }
  context.sitemapVisited.add(normalized);
  if (!isAllowedByRobots(normalized, context.robotsRules)) {
    context.blockedSitemaps.push({ url: safeUrl(normalized), reason: 'ROBOTS_DISALLOW' });
    context.sitemapComplete = false;
    return urls;
  }

  try {
    const { response } = await fetchUrlWithManualRedirects(
      normalized, context.fetchImpl, {
        beforeRequest: context.beforeRequest,
        robotsRules: context.robotsRules,
        includeQueryUrls: context.includeQueryUrls
      }
    );
    if (!response.ok) {
      context.blockedSitemaps.push({ url: safeUrl(normalized), reason: `HTTP_${response.status}` });
      context.sitemapComplete = false;
      return urls;
    }
    const xml = await responseText(response);
    context.sitemapFetched.add(normalized);
    const $ = cheerio.load(xml, { xmlMode: true });
    const nested = [];
    $('sitemap > loc').each((_, element) => {
      const rawLocation = $(element).text().trim();
      const location = normalizeUrl(rawLocation, normalized);
      if (location) nested.push(location);
      else {
        context.blockedSitemaps.push({ reason: 'INVALID_OR_EXTERNAL_SUBSITEMAP' });
        context.sitemapComplete = false;
      }
    });
    for (const child of nested) {
      const childUrls = await fetchSitemapUrls(child, context, depth + 1);
      for (const url of childUrls) urls.add(url);
    }

    $('url > loc').each((_, element) => {
      const location = normalizeUrl($(element).text().trim(), normalized);
      if (location) {
        if (!context.sitemapUrlSet.has(location)) {
          if (context.sitemapUrlCount >= MAX_SITEMAP_URLS) {
            context.sitemapComplete = false;
            return false;
          }
          context.sitemapUrlSet.add(location);
          context.sitemapUrlCount += 1;
        }
        const policyReason = crawlerUrlPolicyReason(location, context);
        if (!policyReason) urls.add(location);
        else context.skippedUrls.set(location, policyReason);
      } else {
        context.blockedSitemaps.push({ reason: 'INVALID_OR_EXTERNAL_PAGE_URL' });
        context.sitemapComplete = false;
      }
    });
  } catch (error) {
    context.blockedSitemaps.push({
      url: safeUrl(normalized),
      reason: /policy|blocked|redirect|size limit/i.test(error.message) ? 'BLOCKED_BY_POLICY' : 'FETCH_FAILED'
    });
    context.sitemapComplete = false;
  }
  return urls;
}

function classifyPageType(urlPath) {
  const path = urlPath.toLowerCase();
  if (path === '/' || path === '') return 'HOME';
  if (path.includes('havalimani') || path.includes('airport')) return 'AIRPORT';
  if (path.includes('oto-kiralama') || path.includes('arac-kiralama') || path.includes('lokasyon') || path.includes('ofis')) return 'CITY_LOCATION';
  if (path.includes('araclar') || path.includes('filo') || path.includes('kategori')) return 'VEHICLE_CATEGORY';
  if (path.includes('blog') || path.includes('duyuru') || path.includes('haber') || path.includes('icerik')) return 'CONTENT_BLOG';
  if (path.includes('iletisim') || path.includes('hakkimizda') || path.includes('sozlesme') || path.includes('cerez')) return 'INFO_LEGAL';
  return 'OTHER';
}

function schemaTypesIn(value, types = new Set()) {
  if (Array.isArray(value)) value.forEach(item => schemaTypesIn(item, types));
  else if (value && typeof value === 'object') {
    const values = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
    values.filter(type => typeof type === 'string').forEach(type => types.add(type));
    Object.values(value).forEach(item => schemaTypesIn(item, types));
  }
  return [...types];
}

function localeIsValid(locale) {
  if (locale?.toLowerCase() === 'x-default') return true;
  try {
    return Intl.getCanonicalLocales(locale).length === 1;
  } catch {
    return false;
  }
}

function extractPageDocument(html, finalUrl, xRobotsTag, status, includeQueryUrls = false) {
  if (status !== 200) return null;
  const $ = cheerio.load(html);
  const title = $('title').first().text().trim() || null;
  const metaDescription = $('meta[name="description"]').first().attr('content')?.trim() || null;
  const metaRobots = $('meta[name="robots"]').first().attr('content')?.trim() || null;
  const canonicalTags = $('link[rel~="canonical"]');
  const canonicalRaw = canonicalTags.first().attr('href')?.trim() || null;
  const canonicalResolved = canonicalRaw ? normalizeUrl(canonicalRaw, finalUrl) : null;
  const canonicalStatus = canonicalTags.length === 0
    ? 'MISSING'
    : canonicalTags.length > 1
      ? 'MULTIPLE'
      : !canonicalResolved
        ? 'UNKNOWN_TARGET'
        : effectiveUrlKey(canonicalResolved) === effectiveUrlKey(finalUrl)
          ? 'MATCH'
          : 'MISMATCH';

  const hreflang = [];
  $('link[rel~="alternate"][hreflang]').each((_, element) => {
    const lang = $(element).attr('hreflang')?.trim() || null;
    const href = $(element).attr('href')?.trim() || null;
    const resolved = href ? normalizeUrl(href, finalUrl) : null;
    hreflang.push({
      lang,
      langValid: localeIsValid(lang),
      href: href ? safeUrl(href, finalUrl) : null,
      sameSiteHttps: Boolean(resolved),
      effectiveTarget: resolved ? safeUrl(resolved) : null
    });
  });

  const schemas = [];
  let jsonLdParseErrorCount = 0;
  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).html();
    if (!raw) return;
    try {
      schemas.push(JSON.parse(raw));
    } catch {
      jsonLdParseErrorCount += 1;
    }
  });
  const h1 = [];
  $('h1').each((_, element) => h1.push($(element).text().trim()));
  const h2 = [];
  $('h2').each((_, element) => h2.push($(element).text().trim()));
  const links = [];
  const skippedLinks = [];
  $('a[href]').each((_, element) => {
    if (links.length >= MAX_INTERNAL_LINKS_PER_PAGE) return false;
    const normalized = normalizeUrl($(element).attr('href'), finalUrl);
    if (!normalized) return;
    const policyReason = crawlerUrlPolicyReason(normalized, { includeQueryUrls });
    if (policyReason) {
      skippedLinks.push({ url: normalized, reason: policyReason });
    } else if (!links.includes(normalized)) {
      links.push(normalized);
    }
  });
  $('script, style, noscript').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText ? bodyText.split(/\s+/).length : 0;
  const robotsText = `${metaRobots ?? ''} ${xRobotsTag ?? ''}`.toLowerCase();
  const noIndexHint = /(?:^|[\s,])noindex(?:$|[\s,])/i.test(robotsText);
  const types = schemaTypesIn(schemas);

  return {
    title,
    metaDescription,
    canonical: {
      count: canonicalTags.length,
      target: canonicalRaw ? safeUrl(canonicalRaw, finalUrl) : null,
      status: canonicalStatus
    },
    metaRobots,
    xRobotsTag,
    indexability: {
      classification: 'BASIC_INDEXABILITY_HINT',
      status: noIndexHint ? 'NOINDEX_HINT' : 'ELIGIBILITY_HINT',
      actualSearchIndexation: 'UNKNOWN_NO_SEARCH_CONSOLE_EVIDENCE'
    },
    h1,
    h2,
    hreflang,
    schemaTypes: types,
    jsonLdParseErrorCount,
    schemaOpportunities: {
      faqContentSignal: h2.some(heading => /soru|nasıl|neden|ücret|fiyat/i.test(heading)),
      faqSchemaRequirement: 'UNKNOWN_NOT_VERIFIED'
    },
    pageType: classifyPageType(new URL(finalUrl).pathname),
    wordCount,
    thinContentCandidate: wordCount < 200,
    links,
    skippedLinks,
    internalLinksFound: links.length
  };
}

function addSource(sources, url, source) {
  if (!sources.has(url)) sources.set(url, new Set());
  sources.get(url).add(source);
}

function aggregateEffectivePages(pageRequests) {
  const pages = new Map();
  for (const page of pageRequests) {
    const key = effectiveUrlKey(page.finalUrl);
    if (!pages.has(key)) {
      pages.set(key, { ...page, requestedUrls: [page.requestedUrl], evidenceSources: [...page.evidenceSources] });
      continue;
    }
    const existing = pages.get(key);
    if (!existing.requestedUrls.includes(page.requestedUrl)) existing.requestedUrls.push(page.requestedUrl);
    for (const source of page.evidenceSources) {
      if (!existing.evidenceSources.includes(source)) existing.evidenceSources.push(source);
    }
    if (!existing.document && page.document) {
      existing.document = page.document;
      existing.statusCode = page.statusCode;
    }
  }
  return [...pages.values()];
}

function findDuplicateValues(pages, field) {
  const values = new Map();
  for (const page of pages) {
    const value = page.document?.[field];
    if (!value) continue;
    if (!values.has(value)) values.set(value, []);
    values.get(value).push(safeUrl(page.finalUrl));
  }
  return [...values.entries()]
    .filter(([, urls]) => urls.length > 1)
    .map(([value, urls]) => ({ value, urls }));
}

export async function runPublicSeoCrawler({
  fetchImpl = pinnedHttpsGet,
  maxPages = MAX_PAGES,
  maxSitemapDepth = MAX_SITEMAP_DEPTH,
  includeQueryUrls = false,
  delayMs = REQUEST_DELAY_MS,
  generatedAt = new Date().toISOString()
} = {}) {
  const context = {
    fetchImpl,
    includeQueryUrls,
    maxSitemapDepth: Math.min(maxSitemapDepth, MAX_SITEMAP_DEPTH),
    requestCount: 0,
    sitemapVisited: new Set(),
    sitemapFetched: new Set(),
    sitemapUrlSet: new Set(),
    sitemapUrlCount: 0,
    sitemapComplete: true,
    blockedSitemaps: [],
    skippedUrls: new Map(),
    robotsRules: [],
    robotsSitemaps: []
  };
  const throttle = createThrottle(fetchImpl === pinnedHttpsGet
    ? Math.max(REQUEST_DELAY_MS, delayMs)
    : Math.max(0, delayMs));
  context.beforeRequest = async () => {
    await throttle();
    context.requestCount += 1;
  };
  const robotsUrl = new URL('/robots.txt', START_URL).href;
  let robots = { status: 'FETCH_FAILED', sourceUrl: safeUrl(robotsUrl), sitemaps: [] };

  try {
    const { response, redirectChain } = await fetchUrlWithManualRedirects(
      robotsUrl, fetchImpl, { beforeRequest: context.beforeRequest }
    );
    if (response.status === 404 || response.status === 410) {
      robots = { status: 'NO_FILE', sourceUrl: safeUrl(robotsUrl), sitemaps: [] };
    } else if (!response.ok) {
      robots = { status: 'BLOCKED_BY_POLICY', sourceUrl: safeUrl(robotsUrl), sitemaps: [] };
    } else {
      const parsed = parseRobotsRules(await responseText(response));
      context.robotsRules = parsed.rules;
      context.robotsSitemaps = parsed.sitemaps;
      robots = { status: 'READ', sourceUrl: safeUrl(robotsUrl), sitemaps: parsed.sitemaps.map(url => safeUrl(url)) };
    }
  } catch {
    robots.status = 'BLOCKED_BY_POLICY';
  }

  if (robots.status === 'BLOCKED_BY_POLICY') {
    return redactSecrets({
      generatedAt,
      sourceRunId: `public-crawl-${generatedAt}`,
      mode: 'PUBLIC_READ_ONLY',
      startUrl: safeUrl(START_URL),
      robots,
      pages: [],
      observations: [],
      coverage: {
        status: 'BLOCKED_BY_POLICY',
        pageLimit: Math.min(maxPages, MAX_PAGES),
        pageRequestCount: 0,
        uniqueEffectivePageCount: 0,
        sitemapUrlCount: null,
        remainingQueueCount: null,
        requestCount: context.requestCount,
        orphanAssessment: 'UNKNOWN'
      }
    });
  }

  const sitemapUrls = new Set();
  for (const candidate of [SITEMAP_URL, ...context.robotsSitemaps]) {
    const sitemapUrl = normalizeUrl(candidate, START_URL);
    if (!sitemapUrl) {
      context.blockedSitemaps.push({ reason: 'INVALID_OR_EXTERNAL_SITEMAP' });
      context.sitemapComplete = false;
      continue;
    }
    const found = await fetchSitemapUrls(sitemapUrl, context);
    for (const url of found) sitemapUrls.add(url);
  }

  const sourceMap = new Map();
  const queue = [];
  const queueLimit = Math.min(maxPages, MAX_PAGES) * 2;
  const enqueue = (url, source) => {
    const policyReason = crawlerUrlPolicyReason(url, context);
    if (policyReason) {
      context.skippedUrls.set(url, policyReason);
      return;
    }
    addSource(sourceMap, url, source);
    if (!queue.includes(url) && queue.length < queueLimit) queue.push(url);
  };
  enqueue(START_URL, 'START_URL');
  for (const url of sitemapUrls) enqueue(url, 'SITEMAP');

  const visited = new Set();
  const pageRequests = [];
  let pageFetchCount = 0;
  const allInternalLinks = new Set();
  const links = [];
  const pageLimit = Math.max(0, Math.min(Number(maxPages) || 0, MAX_PAGES));
  while (queue.length && visited.size < pageLimit) {
    const requestedUrl = queue.shift();
    if (visited.has(requestedUrl)) continue;
    visited.add(requestedUrl);

    if (crawlerUrlPolicyReason(requestedUrl, context) || !isAllowedByRobots(requestedUrl, context.robotsRules)) {
      pageRequests.push({
        requestedUrl,
        finalUrl: requestedUrl,
        statusCode: null,
        evidenceSources: [...(sourceMap.get(requestedUrl) ?? [])],
        result: 'BLOCKED_BY_POLICY',
        document: null
      });
      continue;
    }

    try {
      pageFetchCount += 1;
      const { response, redirectChain } = await fetchUrlWithManualRedirects(
        requestedUrl, fetchImpl, {
          beforeRequest: context.beforeRequest,
          robotsRules: context.robotsRules,
          includeQueryUrls
        }
      );
      const finalUrl = redirectChain.at(-1);
      const statusCode = response.status;
      const contentType = getHeader(response.headers, 'content-type') ?? '';
      let document = null;

      if (statusCode === 200 && /text\/html/i.test(contentType)) {
        const html = await responseText(response);
        document = extractPageDocument(
          html, finalUrl, getHeader(response.headers, 'x-robots-tag'), statusCode, includeQueryUrls
        );
        for (const skipped of document.skippedLinks) {
          context.skippedUrls.set(skipped.url, skipped.reason);
        }
        for (const target of document.links) {
          allInternalLinks.add(effectiveUrlKey(target));
          links.push({ source: safeUrl(finalUrl), target: safeUrl(target), evidenceClass: 'VERIFIED_LINK_OBSERVED' });
          enqueue(target, 'INTERNAL_LINK');
        }
      }

      pageRequests.push({
        requestedUrl,
        finalUrl,
        effectiveUrl: effectiveUrlKey(finalUrl),
        redirectChain,
        statusCode,
        contentType: String(contentType).split(';', 1)[0],
        observedAt: new Date().toISOString(),
        evidenceSources: [...(sourceMap.get(requestedUrl) ?? [])],
        result: statusCode === 404 ? 'HTTP_404' : response.ok ? 'FETCHED' : `HTTP_${statusCode}`,
        document
      });
    } catch (error) {
      pageRequests.push({
        requestedUrl,
        finalUrl: requestedUrl,
        statusCode: null,
        evidenceSources: [...(sourceMap.get(requestedUrl) ?? [])],
        result: /policy|blocked|redirect|private|non-public|size limit/i.test(error.message)
          ? 'BLOCKED_BY_POLICY'
          : 'FETCH_FAILED',
        document: null
      });
    }
  }

  const effectivePages = aggregateEffectivePages(pageRequests);
  const titleDuplicates = findDuplicateValues(effectivePages, 'title');
  const descriptionDuplicates = findDuplicateValues(effectivePages, 'metaDescription');
  const internalLinkKeys = allInternalLinks;
  const orphanCandidates = [...sitemapUrls]
    .filter(url => !internalLinkKeys.has(effectiveUrlKey(url)))
    .map(url => ({
      url: safeUrl(url),
      classification: 'CANDIDATE_PARTIAL_COVERAGE',
      confidence: 'LOW',
      evidenceClass: 'INFERRED',
      sources: ['SITEMAP', 'OBSERVED_INTERNAL_LINK_GRAPH'],
      confirmedOrphan: false
    }));
  const notQueued = [...sitemapUrls].filter(url => !visited.has(url)).length;
  const reachedPageLimit = visited.size >= pageLimit && (queue.length > 0 || notQueued > 0);
  const failedRequests = pageRequests.filter(page =>
    page.result === 'FETCH_FAILED' ||
    page.result === 'BLOCKED_BY_POLICY' ||
    page.statusCode === 401 ||
    page.statusCode === 403 ||
    page.statusCode === 429 ||
    page.statusCode >= 500
  ).length;
  const observations = [];

  for (const page of effectivePages) {
    if (!page.document) continue;
    const canonicalStatus = page.document.canonical.status;
    if (['MISSING', 'MULTIPLE', 'MISMATCH'].includes(canonicalStatus)) {
      observations.push({
        type: `CANONICAL_${canonicalStatus}`,
        priority: 'P2',
        classification: 'OBSERVATION',
        evidenceClass: 'VERIFIED',
        confidence: 'HIGH',
        url: safeUrl(page.finalUrl),
        proof: `HTTP 200 HTML contains ${canonicalStatus.toLowerCase()} canonical evidence`,
        source: 'PUBLIC_HTML',
        observedAt: page.observedAt ?? generatedAt,
        customerImpactHypothesis: 'URL consolidation may be affected; search or booking impact is unmeasured.',
        recommendedOwnerAction: 'Review the exact observed page and its source in KPanel read-only; require explicit approval before any edit.',
        risk: 'Changing canonical behavior without validating redirects and locale equivalents may select the wrong URL.',
        acceptanceTest: 'After an owner-approved change, recheck the same verified URL, HTTP status, redirect chain, and normalized canonical target.',
        kpanelFeasibility: 'UNKNOWN',
        humanApprovalRequired: true
      });
    }
    if (page.document.schemaOpportunities.faqContentSignal && !page.document.schemaTypes.includes('FAQPage')) {
      observations.push({
        type: 'FAQ_SCHEMA_ELIGIBILITY_REVIEW',
        priority: 'P3',
        classification: 'OPPORTUNITY_NOT_REQUIREMENT',
        evidenceClass: 'INFERRED',
        confidence: 'LOW',
        url: safeUrl(page.finalUrl),
        proof: 'FAQ-like heading text was observed; schema eligibility and any requirement are unverified.',
        source: 'PUBLIC_HTML',
        observedAt: page.observedAt ?? generatedAt,
        customerImpactHypothesis: 'Structured-data eligibility may merit review; no search feature or conversion impact is verified.',
        recommendedOwnerAction: 'Confirm content eligibility and any applicable search-engine guidance; do not assume KPanel supports schema edits.',
        risk: 'Adding ineligible or inaccurate structured data can misrepresent the page.',
        acceptanceTest: 'If later approved, validate the rendered structured data against the exact page content and applicable policies.',
        kpanelFeasibility: 'UNKNOWN',
        humanApprovalRequired: true
      });
    }
  }

  return redactSecrets({
    generatedAt,
    sourceRunId: `public-crawl-${generatedAt}`,
    mode: 'PUBLIC_READ_ONLY',
    startUrl: safeUrl(START_URL),
    robots: {
      ...robots,
      rulesApplied: context.robotsRules.length,
      sitemaps: robots.sitemaps
    },
    summary: {
      pageRequestCount: pageFetchCount,
      pageCandidateCount: pageRequests.length,
      uniqueEffectivePageCount: effectivePages.length,
      sitemapUrlCount: context.sitemapUrlCount,
      sitemapFileAttemptCount: context.sitemapVisited.size,
      sitemapFileCount: context.sitemapFetched.size,
      requestCount: context.requestCount,
      titleDuplicateGroups: titleDuplicates,
      metaDescriptionDuplicateGroups: descriptionDuplicates,
      http404CandidateCount: effectivePages.filter(page => page.statusCode === 404).length,
      blockedSitemapCount: context.blockedSitemaps.length,
      failedRequestCount: failedRequests
    },
    coverage: {
      status: reachedPageLimit || !context.sitemapComplete || failedRequests > 0 || context.skippedUrls.size > 0
        ? 'PARTIAL'
        : 'BOUNDED_SCOPE_COMPLETE',
      scope: 'Discovered same-site URLs only; this is not a complete-site or search-indexation proof.',
      queryUrlPolicy: includeQueryUrls ? 'INCLUDED_BY_EXPLICIT_OPTION' : 'EXCLUDED_BY_DEFAULT',
      pageLimit,
      pageRequestCount: pageFetchCount,
      uniqueEffectivePageCount: effectivePages.length,
      sitemapUrlCount: context.sitemapUrlCount,
      queuedSitemapUrlCount: [...sitemapUrls].filter(url => queue.includes(url) || visited.has(url)).length,
      remainingQueueCount: queue.length,
      sitemapComplete: context.sitemapComplete,
      linkGraphCoverage: 'OBSERVED_LINKS_FROM_CRAWLED_HTML_ONLY',
      orphanAssessment: 'CANDIDATE_ONLY_NOT_VERIFIED',
      actualSearchIndexation: 'UNKNOWN_NO_SEARCH_CONSOLE_EVIDENCE'
    },
    sitemap: {
      filesFetched: [...context.sitemapFetched].map(url => safeUrl(url)),
      blockedOrUnavailable: context.blockedSitemaps,
      skippedUrls: [...context.skippedUrls].map(([url, reason]) => ({
        url: safeUrl(url),
        reason
      }))
    },
    pages: effectivePages.map(page => ({
      requestedUrls: page.requestedUrls.map(url => safeUrl(url)),
      finalUrl: safeUrl(page.finalUrl),
      effectiveUrl: safeUrl(effectiveUrlKey(page.finalUrl)),
      statusCode: page.statusCode,
      result: page.result,
      redirectChain: page.redirectChain?.map(url => safeUrl(url)) ?? [],
      evidenceSources: page.evidenceSources,
      document: page.document ? {
        ...page.document,
        links: page.document.links.map(url => safeUrl(url)),
        skippedLinks: page.document.skippedLinks.map(link => ({
          url: safeUrl(link.url),
          reason: link.reason
        }))
      } : null,
      observedAt: page.observedAt ?? generatedAt
    })),
    http404Candidates: effectivePages
      .filter(page => page.statusCode === 404)
      .map(page => ({
        url: safeUrl(page.finalUrl),
        classification: 'OBSERVED_HTTP_404',
        evidenceClass: 'VERIFIED',
        sources: page.evidenceSources
      })),
    linkGraph: {
      edgeCount: links.length,
      links,
      orphanCandidates
    },
    observations,
    unresolved: [
      'Historical BACKLOG.md issues are not current findings without matching public evidence.',
      'KPanel data, historical reports, Google/Bing indexation, and production edit feasibility are UNKNOWN.',
      'No production change is recommended or authorized by this audit.'
    ]
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.argv.includes('--live')) {
    console.error('Public crawl is opt-in; rerun with --live to make rate-limited HTTPS GET requests.');
    process.exitCode = 2;
  } else {
    runPublicSeoCrawler()
      .then(async crawlReport => {
        const { buildMasterAuditReport, writeMasterAuditReport } = await import('./generate-master-audit.mjs');
        const report = await buildMasterAuditReport({ crawlReport });
        await writeMasterAuditReport(report);
        console.log('Master audit written to audit/reports/master-audit.json and .md.');
      })
      .catch(error => {
        console.error('Public audit failed:', redactSecrets(error.message));
        process.exitCode = 1;
      });
  }
}
