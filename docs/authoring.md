# Authoring and revisions

1. Use the portable authoring skill and fixed original style references. Specify the exact exercise variant and document uncertain equipment details.
2. Draft the JSON entry against `/v1/schema` or `src/schema.ts`. Stable exercise IDs are slugs; keep an existing ID when correcting it. A substantially different movement or equipment variant gets its own ID.
3. Generate original paired-position PNG artwork. Record the exact prompt in the style's generation-prompts file; preserve an existing prompt's history when revising its image. Record the generation method and date. Use null for model identifiers the generator did not expose.
4. Name the PNG with its lowercase SHA-256 digest and set `illustration.mediaId` and its `/media/<digest>.png` URL. Never overwrite a different image at an existing digest path. Keep original style reference images frozen.
5. Leave `reviewStatus` as draft and `reviewedAt` as null until a maintainer has reviewed technique and the exact equipment assumptions. A reviewed entry requires an actual review timestamp. Document substantive corrections and retain sources with an honest scope.
6. Increment the record revision for each accepted change. Before a dataset release, bump `catalogVersion` (independent of the API path version). Git tags can preserve complete older catalog snapshots; the API serves the snapshot currently checked out and loaded at startup, not a historical-revision database.
7. Run `npm run verify`. The loader rejects malformed records, missing images and incorrect content hashes. Tests exercise search, filters, pagination, immutable media, caching and read-only behavior.

Logging conventions belong to each equipment variant. A per-dumbbell value, total barbell mass, added plate mass and per-stack value are different quantities. Do not infer conversions for a consumer's historic data. There is no program prescription in this catalog: sets, reps and actual training loads belong to the consumer.

The optional prompt composer accepts JSON on stdin with `name`, `camera`, `equipment`, `positionA`, `positionB`, `mechanics`, optional `avoid` and an optional allowlisted reference filename. It returns the full prompt and absolute reference paths without invoking an image model. It runs standalone with Node and no npm dependencies, including from an installed skill.
