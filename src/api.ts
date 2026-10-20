import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { sha256, taxonomy, type Catalog } from './catalog.ts';
import { exerciseJsonSchema } from './schema.ts';

const viewerBuffer = await readFile(new URL('./viewer.html', import.meta.url));

class BadQuery extends Error {}
const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase('en').trim();
const errors = (code: string, message: string) => ({ error: { code, message } });

function integer(value: string | null, fallback: number, maximum: number): number {
  if (value === null) return fallback;
  if (!/^(0|[1-9]\d*)$/.test(value)) throw new BadQuery('Pagination must use nonnegative whole numbers');
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > maximum) throw new BadQuery('Pagination value is out of range');
  return parsed;
}

function replyHtml(req: IncomingMessage, res: ServerResponse, status: number, body: Buffer) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Length', body.length);
  res.writeHead(status);
  res.end(req.method === 'HEAD' ? undefined : body);
}

function reply(req: IncomingMessage, res: ServerResponse, status: number, payload: unknown, png = false) {
  const body = png ? payload as Buffer : Buffer.from(JSON.stringify(payload));
  const tag = `"${sha256(body)}"`;
  res.setHeader('Content-Type', png ? 'image/png' : 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', status === 200 ? (png ? 'public, max-age=31536000, immutable' : 'no-cache') : 'no-store');
  if (status === 200) {
    res.setHeader('ETag', tag);
    const candidates = (req.headers['if-none-match'] ?? '').split(',').map((v) => v.trim().replace(/^W\//, ''));
    if (candidates.includes(tag) || candidates.includes('*')) {
      res.writeHead(304); res.end(); return;
    }
  }
  res.setHeader('Content-Length', body.length);
  res.writeHead(status);
  res.end(req.method === 'HEAD' ? undefined : body);
}

export function createApi(catalog: Catalog) {
  const lookup = new Map(catalog.exercises.map((e) => [e.id, e]));
  return createServer((req, res) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.setHeader('Allow', 'GET, HEAD');
        reply(req, res, 405, errors('METHOD_NOT_ALLOWED', 'This API supports GET and HEAD only')); return;
      }
      // A fixed base prevents the Host header from influencing generated links.
      const url = new URL(req.url ?? '/', 'http://localhost');
      const path = url.pathname;
      if (path === '/ui' || path === '/viewer' || (path === '/' && req.headers.accept?.includes('text/html'))) {
        replyHtml(req, res, 200, viewerBuffer);
      } else if (path === '/') {
        reply(req, res, 200, { name: 'Exercise Atlas', version: catalog.manifest.catalogVersion,
          links: { catalog: '/v1/catalog', exercises: '/v1/exercises', taxonomy: '/v1/taxonomy', schema: '/v1/schema', health: '/health', ui: '/ui' } });
      } else if (path === '/health') {
        reply(req, res, 200, { status: 'ok', catalogVersion: catalog.manifest.catalogVersion, exerciseCount: catalog.exercises.length });
      } else if (path === '/v1/catalog') {
        reply(req, res, 200, { ...catalog.manifest, exerciseCount: catalog.exercises.length,
          reviewCounts: Object.fromEntries(['draft', 'reviewed', 'retired'].map((status) => [status, catalog.exercises.filter((e) => e.reviewStatus === status).length])) });
      } else if (path === '/v1/taxonomy') {
        reply(req, res, 200, taxonomy(catalog.exercises));
      } else if (path === '/v1/schema') {
        reply(req, res, 200, exerciseJsonSchema);
      } else if (path === '/v1/exercises') {
        const allowed = new Set(['q', 'muscle', 'equipment', 'difficulty', 'status', 'limit', 'offset']);
        for (const key of url.searchParams.keys()) {
          if (!allowed.has(key) || url.searchParams.getAll(key).length !== 1) throw new BadQuery(`Unsupported or repeated query parameter: ${key}`);
          if ((url.searchParams.get(key)?.length ?? 0) > 200) throw new BadQuery('Query value is too long');
        }
        const limit = integer(url.searchParams.get('limit'), 20, 100);
        if (limit === 0) throw new BadQuery('limit must be between 1 and 100');
        const offset = integer(url.searchParams.get('offset'), 0, Number.MAX_SAFE_INTEGER);
        const status = url.searchParams.get('status');
        if (status && !['draft', 'reviewed', 'retired'].includes(status)) throw new BadQuery('Unknown review status');
        const difficulty = url.searchParams.get('difficulty');
        if (difficulty && !['beginner', 'intermediate', 'advanced'].includes(normalize(difficulty))) throw new BadQuery('Unknown difficulty');
        const q = normalize(url.searchParams.get('q') ?? '');
        const muscle = normalize(url.searchParams.get('muscle') ?? '');
        const equipment = normalize(url.searchParams.get('equipment') ?? '');
        const rows = catalog.exercises.filter((e) => {
          const muscles = [...e.primaryMuscles, ...e.secondaryMuscles, ...e.stabilizers];
          const searchable = [e.name, e.nameDa, ...e.aliases, e.description, ...e.bodyParts, ...muscles, ...e.equipmentItems];
          return (!q || searchable.some((v) => normalize(v).includes(q)))
            && (!muscle || muscles.some((v) => normalize(v) === muscle))
            && (!equipment || e.equipmentItems.some((v) => normalize(v) === equipment))
            && (!status || e.reviewStatus === status)
            && (!difficulty || normalize(e.difficulty) === normalize(difficulty));
        });
        reply(req, res, 200, { catalogVersion: catalog.manifest.catalogVersion, total: rows.length, limit, offset,
          nextOffset: offset + limit < rows.length ? offset + limit : null, data: rows.slice(offset, offset + limit) });
      } else if (path.startsWith('/v1/exercises/')) {
        const id = path.slice('/v1/exercises/'.length);
        const exercise = lookup.get(id);
        if (!exercise) { reply(req, res, 404, errors('NOT_FOUND', 'Exercise not found')); return; }
        reply(req, res, 200, { catalogVersion: catalog.manifest.catalogVersion, data: exercise });
      } else if (/^\/media\/[a-f0-9]{64}\.png$/.test(path)) {
        const bytes = catalog.media.get(path.slice(7, -4));
        if (!bytes) { reply(req, res, 404, errors('NOT_FOUND', 'Media not found')); return; }
        reply(req, res, 200, bytes, true);
      } else {
        reply(req, res, 404, errors('NOT_FOUND', 'Route not found'));
      }
    } catch (error) {
      const badRequest = error instanceof BadQuery || error instanceof TypeError;
      reply(req, res, badRequest ? 400 : 500,
        errors(badRequest ? 'BAD_REQUEST' : 'INTERNAL_ERROR', badRequest ? (error as Error).message : 'Request failed'));
    }
  });
}
