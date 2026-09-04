# HANDOFF

Read this file first in any new session, before exploring the repo. It is a
live snapshot, not a log — overwrite it as state changes. Older context lives
in `HANDOFF_HISTORY.md`; only open that file if you need history older than
what's summarized below.

## Snapshot

- **Updated:** 2026-09-04
- **Branch:** `main` (aligned with `origin/main` before the handoff edits)
- **Last commit:** b232872 — Merge pull request #17 from Hen-Heang/feat/core-korean-300

## Current focus

**Account-specific Korean pattern practice was added to the live Hengo
Supabase project** (`dnzqgnejwyucenghugrb`) for `henheang15@gmail.com`
(`auth.users.id = 31dec390-4b91-4516-bcc0-a0f5f9045217`). No schema or
application-code change was needed because the existing Phrasebook already
supports collections, cards, speaking practice, and review progress.

A pinned collection was created idempotently:

- Collection: `실전 한국어 문형 연습` / `Real-Situation Korean Patterns`
- Collection ID: `83a5152d-c4bf-4b59-99e5-2d8cf5c0e400`
- Source key: `mentor-real-situation-patterns`
- Four active, user-editable cards cover:
  - `믿기지 않을 정도로 ~`
  - `~했을 뿐이에요`
  - `~에 대해서는 잘 모르겠어요`
  - quoted clause + `~라고/다고 생각하다`

Each card uses a realistic workplace prompt, romanization, English meaning,
alternate answers, usage/register guidance, vocabulary, and recall-oriented
tags. The mentor's casual `~라고 생각하니?` is retained as a variant; the
recommended workplace answer uses polite `~라고 생각하세요?`.

## Verification

- Live Auth lookup found exactly the requested account, with a recent sign-in.
- The collection is pinned and owns exactly four active cards in positions 0–3.
- All questions are JSON objects; all answer lists are non-empty; every card has
  a recommended answer.
- `kori_phrase_collections` and `kori_phrase_cards` both have RLS enabled with
  their existing per-owner policies.
- Stable per-user source keys make the data write safe to rerun without
  duplicating the collection or cards.

## Working tree

- Only `HANDOFF.md` and `HANDOFF_HISTORY.md` were changed to record this live
  data update; the application source was not modified.

## Next steps

- The user can open `/phrasebook`, select the pinned collection, and start the
  built-in practice flow.
- Browser verification is still optional because no login password/session was
  provided; database shape, ownership, content, and RLS were verified directly.

## Notes for future sessions

- Two independent apps remain: `apps/web` uses Next.js/Supabase; `apps/api` is
  an imported backup and is not the live backend.
- V2 features hidden from navigation are not safe to delete.
- Query live Supabase before schema claims; the repository migration folder is
  not a complete live-schema ledger.
- Running jsdom suites on Node 25 requires
  `NODE_OPTIONS=--no-experimental-webstorage`.
