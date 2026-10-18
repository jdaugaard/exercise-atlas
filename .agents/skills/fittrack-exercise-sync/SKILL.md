---
name: fittrack-exercise-sync
description: "Reconcile, author, illustrate, and ingest Exercise Atlas entries from FitTrack MCP in high-throughput 3-5 exercise batches with visual line-art-v1 auditing and schema validation."
---

# FitTrack Exercise Atlas Sync

Automate and streamline the discovery, authoring, illustration, and catalog ingestion of missing exercises from the FitTrack MCP server into Exercise Atlas, strictly preserving catalog integrity and `line-art-v1` visual standards.

## Workflow Overview

1. **Reconciliation**: Fetch exercises from FitTrack MCP, match against catalog IDs/names/aliases, and slice the next batch of 3–5 missing items.
2. **Authoring & Brief Composition**: Resolve equipment/grip ambiguities, assign Danish naming (`nameDa`), determine qualitative muscle roles and logging conventions, and compose prompt briefs.
3. **Parallel Artwork Generation**: Launch concurrent image generation passes using immutable style anchors.
4. **Visual Quality Audit**: Inspect every output against geometric collision, grip orientation, and style consistency rules.
5. **Catalog Ingestion & Verification**: Convert to SHA-256 PNGs, validate schema with Zod, update prompt provenance, and run `npm run verify`.

---

## 1. Discovery & Reconciliation

Query FitTrack exercises using the `fittrack` MCP server:
- Use `limit: 15` per page when fetching to avoid response buffer truncation.
- Reconcile against `catalog/exercises/*.json` using `.agents/skills/fittrack-exercise-sync/scripts/reconcile.mjs`:
  ```bash
  node .agents/skills/fittrack-exercise-sync/scripts/reconcile.mjs --input fittrack-export.json
  ```
- Process exercises in **strict batches of 3–5 items**. Never batch more than 5 exercises at once to ensure visual QA is rigorous.

---

## 2. Movement Authoring & Data Conventions

Follow the rules in `references/fittrack-mapping-guide.md`:

### Logging Conventions
- **Dumbbells**: `logging.basis: "per_dumbbell"` (mass of a single dumbbell).
- **Barbell / Trap Bar**: `logging.basis: "total_barbell_mass"` (total bar + collar + loaded plate weight).
- **Selectorized Stack Machine**: `logging.basis: "selected_machine_load"` (pin setting on stack).
- **Cable Tower**: `logging.basis: "selected_stack_load"` (pin setting on specific cable station).
- **Bodyweight / Calisthenics**: `logging.basis: "bodyweight_only"` or `"added_external_load"`.

### Ambiguity Resolution & Honesty
- For vague FitTrack names (e.g. "Spider Curl", "Triceps Extension", "Seated Row"), pick the canonical commercial gym variant and state explicit equipment assumptions in `variantNote` and `reviewNotes`.
- Assign realistic muscle engagement (`primaryMuscles`, `secondaryMuscles`, `stabilizers`). Never invent quantitative activation percentages.
- Assign standard Danish naming (`nameDa`) following established catalog conventions (see mapping guide).
- Keep new entries in `reviewStatus: "draft"` and `reviewedAt: null`.

---

## 3. Illustration Prompt Composition

Always use `.agents/skills/exercise-atlas-authoring/scripts/compose-prompt.mjs`:
1. **Immutable Style Anchors**:
   - Primary: `.agents/skills/exercise-atlas-authoring/assets/references/seated-cable-row-wrist-cuffs.png` (always included).
   - Secondary: Closest match from `.agents/skills/exercise-atlas-authoring/assets/style-manifest.json`:
     - Standing free weight upper body: `dumbbell-lateral-raise.png`
     - Hip hinges / deadlifts / rows: `barbell-romanian-deadlift.png`
     - Machines / lever arcs: `machine-hip-thrust.png`
     - Benches / presses: `decline-dumbbell-bench-press.png`
   - *Never chain previously generated non-reference outputs as style references.*
2. **Camera Angles**:
   - Use side three-quarter views (e.g., facing right) that keep both limbs, handles, and attachment cables clearly visible.
3. **Paired Positions**:
   - Left panel: Start position (joint angles, grip setup, support).
   - Right panel: Peak concentric contraction position with identical figure scale, camera angle, and fixed equipment struts.
4. **Collision Avoidance**:
   - Explicitly instruct the model to avoid clipping limbs, cables, or weights through pads, posts, or the torso.

---

## 4. Generation & Visual QA Audit

- Launch batch generations concurrently via `invoke_subagent` using the `image-generator` role.
- **Audit Checklist**:
  - [ ] **Figure Consistency**: Faceless athletic male mannequin, dark cropped hair silhouette, bare torso, black athletic shorts, white trainers.
  - [ ] **Geometry & Fill**: Crisp black line-art contours, pure white figure fill, sparse light-gray equipment fill, pure white background.
  - [ ] **Anatomy**: Exactly two arms, two hands, two legs per panel.
  - [ ] **Collision Free**: Bars, dumbbells, cables, and forearms hang or move in clear space without clipping through bench struts, support pads, or the torso.
  - [ ] **Grip & Wrist Mechanics**: Correct supinated, pronated, or neutral orientation across start and peak positions.
  - [ ] **Stationary Rig**: Machine frames, pulleys, and bench pads do not morph or shift between left and right panels.
- If a major collision or anatomical error occurs, run **one targeted correction pass**. Document minor unavoidable nuances in `reviewNotes`.
- **Quota Protocol**: If image generation encounters `429 RESOURCE_EXHAUSTED` on `gemini-3.1-flash-image` ("Nano Banana"), respect the quota reset window. Do not poll or retry in a loop.

---

## 5. Ingestion & Catalog Verification

Use `.agents/skills/fittrack-exercise-sync/scripts/save-entry.mjs` to ingest each audited exercise:
```bash
node .agents/skills/fittrack-exercise-sync/scripts/save-entry.mjs \
  --image "<path-to-generated.jpg>" \
  --data "<path-to-exercise.json>" \
  --prompt "<full-prompt>" \
  --refs "seated-cable-row-wrist-cuffs.png,<secondary-ref.png>"
```

The script automatically:
1. Re-encodes the image to standard PNG format (`89 50 4E 47` magic bytes) and calculates its SHA-256 hash.
2. Saves it to `catalog/media/<sha256>.png`.
3. Validates the exercise data against `ExerciseSchema` in `src/schema.ts`.
4. Saves `catalog/exercises/<id>.json`.
5. Updates prompt provenance in `catalog/styles/line-art-v1/generation-prompts-0.2.0.json`.

After batch ingestion:
1. Run `npm run docs:generate`.
2. Run `npm run verify` to confirm all schemas, media hashes, and catalog tests pass with 0 errors.
