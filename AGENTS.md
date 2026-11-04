# Exercise Atlas

This is a public exercise catalog and read-only API. Consumer app integrations are separate work; no changes to FitTrack are part of catalog maintenance.

Use Node 24.12 or later in the 24.x line. Run `npm ci`, then `npm run verify`. Start locally with `npm start`; the default listener is `127.0.0.1:4317`. There is no public deployment in this repository.

Exercise records live in `catalog/exercises/`, images in `catalog/media/`, and the catalog version in `catalog/manifest.json`. Validate records with the shared Zod schema and media checksums. Keep exercise IDs stable; increment an entry revision for content changes and the catalog version for a published catalog release. Do not silently change load conventions or substitute a related movement for a precise variant.

For authoring or illustration work, use `.agents/skills/exercise-atlas-authoring/SKILL.md`. Keep original style references unchanged; create a new style version for intentional visual changes. New entries stay drafts until technique and equipment assumptions are reviewed. Preserve provenance and state what a source actually supports.

Follow LICENSE for reuse and CONTRIBUTING.md before merging outside contributions. Changes to license terms require explicit owner direction. Do not commit secrets, personal workout history or copied third-party artwork.
