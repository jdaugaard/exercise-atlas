---
name: exercise-atlas-authoring
description: "Create or revise Exercise Atlas entries and matching black-and-white line-art-v1 exercise illustrations using approved original references. Use for this catalog's exercise descriptions, muscle roles, equipment variants and illustration style; not unrelated artwork or workout programming."
---

# Exercise Atlas authoring

Create source-backed exercise entries and original paired-position illustrations in the established `line-art-v1` style. The supplied references approve the visual style only; their technique and machine details still require review.

## Use the original style every time

Read [the style guide](references/style-guide.md), then visually inspect `assets/references/seated-cable-row-wrist-cuffs.png` and the closest exercise reference listed in `assets/style-manifest.json`. Use these original files as image-generation references. Avoid repeatedly using newly generated outputs as the only reference, which can gradually change the style.

Keep the exact visual specification in `assets/prompt-base.txt`. Combine it with exercise-specific mechanics. The optional `scripts/compose-prompt.mjs` accepts a JSON brief on stdin and outputs the assembled prompt and reference paths; it makes no image API calls.

When an image-generation tool is available, use the environment's image-generation workflow and supply these references as style references, not edit targets. Do not substitute a different paid generation path without the user's authorization. If generation is unavailable, deliver the prepared brief and identify the missing capability.

## Author the movement precisely

Use `assets/exercise.schema.json` for the data structure; `assets/example-exercise.json` shows a complete draft. When working in the repository, edit `catalog/exercises/<stable-id>.json`. Keep existing IDs stable and increment the revision when an entry changes.

Separate primary movers, assisting muscles and stabilizers. Do not invent activation percentages or imply that a general exercise source validates a cuff adaptation or exact machine model. Write original descriptions and retain source URLs and their actual scope. Distinguish close alternatives from identical variants.

Specify cuff placement, cable count, machine type, grip, pose and load convention. State material assumptions in `variantNote` and `reviewNotes`; ask only if the unknown detail prevents a useful draft. Leave new entries at `reviewStatus: draft` and `reviewedAt: null`. Style approval alone is not permission to mark technique reviewed.

## Check and save

Compare both generated poses against the original references and the mechanical checks in the style guide. Make a targeted correction for meaningful problems. Label unresolved geometry as a draft; never claim visual inspection proves exercise safety or mechanical validation.

In the repo, save PNGs under their SHA-256 filenames in `catalog/media/`, set the matching `/media/<sha256>.png` URL, record the prompt and generation provenance, and run `npm run verify`. Use `null` for an unknown model identifier. Do not invent one.

Keep `line-art-v1` references immutable. A requested style change should receive a new style ID with its own references. When using the installed skill outside the repo, save only to the user's requested destination and provide the entry, illustration and provenance for later import. Do not create a service, deploy, publish, change repository visibility or update a consumer app unless that action is part of the user's request.
