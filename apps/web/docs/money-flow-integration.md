# Money Flow Integration — Architecture (design only, not implemented)

**Status: this document describes a future integration. No code in this
repo implements token exchange, and `Hen-Heang/money-flow` has not been
touched.** This phase implements only: this document, a typed summary
contract, and (separately, feature-flagged) a mocked integration card with a
deep link — see "What this phase actually ships" at the bottom.

## Why a separate integration, not a merge

Hengo (this repo, Supabase project `dnzqgnejwyucenghugrb`) and Money Flow
(`Hen-Heang/money-flow`, its own Supabase project — confirmed as a distinct
project named `money-flow`, id `lqjjabfmaweztxkvfrsq`, in the same
organization but not the same database) are separate products with separate
users, separate auth, and separate data-ownership responsibilities. Money
Flow remains the sole source of truth for financial data. Hengo only ever
*displays a read-only summary* of progress toward a financial key result and
sends the user back to Money Flow to change anything.

## Proposed Money Flow endpoint (to be built in the Money Flow repo, not here)

```
GET /api/integrations/hengo/summary
Authorization: Bearer <hengo-issued access token, exchanged per below>
```

Response (typed contract Hengo will consume — defined once on the Money Flow
side, mirrored here for Hengo's client-side type):

```ts
export interface MoneyFlowSummary {
  reportingPeriod: { start: string; end: string } // ISO dates
  transactionTrackingDays: number
  budgetHealthStatus: "on_track" | "attention" | "over_budget"
  budgetsWithinLimit: number
  totalBudgetCount: number
  monthlySavingRate: number // percentage, e.g. 0.18 = 18%
  savingsGoals: Array<{
    name: string
    externalId: string
    progressPercentage: number
  }>
  generatedAt: string // ISO timestamp
}
```

**Explicitly excluded from this response, by design**: raw transactions,
merchant descriptions, payment methods, account details/numbers, private
notes, or anything below the "summary" level. If a field isn't in the shape
above, Money Flow must not return it to this endpoint, and Hengo must not
ask for it.

## Authentication design

1. **One-time connection code.** The user initiates the connection from
   Money Flow's UI (not Hengo's — Hengo never asks for Money Flow
   credentials), which generates a short-lived, single-use code.
2. **Server-side token exchange.** The user pastes/deep-links the code into
   Hengo; a Hengo server route (`app/api/integrations/money-flow/connect`,
   not yet built) exchanges the code for an access token by calling Money
   Flow's token endpoint server-to-server. The browser never sees Money
   Flow's token directly.
3. **Revocable access token**, scoped narrowly — see below.
4. **Scope: `finance.summary.read`** — nothing else. No write scope should
   ever be requested from Hengo.
5. **Encrypted server-side token storage** — see "What this phase actually
   ships": the encryption infrastructure this requires does not exist yet in
   this repo, so no real token is stored until it does (see below).
6. **Disconnect action** — a Hengo settings action that calls Money Flow's
   revoke endpoint and deletes the local `kori_external_connections` row.
7. **Audit timestamps** — `connected_at`, `last_synced_at`, `last_error_at`
   on every connection row (see schema below), so support/debugging never
   requires looking at the token itself.

### Never

- Expose a service-role key (Hengo's or Money Flow's) anywhere client-side.
- Put a cross-project secret in browser code.
- Query Money Flow's Supabase project directly from Hengo's browser client —
  all access goes through Money Flow's own HTTP API, server-to-server from
  Hengo's Next.js route handlers (same pattern as `lib/server/ai.ts`'s
  `requireUser` — server-only secrets, RLS/scoped tokens, never a service
  key shipped to the client).
- Match accounts by email alone — see `docs/account-reconciliation-plan.md`
  for why identity matching by email is unreliable even *within* this one
  project; matching *across* two separate Supabase projects by email would
  be strictly worse and is explicitly rejected as a linking strategy. The
  one-time connection code (step 1) is the only supported linking mechanism.
- Copy raw financial records into Hengo's database, ever.

## Hengo integration table (design — not yet migrated)

```sql
create table public.kori_external_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('money_flow')),
  external_user_id text not null,
  scopes text[] not null default '{}',
  encrypted_access_token text, -- see "stop before storing real tokens" below
  status text not null default 'pending' check (status in ('pending', 'connected', 'revoked', 'error')),
  connected_at timestamptz,
  last_synced_at timestamptz,
  last_error_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);
-- RLS: user_id = auth.uid(), same pattern as goal_key_results/goal_evidence/goal_reviews.
```

This table is **not created in this phase** — it's specified here so the
shape is agreed before any token ever needs to be stored (see next section
for why).

## Stop-before-storing-real-tokens requirement

Per the task's explicit instruction: **this repo does not yet have secure
server-side encryption infrastructure** (no KMS/envelope-encryption setup,
no secrets-management layer beyond plain environment variables for
`OPENAI_API_KEY`/Supabase keys). Storing a real Money Flow access token in
`encrypted_access_token` as a plain column value — even "encrypted" with an
ad-hoc scheme — would be worse than not integrating at all, since a
compromised database dump would leak a live financial-data access token.

**Before any real token exchange is implemented**: stand up either (a)
Supabase Vault (native `pgsodium`-backed secret storage, already available
in Supabase projects) or (b) an external KMS (e.g. cloud provider KMS) with
envelope encryption, and only then implement step 2 of the auth flow above.
This document stops here by design — no token cryptography is implemented
in this pass.

## Hengo finance key result (once connected)

A financial key result (`goal_key_results` row, see
`docs/goal-system-v2-audit.md`) can reference the integration:

```ts
{
  metric_type: "external",
  data_source: "external_integration",
  source_config: {
    provider: "money_flow",
    metric: "savings_goal_progress",
    externalGoalId: "<Money Flow savings goal id>",
    targetPercentage: 100,
  },
}
```

Hengo displays `current_value`/`target_value` (synced from
`MoneyFlowSummary.savingsGoals[].progressPercentage`, once a real sync job
exists) but every "modify this" action deep-links to Money Flow — Hengo
never offers to edit financial data itself.

## What this phase actually ships

1. This document.
2. A typed summary contract: `MoneyFlowSummary` (`lib/money-flow.ts`) — matches
   the shape above exactly, plus `MOCK_MONEY_FLOW_SUMMARY`, a static example
   value. Not wired to any real fetch — no `GET` call to Money Flow exists
   anywhere in this codebase.
3. **Shipped**: `components/goals/MoneyFlowIntegrationCard.tsx` — always
   renders `MOCK_MONEY_FLOW_SUMMARY`, clearly labeled "Preview — example
   data" with an explicit disclaimer that Money Flow isn't connected. Gated
   by `lib/feature-flags.ts`'s `isMoneyFlowIntegrationEnabled()`
   (`NEXT_PUBLIC_FEATURE_MONEY_FLOW=true`, off by default) and rendered only
   on finance/financial-type goals (`app/(main)/goals/[id]/page.tsx`,
   Overview tab). Its "Open Money Flow" deep link uses
   `NEXT_PUBLIC_MONEY_FLOW_URL` if set; otherwise it shows instructional text
   instead of guessing at a URL. No connect/disconnect controls are rendered
   — there is nothing real to connect or disconnect yet, and a fake button
   that does nothing would be misleading.
4. **Not shipped, ever, without a follow-up decision**: production token
   exchange, real Money Flow API calls, the `kori_external_connections`
   table (still just a design in this doc — no migration exists for it), or
   any write path back to Money Flow.
