export const FEED = 'https://res.stj.jus.br/hrestp-c-portalp/RSS.xml';
export const NEWS_TTL = 15 * 60 * 1000;
const NEWS_KEY = 'news/stj.json';

function decode(s) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, n) => {
      const code = n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n);
      return code <= 0x10ffff ? String.fromCodePoint(code) : '';
    }).replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
}
function clean(s) { return decode(s).replace(/<[^>]*>/g, '').trim(); }
function sourceUrl(value, base = 'https://www.stj.jus.br') {
  try {
    const url = new URL(decode(value), base);
    return url.protocol === 'https:' && !url.username && !url.password &&
      (url.hostname === 'stj.jus.br' || url.hostname.endsWith('.stj.jus.br')) ? url.href : null;
  } catch { return null; }
}
export function newsDate(value) {
  // The official feed uses Portuguese month names and Brasília local time.
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const local = value.match(/^[^,]+,\s*([a-zç]+)\s+(\d{1,2})\s+(\d{4})\s+(\d{2}:\d{2}:\d{2})\s*$/i);
  const date = local && months.includes(local[1].toLowerCase())
    ? `${local[3]}-${String(months.indexOf(local[1].toLowerCase()) + 1).padStart(2,'0')}-${local[2].padStart(2,'0')}T${local[4]}-03:00`
    : value;
  return Number.isFinite(Date.parse(date)) ? new Date(date).toISOString() : null;
}
export function parseFeed(xml) {
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map(([, body]) => {
    const field = name => body.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+name+'>','i'))?.[1] || '';
    const title = clean(field('title')), url = sourceUrl(clean(field('link')));
    if (!url || !title || !field('link')) return null;
    const media = [...body.matchAll(/<(?:media:content|media:thumbnail|enclosure)\b[^>]*\burl\s*=\s*["']([^"']+)["'][^>]*>/gi)]
      .filter(([tag]) => !/type=["'](?:audio|video)\//i.test(tag)).map(([, src]) => src);
    const html = decode(field('content:encoded') || field('description'));
    const pictures = [...html.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map(([, src]) => src);
    const image = [...media, ...pictures].map(src => sourceUrl(src, url)).find(Boolean) || 'https://www.stj.jus.br/sites/portalp/WebPub/trunk/img/logo-stj-redes.jpg';
    return { title, url, image, date: newsDate(clean(field('pubDate'))) };
  }).filter(Boolean).sort((a,b) => (Date.parse(b.date)||0)-(Date.parse(a.date)||0)).slice(0,3);
}

async function readSaved(bucket) {
  if (!bucket) return null;
  try { const object = await bucket.get(NEWS_KEY); return object ? await object.json() : null; }
  catch { return null; }
}
export function createNewsService({ fetcher = fetch, now = Date.now } = {}) {
  let cached = null, pending = null;
  const fresh = data => data && now() - Date.parse(data.updatedAt) < NEWS_TTL;
  const reply = (data, stale = false, persisted = false) => Response.json(
    { ...data, stale, persisted }, { headers: { 'Cache-Control': 'no-store' } });
  async function refresh(bucket) {
    const response = await fetcher(FEED, { signal: AbortSignal.timeout(8000), headers: { Accept: 'application/rss+xml, application/xml, text/xml' } });
    if (!response.ok) throw Error('upstream');
    const items = parseFeed(await response.text());
    if (!items.length) throw Error('empty');
    const data = { items, updatedAt: new Date(now()).toISOString(), source: FEED };
    if (bucket) await bucket.put(NEWS_KEY, JSON.stringify(data), { httpMetadata: { contentType: 'application/json' } });
    cached = data;
    return data;
  }
  return async (env = {}, readOnly = false) => {
    const bucket = env.BUCKET;
    if (readOnly) {
      const saved = await readSaved(bucket);
      return saved ? reply(saved, !fresh(saved), true) : Response.json({ error: 'Sem notícias salvas' }, { status: 503 });
    }
    if (fresh(cached)) return reply(cached, false, Boolean(bucket));
    const saved = await readSaved(bucket);
    if (fresh(saved)) { cached = saved; return reply(saved, false, true); }
    try {
      if (!pending) pending = refresh(bucket).finally(() => { pending = null; });
      return reply(await pending, false, Boolean(bucket));
    } catch {
      const previous = saved || cached;
      return previous ? reply(previous, true, Boolean(saved)) : Response.json({ error: 'Notícias indisponíveis' }, { status: 503 });
    }
  };
}
export const newsResponse = createNewsService();
