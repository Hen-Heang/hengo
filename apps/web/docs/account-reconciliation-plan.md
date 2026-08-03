# Account Reconciliation Plan

**Status: documentation only. No ownership has been modified, merged, or
migrated as part of this document or the Goal System v2 work.**

## Finding (verified against the live "hengo" Supabase project, 2026-07-23)

The `goals`/`tasks` domain (Orbit's original tables, shared with this
project — see `docs/goal-system-v2-audit.md` §1) and the `kori_*` domain
(KoriAI/Hengo's own Korean-learning tables) are scoped by the same
`auth.users` identity system, but **do not always overlap**:

```sql
select gm.user_id, count(*) as memberships,
  exists(select 1 from kori_profiles kp where kp.id = gm.user_id) as has_kori_profile,
  exists(select 1 from auth.users u where u.id = gm.user_id) as has_auth_user
from goal_members gm
group by gm.user_id;
```

Result:

| user_id (truncated) | memberships | has_kori_profile | has_auth_user |
|---|---|---|---|
| `ac5db382-...` | 6 | **true** | true |
| `8586e909-...` | 2 | **false** | true |

- `ac5db382-...` is the primary, active user: owns all 6 `goals` rows, all
  115 `tasks` rows, all 927 `kori_vocab_cards` rows, all 1,496
  `kori_activity_log` rows, and has a `kori_profiles` row. Their goal and
  learning data are fully consistent with each other — **no conflict on the
  primary user's own data**.
- `8586e909-...` exists in `auth.users` (a real, valid Supabase identity) and
  is a member on 2 goals (via `goal_members`, likely from an invite/share
  flow), but has **no `kori_profiles` row** — this identity has never used
  any KoriAI/Hengo Korean-learning feature. It is either a leftover from
  Orbit's original multi-user goal-sharing product, a test/secondary account
  of the same person, or a genuinely different person who was invited to
  collaborate on a goal before this repo pivoted to being a single-user
  Korean-learning app.

This is the concrete shape of "goals and Korean-learning data may belong to
different identities": not corrupted or duplicated data on one person, but a
second, narrower identity attached only to the shared-goal domain.

## Affected tables

| Table | Relationship to identity |
|---|---|
| `goals` | `user_id` (owner) |
| `goal_members` | `user_id` (member, any role) — **the only table where the second identity appears** |
| `goal_stars` | `user_id` |
| `tasks` | `user_id` (creator), `updated_by` (nullable, last editor) |
| `notifications` | `sender_id`, `receiver_id` |
| `kori_profiles` and all other `kori_*` tables | `user_id` / `id` — **the second identity has zero rows in any of these** |
| New: `goal_key_results`, `goal_evidence`, `goal_reviews` | `user_id` (RLS-scoped) — inherit the same identity model, no new conflict introduced |

## Foreign-key dependencies

`goals.id` ← `tasks.goal_id`, `goal_members.goal_id`, `goal_stars.goal_id`,
`notifications.goal_id`, and (new) `goal_key_results.goal_id`,
`goal_evidence.goal_id`, `goal_reviews.goal_id`. `goal_key_results.id` ←
`goal_evidence.key_result_id` (nullable), `tasks.key_result_id` (nullable).
`auth.users.id` is the root of every `user_id`/`sender_id`/`receiver_id`/
`updated_by` column above (all `on delete cascade` except `tasks.updated_by`
and `goal_evidence.key_result_id`/`tasks.key_result_id`, which are `on
delete set null`).

## RLS implications

Every table's RLS already scopes strictly by `auth.uid()` (owner) or, for
`goals`/`tasks`, by `goal_members` membership — **this is correct and safe
as-is**. The second identity (`8586e909-...`) can only ever see the 2 goals
it's a member of, nothing else; it has no path to any `kori_*` row (RLS
there is `user_id = auth.uid()` with no membership concept at all). No RLS
change is needed to "fix" this — the isolation is already working exactly as
designed. The only open question is a product/data one: should that second
identity's membership be removed, kept, or merged into the primary identity.

## Conflict resolution options (not executed)

1. **Do nothing.** The second identity's access is already correctly scoped
   and harmless — it can see 2 goals it was legitimately invited to. If it's
   a real second person, this is expected collaboration behavior, not a bug.
2. **Remove the stale membership** (`delete from goal_members where user_id =
   '8586e909-...'`) if it's confirmed to be a dead/orphaned invite with no
   real second person behind it.
3. **Merge into the primary identity** (re-point `goal_members.user_id`,
   `notifications.sender_id/receiver_id` for that identity to
   `ac5db382-...`) only if it's confirmed to be the *same human* using two
   Supabase accounts (e.g., an old email vs. a new one) — this is the
   highest-risk option and should only be done after direct confirmation
   from the account owner, never inferred from data alone.

**Recommendation: do not act without the user first confirming, out of band,
whether `8586e909-...` represents themselves (old account) or someone else
(real invited collaborator).** Email-only matching is explicitly out — per
the constraint below — because Supabase auth allows multiple accounts to
share metadata that looks similar without being the same legal person.

## Backup requirement (before any resolution is executed)

Before running option 2 or 3, snapshot every affected row:

```sql
create table if not exists _reconciliation_backup_goal_members as
  select * from goal_members where user_id = '8586e909-...';
create table if not exists _reconciliation_backup_notifications as
  select * from notifications where sender_id = '8586e909-...' or receiver_id = '8586e909-...';
```

Drop these backup tables only after the resolution has been verified stable
for at least one full review cycle.

## Dry-run SQL (read-only — safe to run any time)

```sql
-- Confirm the full blast radius before touching anything.
select 'goal_members' as tbl, count(*) from goal_members where user_id = '8586e909-...'
union all
select 'notifications', count(*) from notifications
  where sender_id = '8586e909-...' or receiver_id = '8586e909-...';

-- Which goals would be affected by removing/merging this identity's membership.
select g.id, g.title, g.user_id as owner_id
from goals g
join goal_members gm on gm.goal_id = g.id
where gm.user_id = '8586e909-...';
```

## Validation queries (run after any resolution)

```sql
-- No orphaned goal_members rows pointing at a non-existent auth user.
select gm.* from goal_members gm
  left join auth.users u on u.id = gm.user_id
  where u.id is null;

-- No notifications referencing a removed identity.
select n.* from notifications n
  left join auth.users u on u.id = n.sender_id
  where u.id is null;

-- RLS still isolates correctly: the remaining identities on each goal match
-- goal_members exactly (no privilege left over from a stale row).
select goal_id, count(*) as member_count from goal_members group by goal_id;
```

## Rollback strategy

Every resolution option above is reversible from the backup tables created
in the "Backup requirement" step:

```sql
insert into goal_members select * from _reconciliation_backup_goal_members;
insert into notifications select * from _reconciliation_backup_notifications;
```

No `auth.users` row itself is ever deleted or modified by any option above —
only `goal_members`/`notifications` rows referencing it — so the identity
itself (and its ability to log in) is never at risk from this reconciliation
work regardless of which option is chosen.

## What this document does not include

No real access tokens, password data, or private keys — the only identifiers
above are Supabase `auth.users` UUIDs, which are not secret and are already
visible to any authenticated caller through normal RLS-scoped queries.
