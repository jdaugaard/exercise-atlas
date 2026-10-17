import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApi } from '../src/api.ts';
import { loadCatalog, sha256 } from '../src/catalog.ts';

const catalog = await loadCatalog();
const server = createApi(catalog);
let origin: string;
before(async () => {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address !== 'string');
  origin = `http://127.0.0.1:${address.port}`;
});
after(async () => { server.close(); server.closeAllConnections(); await once(server, 'close'); });
const get = (path: string, init?: RequestInit) => fetch(`${origin}${path}`, init);

test('health and catalog accurately expose five draft entries, no reviewed entries', async () => {
  const health = await (await get('/health')).json();
  assert.equal(health.exerciseCount, 5);
  assert.equal(health.status, 'ok');
  const manifest = await (await get('/v1/catalog')).json();
  assert.equal(manifest.license, 'UNLICENSED');
  assert.deepEqual(manifest.reviewCounts, { draft: 5, reviewed: 0, retired: 0 });
  const reviewed = await (await get('/v1/exercises?status=reviewed')).json();
  assert.equal(reviewed.total, 0);
  assert.deepEqual(reviewed.data, []);
});

test('search finds cuff variation, Danish names, aliases and muscle names', async () => {
  for (const term of ['CUFFS', 'håndledscuffs', 'RDL', 'Rhomboids']) {
    const result = await (await get(`/v1/exercises?q=${encodeURIComponent(term)}`)).json();
    assert(result.total >= 1, term);
  }
  const cuff = await (await get('/v1/exercises?q=cuffs')).json();
  assert.equal(cuff.data[0].id, 'seated-cable-row-wrist-cuffs');
});

test('taxonomy values can be used as exact case-insensitive AND filters', async () => {
  const result = await (await get('/v1/exercises?muscle=HAMSTRINGS&equipment=barbell')).json();
  assert.deepEqual(result.data.map((e: { id: string }) => e.id), ['barbell-romanian-deadlift']);
  const noMatch = await (await get('/v1/exercises?q=cuffs&equipment=barbell')).json();
  assert.equal(noMatch.total, 0);
  const taxonomy = await (await get('/v1/taxonomy')).json();
  assert(taxonomy.equipment.includes('Barbell'));
});

test('pagination is stable, complete and has a correct end cursor', async () => {
  const ids: string[] = [];
  let offset: number | null = 0;
  do {
    const page = await (await get(`/v1/exercises?limit=2&offset=${offset}`)).json();
    assert.equal(page.total, 5);
    ids.push(...page.data.map((e: { id: string }) => e.id));
    offset = page.nextOffset;
  } while (offset !== null);
  assert.equal(ids.length, 5);
  assert.equal(new Set(ids).size, 5);
  const beyond = await (await get('/v1/exercises?offset=999')).json();
  assert.deepEqual(beyond.data, []);
  assert.equal(beyond.nextOffset, null);
});

test('invalid, ambiguous and unsupported search inputs return 400', async () => {
  for (const query of ['limit=0', 'limit=101', 'limit=2.5', 'offset=-1', 'offset=9007199254740992',
    'status=approved', 'difficulty=impossible', 'q=x&q=y', 'unknown=1', `q=${'a'.repeat(201)}`]) {
    const response = await get(`/v1/exercises?${query}`);
    assert.equal(response.status, 400, query);
    assert.equal((await response.json()).error.code, 'BAD_REQUEST');
  }
});

test('detail records preserve revision, scoped sources and explicit cuff assumptions', async () => {
  const response = await get('/v1/exercises/seated-cable-row-wrist-cuffs');
  const { data } = await response.json();
  assert.equal(data.revision, 1);
  assert.equal(data.reviewStatus, 'draft');
  assert.equal(data.reviewedAt, null);
  assert.match(data.variantNote, /two low cables/);
  assert(data.sources.every((s: { scope: string }) => s.scope));
  assert.equal(data.illustration.generation.model, null);
  assert.equal('currentWorkoutContext' in data, false);
});

test('every media URL serves its actual SHA-256 PNG with immutable caching', async () => {
  for (const exercise of catalog.exercises) {
    const response = await get(exercise.illustration.url);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    assert.match(response.headers.get('cache-control') ?? '', /immutable/);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(sha256(bytes), exercise.illustration.mediaId);
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  }
});

test('ETag revalidation handles weak validators and HEAD without sending a body', async () => {
  for (const path of ['/v1/exercises', catalog.exercises[0]!.illustration.url]) {
    const original = await get(path);
    const etag = original.headers.get('etag');
    await original.arrayBuffer();
    assert(etag);
    const unchanged = await get(path, { headers: { 'If-None-Match': `"unrelated", W/${etag}` } });
    assert.equal(unchanged.status, 304);
    assert.equal((await unchanged.arrayBuffer()).byteLength, 0);
    const head = await get(path, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get('etag'), etag);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
  }
});

test('no HTTP method can write to the catalog or media', async () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
    const response = await get('/v1/exercises', { method });
    assert.equal(response.status, 405, method);
    assert.equal(response.headers.get('allow'), 'GET, HEAD');
  }
  assert.equal((await (await get('/v1/exercises')).json()).total, 5);
});

test('unknown records and non-allowlisted file paths return JSON 404s', async () => {
  for (const path of ['/v1/exercises/not-present', '/media/not-present.png', '/media/%2e%2e%2fpackage.json', '/package.json', '/.env']) {
    const response = await get(path);
    assert.equal(response.status, 404, path);
    assert.equal((await response.json()).error.code, 'NOT_FOUND');
  }
});

test('the served JSON Schema documents review and content-addressed media', async () => {
  const response = await get('/v1/schema');
  const schema = await response.json();
  assert(schema.required.includes('reviewStatus'));
  assert(schema.properties.illustration.properties.url.pattern.includes('/media'));
});
