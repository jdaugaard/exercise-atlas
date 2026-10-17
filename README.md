# Exercise Atlas

A small, curated exercise catalog with original black-and-white illustrations, reusable authoring instructions and a read-only HTTP API. It starts with five complete draft examples:

- Decline Dumbbell Bench Press
- Barbell Romanian Deadlift
- Machine Hip Thrust
- Dumbbell Lateral Raise
- Seated Cable Row with Wrist Cuffs

Every entry includes English and Danish names, aliases, muscle roles, equipment, setup, movement instructions, cues, mistakes, alternatives, load-logging conventions, source scope and illustration provenance. The wrist-cuff example assumes two independent low cables; the machine example is a generic schematic. All five need technique and equipment review. The illustrations are approved as a visual direction, not validated demonstrations.

This repository is private. No open-source license has been selected, no service is publicly deployed, and FitTrack is unchanged.

Browse the [five illustrated examples](docs/examples.md). The canonical, editable data remains in `catalog/exercises/`; run `npm run docs:generate` after changing entries to refresh the readable preview.

## Run locally

Requires Node 24.12+ within Node 24.x and npm. TypeScript runs using Node's built-in type stripping; type checking is a separate verification step.

```sh
npm ci
npm run verify
npm start
```

The API listens at `http://127.0.0.1:4317`. `HOST` and `PORT` override the address. Binding to a non-loopback address exposes this unauthenticated API on that network; the default is local only. It needs no database, account, image-generation key or live provider connection to serve the saved catalog.

```sh
curl http://127.0.0.1:4317/v1/exercises
curl 'http://127.0.0.1:4317/v1/exercises?q=cuffs'
curl 'http://127.0.0.1:4317/v1/exercises?status=reviewed'
curl http://127.0.0.1:4317/v1/exercises/barbell-romanian-deadlift
```

In Windows PowerShell, use `curl.exe` or `Invoke-RestMethod`.

## API

All endpoints accept GET and HEAD. Other methods receive 405. No endpoint modifies data.

| Path | Response |
| --- | --- |
| `/` | Service version and endpoint links |
| `/health` | Readiness and loaded exercise count |
| `/v1/catalog` | Dataset version, licensing state and review counts |
| `/v1/exercises` | Searchable, filtered, paginated exercises |
| `/v1/exercises/{id}` | One entry with its revision |
| `/v1/taxonomy` | Available muscles, equipment, body parts and labels |
| `/v1/schema` | JSON Schema for one exercise |
| `/media/{sha256}.png` | Original illustration with immutable caching |

Search parameters: `q` searches names, aliases, Danish names, descriptions, muscle names, body parts and equipment; `muscle` and `equipment` are exact taxonomy values, case-insensitive; `difficulty` is Beginner, Intermediate or Advanced; `status` is draft, reviewed or retired. `limit` defaults to 20 and accepts 1-100; `offset` defaults to 0. Results are ordered by English name. Filters combine with AND. Unknown/repeated parameters and invalid pagination return 400. A valid filter with no matches returns an empty list.

List responses contain `catalogVersion`, `total`, `limit`, `offset`, `nextOffset` and `data`. Details return `catalogVersion` and `data`. Errors use `{ "error": { "code": "...", "message": "..." } }`. Drafts are included by default so the initial examples are inspectable; consumers can request `status=reviewed` (initially empty). Muscle roles are qualitative, not activation scores. JSON responses support ETag revalidation; checksum-named PNGs can be cached immutably. Media URLs are relative to this API's origin.

## Consistent authoring

The reusable skill is [Exercise Atlas Authoring](.agents/skills/exercise-atlas-authoring/SKILL.md). It contains the original five style references, their hashes, a fixed base prompt, JSON Schema, an example entry and a prompt composer. Codex can discover it while working in this repo. To install a self-contained copy for use in other repos:

```sh
npm run skill:install
```

Invoke `$exercise-atlas-authoring` and describe the exercise and exact equipment variant. The installer uses `$CODEX_HOME/skills` or `~/.codex/skills` and refuses to overwrite an existing skill. After updating the repo's skill, review and update the installed copy deliberately. Restart/reload skill discovery if the client has not yet picked it up.

Approved style: faceless figure, black shorts, white background, clear black contours, sparse gray equipment and two distinct positions. Each new image uses the original references, not an accumulating chain of new outputs. Prompting helps consistency; visual review remains necessary. `line-art-v1` references are frozen. A deliberately different look gets a new style version.

See [authoring and revisions](docs/authoring.md) and [future consumer integration](docs/consumer-integration.md).

## Repository layout

```text
catalog/exercises/                 One JSON file per stable exercise ID
catalog/media/                     PNGs named by SHA-256
catalog/styles/line-art-v1/         Frozen style manifest and original prompts
.agents/skills/exercise-atlas-authoring/  Portable authoring workflow
src/                               Shared schemas, catalog loader and HTTP API
test/                              API and catalog integrity checks
```

## Publication and licensing

Code, dataset and illustrations are currently `UNLICENSED`; the private repository is not an open-source release. Decide their licenses explicitly before publication. Sources are cited for factual checking; external source text, logos and artwork are not redistributed. The five PNGs are original AI-generated drafts, and the actual generator model identifier was not exposed, so provenance records it as null. The repo contains no user programs, sessions or training history.
