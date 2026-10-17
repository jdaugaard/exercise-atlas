import { writeFile } from 'node:fs/promises';
import { loadCatalog } from '../src/catalog.ts';

const catalog = await loadCatalog();
const lines = ['# Five illustrated exercise examples', '',
  'Original draft entries in the line-art-v1 visual style. Technique review is pending; cuff and machine details need confirmation. These are catalog entries, not prescribed workout programs.', ''];
for (const e of catalog.exercises) {
  lines.push(`## ${e.name}`, '', `![${e.illustration.alt}](../catalog${e.illustration.url})`, '',
    `${e.illustration.left} / ${e.illustration.right}`, '', e.description, '',
    `- **Danish:** ${e.nameDa}`, `- **Aliases:** ${e.aliases.join(', ')}`,
    `- **Primary muscles:** ${e.primaryMuscles.join(', ')}`, `- **Assisting muscles:** ${e.secondaryMuscles.join(', ')}`,
    `- **Stabilizers:** ${e.stabilizers.join(', ')}`, `- **Equipment:** ${e.equipmentItems.join(', ')}`,
    `- **Movement:** ${e.movementPattern}; ${e.laterality}`, `- **Grip:** ${e.grip}`,
    `- **Difficulty:** ${e.difficulty} (editorial label)`, `- **Review:** ${e.reviewStatus}; revision ${e.revision}`, '',
    '### Setup', '', ...e.setup.map((v) => `- ${v}`), '', '### Execution', '',
    ...e.instructions.map((v, i) => `${i + 1}. ${v}`), '', '### Cues', '', ...e.cues.map((v) => `- ${v}`), '',
    '### Common mistakes', '', ...e.commonMistakes.map((v) => `- ${v}`), '', '### Logging convention', '',
    e.logging.example, '', e.logging.note, '', '### Variants and alternatives', '', e.variantNote, '',
    ...e.alternatives.map((v) => `- ${v}`), '', '### Review notes', '', ...e.reviewNotes.map((v) => `- ${v}`), '',
    '### References', '', ...e.sources.map((s) => `- [${s.title}](${s.url}): ${s.scope}`), '',
    `[Editable JSON](../catalog/exercises/${e.id}.json)`, '');
}
await writeFile(new URL('../docs/examples.md', import.meta.url), lines.join('\n'));
console.log(`Rendered ${catalog.exercises.length} readable examples.`);
