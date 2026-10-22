# Recall

A mobile-first memorization app for your own words. React + Vite + strict TypeScript, Tailwind CSS, Biome, and browser localStorage. No app accounts, backend, AI, or cloud sync.

## Run

Use Node 24 LTS (`nvm use` if you use nvm); supported minimums are Node 20.19 or 22.12. Then:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Production:

```sh
npm run typecheck
npm run check
npm test
npm run build
```

`dist/` is a static website deployable to any HTTPS static host. `npm run format` formats and applies safe Biome fixes. The lockfile pins the tested dependencies. Setup follows the official [Vite guide](https://vite.dev/guide/), [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite), and [Biome documentation](https://biomejs.dev/guides/getting-started/).

## What works

- Short landing page with an interactive first-letter example, due-review entry, and passage form.
- Exact original text preservation (up to 5,000 UTF-16 characters). Sentence/line chunks, word fallback, and lossless split/join boundary editing.
- Read → four clue levels → typed recall; optional pointer tracing with clear/skip controls.
- Word-level edit-distance feedback distinguishes missing, extra, and different words without cascading omissions. Both original and typed versions remain visible.
- Chunk practice followed by an optional whole-passage pass. Stage, chunk, answer draft, and reveal-assistance status persist.
- Searchable library, due filter, learned/undo, edit with reset acknowledgement, delete with confirmation, dates, and review history.
- JSON export and validated import. Imports add independent copies; existing passages are not replaced.

## Architecture

- `src/features/landing`: introduction, sample, and evidence links.
- `src/features/library`: passage editor, chunk boundaries, search, backups, and library actions.
- `src/features/practice`: guided session, feedback, and tracing pad.
- `src/features/reviews`: scheduling and due/date helpers.
- `src/components`: reusable controls and feedback.
- `src/lib`: exact text processing, sequence-aware comparison, typed storage service, validation, and unit tests.
- `src/types`: shared passage, progress, history, and versioned storage types.
- `src/App.tsx`: navigation and persistence coordination with React hooks.

## Local data and recovery

Data lives under `recall:library:v1` as `{ version: 1, items: [...] }`. Each passage has a UUID, original wording, metadata, exact chunks, timestamps, progress, next review, learned status, and history. Successfully persisted changes update the UI; write failures show a warning and do not claim success. Recall answers also keep an in-memory draft if persistence fails.

Saved in this browser on this device. Clearing browser data may remove your library. Localhost and the published site have separate storage, as do different browsers and browser profiles. Use JSON export/import to transfer data. Storage is not encrypted or synchronized.

Unreadable or unsupported data is left intact. Download the original data using the recovery controls before explicitly resetting and importing a valid backup. Storage unavailability/quota errors are surfaced. A baseline check rejects conflicting saves from another tab; reload after copying unsaved text. It is not an atomic multi-tab database; use one editing tab at a time.

Maximum library size is 500 passages; imports must be below 5 MB. The most recent 1,000 reviews per passage are retained. Imports validate version, IDs, text/chunk equality, dates, progress bounds, and history. Imported markup is rendered only as React text.

## Review defaults and comparison

Unaided **Good** advances through 1, 3, 7, 14, and 30 days, then stays at 30. **Again** keeps the current interval and is due immediately. **Hard** uses half the previously reached interval, rounded down with a one-day minimum, without advancing. Reveal-assisted **Good** uses the same earlier scheduling as Hard. Retrying immediately after seeing feedback also counts as assisted. Reading and selecting clue levels are the learning phase; the explicit Reveal controls mark assistance for the session. Ratings are self-assessments, not automated measures of memory.

Comparison normalizes Unicode to NFC, ignores capitalization and whitespace, and extracts Unicode letter/number words, treating punctuation leniently. Straight/curly apostrophes inside words are ignored for matching. Accents remain significant. Languages without word separators receive simpler run-based tokenization, not language-specific linguistic segmentation. There is no speech recognition, handwriting recognition, or drawing grading.

Kūsho tracing is optional. This app adapts exercises; it does not claim to implement a validated Japanese three-step system or guarantee retention. References: [Kūsho paper](https://doi.org/10.1111/lang.12128) and [spaced practice](https://www.retrievalpractice.org/spacing/).

## Verification

21 focused unit tests cover lossless chunking, initials, answer comparison, review scheduling, data validation, corrupted storage, capacity failure, unavailable storage, concurrent changes, and progress round trips.

Browser QA completed at 320px and 1280px (plus the default narrow preview): add → save → clues → recall → feedback → schedule → reload → recover progress → title edit → text edit/reset → delete/reload. Also checked multi-chunk and whole-passage practice, assisted review messaging, learned/undo, export/import, and due notices. The landing and feedback pages had no horizontal overflow at 320px. TypeScript, Biome, tests, and production build pass. Dependency audit reported zero vulnerabilities after updating Vitest.

## MVP limits

No offline service worker, accounts, sync, push notifications, or background reviews. Due items appear when the app opens. Tracing drawings are temporary. Unsaved new-passage/editor drafts are not retained across navigation/reload; saved practice drafts are. Browser QA is not a full screen-reader audit or physical-device test. The hosted private preview may require host-level access; the app itself has no sign-in.
