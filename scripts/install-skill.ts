import { cp, access, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const name = 'exercise-atlas-authoring';
const root = process.env.CODEX_HOME ?? join(homedir(), '.codex');
const destination = join(root, 'skills', name);
let exists = true;
try { await access(destination); } catch { exists = false; }
if (exists) throw new Error(`Skill already exists; inspect it before updating: ${destination}`);
await mkdir(join(root, 'skills'), { recursive: true });
await cp(fileURLToPath(new URL(`../.agents/skills/${name}/`, import.meta.url)), destination, { recursive: true, errorOnExist: true, force: false });
console.log(`Installed $${name} at ${destination}`);
