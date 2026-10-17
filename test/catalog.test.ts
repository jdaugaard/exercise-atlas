import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { catalogDirectory, loadCatalog } from '../src/catalog.ts';
import { ExerciseSchema, exerciseJsonSchema } from '../src/schema.ts';

test('a catalog cannot start with corrupt images or mismatched IDs', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'exercise-atlas-test-'));
  try {
    await cp(catalogDirectory, directory, { recursive: true });
    const catalog = await loadCatalog(directory);
    const first = catalog.exercises[0]!;
    const file = join(directory, 'exercises', `${first.id}.json`);
    await writeFile(file, JSON.stringify({ ...first, id: 'mismatched-id' }));
    await assert.rejects(loadCatalog(directory), /Filename does not match/);
    await writeFile(file, JSON.stringify(first));
    await writeFile(join(directory, 'media', `${first.illustration.mediaId}.png`), 'not a PNG');
    await assert.rejects(loadCatalog(directory), /Invalid PNG or media checksum/);
  } finally {
    assert.equal(resolve(directory), directory);
    assert(basename(directory).startsWith('exercise-atlas-test-'));
    await rm(directory, { recursive: true });
  }
});

test('review cannot be claimed without a timestamp, and the portable schema stays current', async () => {
  const first = (await loadCatalog()).exercises[0]!;
  assert.equal(ExerciseSchema.safeParse({ ...first, reviewStatus: 'reviewed' }).success, false);
  const portable = JSON.parse(await readFile(new URL('../.agents/skills/exercise-atlas-authoring/assets/exercise.schema.json', import.meta.url), 'utf8'));
  assert.deepEqual(portable, exerciseJsonSchema);
});

test('the portable prompt composer reuses fixed originals and needs no installed packages', () => {
  const script = new URL('../.agents/skills/exercise-atlas-authoring/scripts/compose-prompt.mjs', import.meta.url);
  const input = { name: 'Cable row', camera: 'side', equipment: 'wrist cuffs and two low pulleys',
    positionA: 'arms extended', positionB: 'elbows drawn back', mechanics: 'hands relaxed and torso upright',
    reference: 'barbell-romanian-deadlift.png' };
  const result = spawnSync(process.execPath, [fileURLToPath(script)], { input: JSON.stringify(input), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const assembled = JSON.parse(result.stdout);
  assert.equal(assembled.styleId, 'line-art-v1');
  assert.equal(assembled.referenceImages.length, 2);
  assert.match(assembled.referenceImages[0], /seated-cable-row-wrist-cuffs\.png$/);
  assert.match(assembled.prompt, /hands relaxed and torso upright/);
  const invalid = spawnSync(process.execPath, [fileURLToPath(script)], {
    input: JSON.stringify({ ...input, reference: '../../outside.png' }), encoding: 'utf8',
  });
  assert.notEqual(invalid.status, 0);
});
