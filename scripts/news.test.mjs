import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewsService, parseFeed, newsDate, NEWS_TTL } from '../worker/api.js';
const fixture = (title = 'Nova decisão') => `<rss><item><title>${title}</title><link>https://www.stj.jus.br/noticia</link><pubDate>Qui, nov 12 2026 09:48:00</pubDate><content:encoded><![CDATA[<p><img src="/sites/portalp/capa.jpg?x=1&amp;y=2"></p>]]></content:encoded></item></rss>`;
test('extrai a capa original e converte o horário de Brasília', () => {
  const [item] = parseFeed(fixture());
  assert.equal(item.image, 'https://www.stj.jus.br/sites/portalp/capa.jpg?x=1&y=2');
  assert.equal(item.date, '2026-11-12T12:48:00.000Z');
  assert.equal(newsDate('Seg, fev 02 2026 07:00:00'), '2026-02-02T10:00:00.000Z');
  assert.equal(newsDate('inválida'), null);
});
test('não aceita capas externas ou URLs executáveis', () => {
  for (const image of ['javascript:alert(1)', 'https://stj.jus.br.evil.com/a.jpg', 'https://evil.com/a.jpg']) {
    const [item] = parseFeed(fixture().replace('/sites/portalp/capa.jpg?x=1&amp;y=2', image));
    assert.equal(item.image, 'https://www.stj.jus.br/sites/portalp/WebPub/trunk/img/logo-stj-redes.jpg');
  }
});
test('atualiza após o prazo, persiste, lê sem nova consulta e preserva notícias em falhas', async () => {
  let time = Date.parse('2026-11-12T14:00:00Z'), calls = 0, fail = false;
  const records = new Map();
  const bucket = {
    get: async key => records.has(key) ? { json: async () => JSON.parse(records.get(key)) } : null,
    put: async (key, data) => { records.set(key, data); }
  };
  const fetcher = async () => { calls++; if (fail) throw Error('offline'); return new Response(fixture('Notícia ' + calls)); };
  const service = createNewsService({ fetcher, now: () => time });
  assert.equal((await (await service({ BUCKET: bucket })).json()).persisted, true);
  assert.equal((await (await service({ BUCKET: bucket }, true)).json()).items[0].title, 'Notícia 1');
  await service({ BUCKET: bucket });
  assert.equal(calls, 1);
  time += NEWS_TTL + 1;
  assert.equal((await (await service({ BUCKET: bucket })).json()).items[0].title, 'Notícia 2');
  // A fresh server instance still reads the saved publication.
  const restart = createNewsService({ fetcher, now: () => time });
  await restart({ BUCKET: bucket });
  assert.equal(calls, 2);
  time += 24 * 60 * 60 * 1000;
  assert.equal((await (await restart({ BUCKET: bucket })).json()).items[0].title, 'Notícia 3');
  time += NEWS_TTL + 1; fail = true;
  const stale = await (await restart({ BUCKET: bucket })).json();
  assert.equal(stale.stale, true);
  assert.equal(stale.items[0].title, 'Notícia 3');
  assert.equal(records.size, 1);
});
