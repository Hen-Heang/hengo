# Core Korean 300

Core Korean 300 is Hengo's curated vocabulary foundation for Korean that is useful in daily life, at work, and in software development.

It is intentionally a **coverage layer over the learner's existing vocabulary**, not a replacement deck. A saved card counts toward Core Korean coverage when its normalized Korean `term` matches a Core 300 term, even when the card was created before the Core 300 taxonomy existed.

## Curriculum shape

| Group | Count | Default level |
| --- | ---: | --- |
| Essential verbs | 60 | A1 |
| Descriptive verbs | 40 | A1 |
| Daily-life nouns | 60 | A1 |
| Function/question/adverb words | 30 | A1 |
| Numbers, time, and counters | 30 | A1 |
| Workplace Korean | 40 | A2 |
| Developer Korean | 40 | A2 |
| **Total** | **300** | |

The authored source of truth is `lib/core-korean-vocab.ts`.

## Tag taxonomy

New Core Korean cards are added with existing `kori_vocab_cards.tags`; no schema change is needed.

Every new card includes:

- `core`
- `core:300`
- `level:a1` or `level:a2`
- one `topic:*` tag
- one `pos:*` tag

Examples:

```text
회의
core
core:300
level:a2
topic:workplace
pos:noun
```

```text
구현하다
core
core:300
level:a2
topic:developer
pos:verb
```

The existing vocabulary search already includes tags, so learners can find Core Korean material with searches such as `core`, `topic:developer`, or `level:a1`.

## Import behavior

The `/vocab` page shows current Core 300 coverage and offers an explicit **Add next 20** action.

The batch size is deliberately small. Core Korean should become part of the learner's normal spaced-repetition system without suddenly creating a very large review backlog.

Before each insert, the client API re-reads the learner's current saved terms and inserts only terms that are still missing. Existing matching cards are never overwritten.

New cards use the existing SRS defaults in `kori_vocab_cards`, so after insertion they participate in the same review flow as every other vocabulary card.

## Existing data audit

At implementation time, the live Hengo Supabase project contained 1,033 vocabulary rows. Comparing the curated Core 300 list against those saved terms showed:

- 103 of 300 Core Korean terms already represented
- 197 terms missing
- 17 Core Korean terms represented by more than one existing row
- 120 existing rows matching a Core Korean term in total
- average best mastery of already-covered Core Korean terms: 31.5%

These values are an audit snapshot, not runtime constants. The UI calculates current coverage from the learner's loaded vocabulary every time.

## Duplicate policy

This feature does **not** automatically delete or merge duplicate vocabulary rows.

That is intentional because duplicate cards may have different:

- SRS intervals
- mastery
- repetitions
- examples
- categories
- personal edits

For coverage display only, duplicate rows for the same normalized Core Korean term count once. The strongest matching card is used for the displayed mastery calculation.

A future cleanup tool should present duplicate candidates for explicit review and preserve the best learning history instead of deleting rows blindly.

## Database impact

No migration is required.

This feature reuses:

```text
kori_vocab_cards
├── category
├── term
├── meaning
├── pronunciation
├── difficulty_level
├── tags
└── existing SRS fields
```

The implementation does not mutate production data until the authenticated learner explicitly presses **Add next 20** in the Vocabulary screen.

## Product principle

Core Korean 300 should answer:

> Which foundational words should I actually know for living and working in Korea?

It should not become another disconnected vocabulary feature. Imported Core Korean cards feed the existing Hengo loop:

```text
Core Korean
→ Vocabulary SRS
→ Practice
→ Speaking / listening context
→ Corrections
→ Future review
```
