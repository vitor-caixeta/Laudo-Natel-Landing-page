import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import handler from '../api/noticias.js';

test('configura a saída estática e a função de notícias para a Vercel', async () => {
  const config = JSON.parse(await readFile('vercel.json', 'utf8'));
  assert.equal(config.framework, null);
  assert.equal(config.buildCommand, null);
  assert.equal(config.outputDirectory, 'web');
  assert.equal(config.functions['api/noticias.js'].maxDuration, 10);
  assert.equal(typeof handler.fetch, 'function');

  const response = await handler.fetch(new Request('https://example.com/api/noticias', {
    method: 'POST'
  }));
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET, HEAD');
});
