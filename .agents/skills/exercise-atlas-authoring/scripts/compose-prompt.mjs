import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const input = [];
for await (const chunk of process.stdin) input.push(chunk);
const brief = JSON.parse(Buffer.concat(input).toString('utf8'));
for (const key of ['name', 'camera', 'equipment', 'positionA', 'positionB', 'mechanics']) {
  if (typeof brief[key] !== 'string' || !brief[key].trim()) throw new Error(`Missing brief field: ${key}`);
}
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('assets/style-manifest.json', root), 'utf8'));
const canonical = 'seated-cable-row-wrist-cuffs.png';
const selected = brief.reference ?? canonical;
if (!manifest.references.some((r) => r.file === selected)) throw new Error('Choose an original reference from the style manifest');
const referenceImages = [...new Set([canonical, selected])].map((name) => fileURLToPath(new URL(`assets/references/${name}`, root)));
const base = (await readFile(new URL('assets/prompt-base.txt', root), 'utf8')).trim();
const details = ['name', 'camera', 'equipment', 'positionA', 'positionB', 'mechanics', 'avoid']
  .filter((key) => brief[key]).map((key) => `${key}: ${brief[key]}`).join('\n');
console.log(JSON.stringify({ styleId: manifest.id, referenceImages,
  prompt: `${base}\nInput images are STYLE REFERENCES ONLY; create new original artwork for the requested movement.\n${details}`,
  checks: manifest.requiredChecks }, null, 2));
