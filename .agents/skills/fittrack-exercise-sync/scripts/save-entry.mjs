import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ExerciseSchema } from '../../../../src/schema.ts';

export function convertToSha256Png(srcPath, mediaDir = 'catalog/media') {
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Source image not found: ${srcPath}`);
  }

  // Convert via PowerShell System.Drawing to guarantee standard PNG encoding
  const psScript = `
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("${srcPath.replace(/\\/g, '\\\\')}")
$ms = New-Object System.IO.MemoryStream
$img.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$bytes = $ms.ToArray()
$img.Dispose()
$ms.Dispose()

if ($bytes[0] -ne 0x89 -or $bytes[1] -ne 0x50 -or $bytes[2] -ne 0x4E -or $bytes[3] -ne 0x47) {
    throw "Invalid PNG header"
}

$sha256 = [System.Security.Cryptography.SHA256]::Create()
$hash = -join ($sha256.ComputeHash($bytes) | ForEach-Object { $_.ToString("x2") })

$dest = Join-Path "${mediaDir.replace(/\\/g, '\\\\')}" "$hash.png"
[System.IO.File]::WriteAllBytes($dest, $bytes)
Write-Output $hash
`;

  fs.mkdirSync(mediaDir, { recursive: true });
  const hash = execFileSync('powershell', ['-NoProfile', '-Command', psScript], { encoding: 'utf8' }).trim();
  return hash;
}

export function saveExerciseEntry({
  exerciseData,
  imagePath,
  prompt,
  references = ['seated-cable-row-wrist-cuffs.png'],
  corrections = []
}) {
  const hash = convertToSha256Png(imagePath);

  // Bind illustration fields
  exerciseData.illustration = {
    styleId: 'line-art-v1',
    mediaId: hash,
    url: `/media/${hash}.png`,
    left: exerciseData.illustration?.left || 'Starting position',
    right: exerciseData.illustration?.right || 'Peak contraction position',
    alt: exerciseData.illustration?.alt || `Paired black-and-white instructional line drawings of ${exerciseData.name}.`,
    generation: {
      method: 'built-in-image-gen',
      createdDate: new Date().toISOString().slice(0, 10),
      promptId: exerciseData.id,
      model: null
    }
  };

  // Validate with Zod schema
  const validated = ExerciseSchema.parse(exerciseData);

  // Write exercise JSON file
  const exerciseFile = `catalog/exercises/${validated.id}.json`;
  fs.writeFileSync(exerciseFile, JSON.stringify(validated, null, 2) + '\n');
  console.log(`Saved exercise: ${exerciseFile}`);

  // Update generation-prompts-0.2.0.json
  const promptsFile = 'catalog/styles/line-art-v1/generation-prompts-0.2.0.json';
  if (fs.existsSync(promptsFile)) {
    const pData = JSON.parse(fs.readFileSync(promptsFile, 'utf8'));
    const entry = {
      id: validated.id,
      prompt: prompt || validated.description,
      references,
      createdDate: validated.illustration.generation.createdDate,
      model: null,
      mediaId: hash
    };
    if (corrections && corrections.length > 0) {
      entry.corrections = corrections;
    }
    pData.prompts = pData.prompts.filter(p => p.id !== validated.id);
    pData.prompts.push(entry);
    fs.writeFileSync(promptsFile, JSON.stringify(pData, null, 2) + '\n');
    console.log(`Updated generation prompts: ${promptsFile}`);
  }

  return { id: validated.id, hash, file: exerciseFile };
}

// CLI usage
if (process.argv[1] && process.argv[1].endsWith('save-entry.mjs')) {
  const args = process.argv.slice(2);
  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : null;
  };

  const imagePath = getArg('--image');
  const dataPath = getArg('--data');
  const prompt = getArg('--prompt');
  const refs = getArg('--refs') ? getArg('--refs').split(',') : ['seated-cable-row-wrist-cuffs.png'];

  if (!imagePath || !dataPath) {
    console.error('Usage: node save-entry.mjs --image <path> --data <exercise.json> [--prompt <prompt>] [--refs <r1,r2>]');
    process.exit(1);
  }

  const exerciseData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const res = saveExerciseEntry({ exerciseData, imagePath, prompt, references: refs });
  console.log(`Successfully ingested ${res.id} (${res.hash})!`);
}
