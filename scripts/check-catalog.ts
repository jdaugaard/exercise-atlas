import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { catalogDirectory, loadCatalog, sha256 } from '../src/catalog.ts';

const catalog = await loadCatalog();
const style = JSON.parse(await readFile(join(catalogDirectory, 'styles/line-art-v1/manifest.json'), 'utf8'));
for (const reference of style.references) {
  const bytes = await readFile(new URL(`../.agents/skills/exercise-atlas-authoring/assets/references/${reference.file}`, import.meta.url));
  if (sha256(bytes) !== reference.sha256) throw new Error(`Style reference changed: ${reference.file}`);
}
console.log(`Validated ${catalog.exercises.length} exercises, ${catalog.media.size} PNG checksums and ${style.references.length} style references.`);
