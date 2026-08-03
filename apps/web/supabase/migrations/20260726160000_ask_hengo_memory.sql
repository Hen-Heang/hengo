-- Second Brain, Phase 5: Ask Hengo — AI-assisted personal memory.
--
-- kori_memory_candidates holds facts the AI *proposes* about the user while
-- answering a question (e.g. "prefers concise code review feedback") — it is
-- never written as trusted automatically. Only rows the user explicitly
-- approves (status = 'approved') are fed back into a future Ask Hengo prompt
-- as known context; 'proposed' rows sit in a review queue on /ask-hengo/memories,
-- and 'rejected'/'archived' are kept (never hard-deleted by the app) so the
-- audit trail of what the AI has ever proposed stays visible to the user.
--
-- No FTS column here — this table is always small per user (a personal fact
-- list, not a document store) and every read either filters by status or
-- fetches the whole approved set, so a plain index on (user_id, status) is
-- enough.

create table if not exists public.kori_memory_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fact text not null check (char_length(fact) between 1 and 500),
  category text not null default 'fact' check (char_length(category) <= 50),
  source_type text not null check (source_type in ('note', 'inbox_item', 'journal', 'conversation', 'manual')),
  source_id uuid,
  confidence real not null default 0.5 check (confidence >= 0 and confidence <= 1),
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'rejected', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kori_memory_candidates_user_status_idx
  on public.kori_memory_candidates (user_id, status, created_at desc);

alter table public.kori_memory_candidates enable row level security;
revoke all on table public.kori_memory_candidates from anon;
grant select, insert, update, delete on table public.kori_memory_candidates to authenticated;

drop policy if exists "own memory candidates" on public.kori_memory_candidates;
create policy "own memory candidates" on public.kori_memory_candidates
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
