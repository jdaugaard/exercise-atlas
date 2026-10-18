import fs from 'node:fs';
import path from 'node:path';

function normalize(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function loadCatalog(catalogDir = 'catalog/exercises') {
  const files = fs.readdirSync(catalogDir).filter(f => f.endsWith('.json'));
  return files.map(file => {
    const fullPath = path.join(catalogDir, file);
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    return {
      file,
      id: data.id,
      name: data.name,
      nameDa: data.nameDa,
      aliases: data.aliases || [],
      category: data.category,
      equipmentItems: data.equipmentItems || []
    };
  });
}

export function reconcile(fitTrackExercises, catalogDir = 'catalog/exercises') {
  const catalog = loadCatalog(catalogDir);
  const matched = [];
  const missing = [];

  for (const ft of fitTrackExercises) {
    const ftNorm = normalize(ft.name);
    const found = catalog.find(c => {
      if (normalize(c.id) === ftNorm) return true;
      if (normalize(c.name) === ftNorm) return true;
      if (normalize(c.nameDa) === ftNorm) return true;
      if (c.aliases.some(a => normalize(a) === ftNorm)) return true;
      return false;
    });

    if (found) {
      matched.push({ ft, catalog: found });
    } else {
      missing.push(ft);
    }
  }

  return { matched, missing };
}

// CLI execution
if (process.argv[1] && process.argv[1].endsWith('reconcile.mjs')) {
  const args = process.argv.slice(2);
  let inputFile = null;
  const inputIdx = args.indexOf('--input');
  if (inputIdx !== -1 && args[inputIdx + 1]) {
    inputFile = args[inputIdx + 1];
  }

  let ftExercises = [];
  if (inputFile) {
    const raw = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    ftExercises = Array.isArray(raw) ? raw : (raw.data || []);
  } else {
    // Read from stdin if available
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    if (chunks.length > 0) {
      const raw = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      ftExercises = Array.isArray(raw) ? raw : (raw.data || []);
    }
  }

  if (ftExercises.length === 0) {
    console.error('Usage: node reconcile.mjs --input <fittrack.json>');
    console.error('Or pipe FitTrack JSON data to stdin.');
    process.exit(1);
  }

  const { matched, missing } = reconcile(ftExercises);
  console.log(`\nReconciliation Summary:`);
  console.log(`- FitTrack total: ${ftExercises.length}`);
  console.log(`- Matched in catalog: ${matched.length}`);
  console.log(`- Missing from catalog: ${missing.length}`);

  console.log(`\nNext 5 Missing Exercises for Batch:`);
  missing.slice(0, 5).forEach((m, idx) => {
    console.log(`${idx + 1}. [ID ${m.id}] "${m.name}" | Category: ${m.category} | Equipment: ${m.equipment || 'none'}`);
  });
}
