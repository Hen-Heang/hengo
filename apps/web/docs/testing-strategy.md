# Testing strategy

## Commands

```bash
pnpm test                                  # vitest run (all levels)
npx vitest run lib/task-status.test.ts     # one file
pnpm lint
pnpm build
```

If `pnpm` is unavailable, the same binaries work directly:
`node_modules/.bin/vitest run`, `node_modules/.bin/eslint .`,
`node_modules/.bin/next build`.

## Layout

Tests are **colocated with the code they cover** — `lib/foo.ts` →
`lib/foo.test.ts`, `components/x/Y.tsx` → `components/x/Y.test.tsx`. There is no
`tests/` tree, and new tests should follow the existing convention rather than
introduce a parallel hierarchy.

There is one Vitest project (`vitest.config.ts`) with the `@` path alias. There
is no global setup file: component tests opt into jsdom per file with a
docblock, which keeps the ~500 pure unit tests running in the fast Node
environment.

```ts
/** @vitest-environment jsdom */
```

## The three levels in use

| Level | Environment | What belongs here | Example |
| --- | --- | --- | --- |
| **Unit** | node | Pure domain functions — status derivation, filtering, sorting, recurrence, progress, capacity | `lib/task-status.test.ts` |
| **Component** | jsdom + Testing Library | That the UI renders the *business state* it was given | `components/goals/detail/tasks/GoalTaskRow.test.tsx` |
| **Integration** | node + in-memory Supabase fake | Mutation payload shape, the status/completed dual-write, error propagation | `lib/api/goals-tasks.test.ts` |

E2E (Playwright) is a dependency but **no specs exist yet**. See the audit doc.

## Rules

**Determinism.** Business logic must never read the real clock. Every domain
function takes `todayYmd` (an Asia/Seoul civil date) as a parameter — keep it
that way rather than reaching for fake timers. When a test does need an instant,
pass an explicit `new Date("...Z")`.

**Assert semantics, not presentation.** Compare civil dates
(`"2026-07-24"`), `aria-pressed`, and visible text — never localized display
strings, and never a snapshot in place of a meaningful assertion.

**Test both responsive variants.** `GoalTaskRow` renders `card` (mobile) and
`row` (desktop). Anything status-bearing must be asserted for both, via
`it.each(["card", "row"] as const)`. Mobile must never hide a critical status
such as Blocked or Overdue.

**Characterisation tests are labelled.** Where behaviour is known to be
internally inconsistent but changing it is a product decision, pin it with a
test that says so in a comment and points at the audit doc. Do not let a reader
mistake a pinned quirk for an endorsed rule.

**Regression discipline.** For every bug fixed: write the test, *watch it fail
against the unfixed code*, then fix. A regression test that was never observed
to fail proves nothing.

## Database safety

Never point tests at production. Integration tests replace `@/lib/supabase`
with an in-memory fake via `vi.mock` **before** importing the module under test,
so no network client is constructed.

Any test that could write must call the guard, as
`lib/api/goals-tasks.test.ts` does:

```ts
assertNoLiveDatabase() // throws unless localhost or SUPABASE_TEST_PROJECT=true
```

Never disable RLS or weaken an authorization rule to make a test pass.

## Factories

Each test file defines a local `task(overrides)` / `goal(overrides)` factory
with a monotonic `seq` for deterministic ids and no random values. Keep them
local until a third file needs the same one; then lift it to a shared module
rather than copying it a third time.
