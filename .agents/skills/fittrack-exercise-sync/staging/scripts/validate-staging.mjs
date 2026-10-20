import fs from 'node:fs';
import path from 'node:path';
import { ExerciseSchema } from '../../../../../src/schema.ts';

const dummyIllustration = {
  styleId: 'line-art-v1',
  mediaId: '0000000000000000000000000000000000000000000000000000000000000000',
  url: '/media/0000000000000000000000000000000000000000000000000000000000000000.png',
  left: 'Start position',
  right: 'End position',
  alt: 'Instructional line drawing',
  generation: {
    method: 'built-in-image-gen',
    createdDate: '2026-10-20',
    promptId: 'placeholder',
    model: null
  }
};

export function validateStagedDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.error(`Directory not found: ${dirPath}`);
    return false;
  }

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
  let validCount = 0;
  let errors = 0;

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const toValidate = content.illustration ? content : { ...content, illustration: dummyIllustration };
    const parsed = ExerciseSchema.safeParse(toValidate);

    if (!parsed.success) {
      console.error(`❌ Validation failed for ${file}:`);
      console.error(JSON.stringify(parsed.error.format(), null, 2));
      errors++;
    } else {
      console.log(`✓ ${file} is 100% schema-compliant`);
      validCount++;
    }
  }

  console.log(`\nValidated ${validCount} staged exercises (${errors} errors).`);
  return errors === 0;
}

if (process.argv[1] && process.argv[1].endsWith('validate-staging.mjs')) {
  const targetDir = process.argv[2] || '.agents/skills/fittrack-exercise-sync/staging/batch-6/exercises';
  const success = validateStagedDir(targetDir);
  process.exit(success ? 0 : 1);
}
