import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { ExerciseSchema, ManifestSchema, type Exercise, type CatalogManifest } from './schema.ts';

export const catalogDirectory = fileURLToPath(new URL('../catalog/', import.meta.url));
export type Catalog = {
  manifest: CatalogManifest;
  exercises: Exercise[];
  media: ReadonlyMap<string, Buffer>;
};
export const sha256 = (bytes: string | Buffer): string => createHash('sha256').update(bytes).digest('hex');

export async function loadCatalog(directory = catalogDirectory): Promise<Catalog> {
  const manifest = ManifestSchema.parse(JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8')));
  const files = (await readdir(join(directory, 'exercises'))).filter((f) => f.endsWith('.json')).sort();
  if (!files.length) throw new Error('The catalog has no exercises');
  const exercises: Exercise[] = [];
  const ids = new Set<string>();
  const media = new Map<string, Buffer>();
  for (const file of files) {
    const exercise = ExerciseSchema.parse(JSON.parse(await readFile(join(directory, 'exercises', file), 'utf8')));
    if (file !== `${exercise.id}.json`) throw new Error(`Filename does not match exercise ID: ${file}`);
    if (ids.has(exercise.id)) throw new Error(`Duplicate exercise ID: ${exercise.id}`);
    ids.add(exercise.id);
    if (exercise.illustration.url !== `/media/${exercise.illustration.mediaId}.png`) {
      throw new Error(`Media URL does not match checksum: ${exercise.id}`);
    }
    const bytes = await readFile(join(directory, 'media', `${exercise.illustration.mediaId}.png`));
    if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || sha256(bytes) !== exercise.illustration.mediaId) {
      throw new Error(`Invalid PNG or media checksum: ${exercise.id}`);
    }
    media.set(exercise.illustration.mediaId, bytes);
    exercises.push(exercise);
  }
  exercises.sort((a, b) => a.name.localeCompare(b.name, 'en'));
  return { manifest, exercises, media };
}

export function taxonomy(exercises: Exercise[]) {
  const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, 'en'));
  return {
    muscles: unique(exercises.flatMap((e) => [...e.primaryMuscles, ...e.secondaryMuscles, ...e.stabilizers])),
    equipment: unique(exercises.flatMap((e) => e.equipmentItems)),
    bodyParts: unique(exercises.flatMap((e) => e.bodyParts)),
    difficulty: unique(exercises.map((e) => e.difficulty)),
    reviewStatus: unique(exercises.map((e) => e.reviewStatus)),
  };
}
