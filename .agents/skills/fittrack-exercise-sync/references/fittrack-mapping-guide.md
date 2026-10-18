# FitTrack Exercise Mapping Guide

Reference rules for reconciling FitTrack MCP catalog entries with Exercise Atlas.

---

## 1. Logging Convention Rules

FitTrack tracks load in multiple ways depending on equipment. Exercise Atlas requires explicit qualitative `logging` metadata:

| Equipment Category | Exercise Atlas `logging.basis` | Example Note |
|---|---|---|
| **Dumbbells** | `per_dumbbell` | Record mass of an individual dumbbell rather than combined total pair weight. |
| **Barbell / Trap Bar** | `total_barbell_mass` | Record combined mass including barbell/trap bar frame and all loaded plates. |
| **Selectorized / Pin Machine** | `selected_machine_load` | Record the selected stack pin or plate load without assuming 1:1 free-weight equivalency. |
| **Cable Pulley** | `selected_stack_load` | Record the selected pin on that specific cable tower; include attachment and pulley setting. |
| **Bodyweight** | `bodyweight_only` | Bodyweight exercise with no external load. |
| **Weighted Bodyweight** | `added_external_load` | Record additional external load (e.g. weight belt or vest) above bodyweight. |

---

## 2. Style Reference Anchor Selection Matrix

Every prompt requires `seated-cable-row-wrist-cuffs.png` plus the closest allowlisted secondary reference from `style-manifest.json`:

| Exercise Category / Setup | Secondary Reference File | Reason |
|---|---|---|
| **Standing DB / Barbell Upper Body** | `dumbbell-lateral-raise.png` | Standing posture, arm abduction/flexion, shoe scale. |
| **Hinges / Deadlifts / Rows** | `barbell-romanian-deadlift.png` | Hip hinge depth, neutral spine angle, plate clearance. |
| **Machines / Levers / Guided Arcs** | `machine-hip-thrust.png` | Commercial machine frame lines, pivot levers, minimal gray fill. |
| **Benches / Supine / Incline / Decline** | `decline-dumbbell-bench-press.png` | Bench frame geometry, flat/inclined torso support, arm pressing path. |
| **Cables / Cuffs / Towers** | `seated-cable-row-wrist-cuffs.png` | Canonical anchor for pulleys, cables, D-rings, relaxed/active grips. |

---

## 3. Ambiguous FitTrack Names Resolution

FitTrack often imports movements from coach logs (e.g. TrueCoach) with informal names:

- **"Triceps Extension" (with `equipment: null`)**: Inspect source video or coach notes. If unspecified, map canonically to overhead dumbbell extension or suspension trainer, and record the explicit equipment assumption in `variantNote` and `reviewNotes`.
- **"Spider Curl"**: Prone chest-supported curl on an incline bench (~45°). Do not confuse with preacher curl.
- **"Lat Pulldown"**: Distinguish wide-grip bilateral cable pulldown from seated machine pulldown or unilateral variants.
- **"Seated Row"**: Differentiate close-grip cable row from chest-supported machine row or cuff row.
- **"Cuff Variations"**: Explicitly document D-ring attachment points, cable paths, and relaxed hand grips in `variantNote`.

---

## 4. Danish Naming Conventions (`nameDa`)

Exercise Atlas maintains full Danish naming for all movements:
- Curls: `Bicepscurl med håndvægte`, `Stående bicepscurl med vægtstang`, `Preachercurl i maskine`.
- Presses: `Bænkpres med håndvægte`, `Skrå brystpres i maskine`, `Stående skulderpres med vægtstang`.
- Rows: `Foroverbøjet roning med vægtstang`, `Siddende kabelroning med håndtag`.
- Deadlifts: `Rumænsk dødløft med håndvægte`, `Trap-bar dødløft`, `Konventionelt dødløft med vægtstang`.
- Flies: `Flyes med håndvægte på flad bænk`, `Enarms kabel-flyes til bagskulder`, `Pec deck`.
