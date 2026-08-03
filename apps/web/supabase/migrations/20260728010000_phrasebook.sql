-- Korean Phrasebook & Q&A Practice System: structured Q&A collections/cards,
-- per-user SRS progress (same SM-2 shape as kori_vocab_cards/kori_corrections,
-- see lib/srs.ts), and practice attempts (transcript + validated AI feedback
-- only — no audio is ever stored). Also adds a romanization display
-- preference to kori_profiles and extends the daily-mission item_type
-- check constraint with 'phrase_review'.

create table if not exists public.kori_phrase_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_key text,
  title_ko text not null,
  title_en text not null,
  description text,
  category text not null,
  seed_version integer not null default 1,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Multiple NULLs are allowed by a unique index, so user-created collections
-- (source_key null) are unrestricted while seeded packs (source_key set)
-- are idempotent per user.
create unique index if not exists kori_phrase_collections_user_source_key_idx
  on public.kori_phrase_collections (user_id, source_key)
  where source_key is not null;

create index if not exists kori_phrase_collections_user_idx
  on public.kori_phrase_collections (user_id, created_at desc);

create table if not exists public.kori_phrase_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collection_id uuid not null references public.kori_phrase_collections(id) on delete cascade,
  source_key text,
  category text not null,
  situation text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  question jsonb not null,
  question_variants jsonb not null default '[]'::jsonb,
  answers jsonb not null,
  usage_note text check (char_length(usage_note) <= 1000),
  vocabulary jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  position integer not null default 0,
  active boolean not null default true,
  -- Set true the first time a user edits a seeded card — planSeedUpsert
  -- (lib/korean-phrasebook/seed.ts) never overwrites a card with this set.
  is_user_edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists kori_phrase_cards_user_source_key_idx
  on public.kori_phrase_cards (user_id, source_key)
  where source_key is not null;

create index if not exists kori_phrase_cards_user_collection_idx
  on public.kori_phrase_cards (user_id, collection_id);
create index if not exists kori_phrase_cards_user_category_idx
  on public.kori_phrase_cards (user_id, category);

create table if not exists public.kori_phrase_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  phrase_id uuid not null references public.kori_phrase_cards(id) on delete cascade,
  state text not null default 'new' check (state in ('new', 'learning', 'mastered')),
  repetitions integer not null default 0,
  interval_days integer not null default 0,
  ease_factor numeric not null default 2.5,
  lapses integer not null default 0,
  mastery integer not null default 0 check (mastery between 0 and 100),
  attempt_count integer not null default 0,
  successful_count integer not null default 0,
  last_grade text check (last_grade in ('AGAIN', 'HARD', 'GOOD', 'EASY')),
  last_reviewed_at timestamptz,
  next_review_at timestamptz not null default now(),
  mastered boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, phrase_id)
);

create index if not exists kori_phrase_progress_user_due_idx
  on public.kori_phrase_progress (user_id, next_review_at);

create table if not exists public.kori_phrase_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phrase_id uuid not null references public.kori_phrase_cards(id) on delete cascade,
  practice_mode text not null check (practice_mode in ('learn', 'listen', 'speak', 'review')),
  input_method text not null check (input_method in ('voice', 'text', 'manual')),
  transcript text check (char_length(transcript) <= 1000),
  feedback jsonb,
  hint_used boolean not null default false,
  transcript_revealed boolean not null default false,
  task_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists kori_phrase_attempts_user_created_idx
  on public.kori_phrase_attempts (user_id, created_at desc);
create index if not exists kori_phrase_attempts_phrase_idx
  on public.kori_phrase_attempts (phrase_id);

-- ── Cross-table ownership checks ────────────────────────────────────────────
-- RLS alone only guarantees each row's own user_id = auth.uid(); it does not
-- stop an authenticated caller from pointing collection_id/phrase_id at a
-- row owned by someone else. These triggers close that gap explicitly (the
-- brief calls this out: "Validate ownership of related collection and
-- phrase IDs"). security definer + fixed search_path so the check runs
-- against real table state regardless of the caller's own RLS visibility.

create or replace function public.kori_phrase_check_card_ownership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.kori_phrase_collections
    where id = new.collection_id and user_id = new.user_id
  ) then
    raise exception 'kori_phrase_cards.collection_id does not belong to user_id';
  end if;
  return new;
end;
$$;

drop trigger if exists kori_phrase_cards_ownership_check on public.kori_phrase_cards;
create trigger kori_phrase_cards_ownership_check
  before insert or update of collection_id, user_id on public.kori_phrase_cards
  for each row execute function public.kori_phrase_check_card_ownership();

create or replace function public.kori_phrase_check_phrase_ownership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.kori_phrase_cards
    where id = new.phrase_id and user_id = new.user_id
  ) then
    raise exception 'phrase_id does not belong to user_id';
  end if;
  return new;
end;
$$;

drop trigger if exists kori_phrase_progress_ownership_check on public.kori_phrase_progress;
create trigger kori_phrase_progress_ownership_check
  before insert or update of phrase_id, user_id on public.kori_phrase_progress
  for each row execute function public.kori_phrase_check_phrase_ownership();

drop trigger if exists kori_phrase_attempts_ownership_check on public.kori_phrase_attempts;
create trigger kori_phrase_attempts_ownership_check
  before insert or update of phrase_id, user_id on public.kori_phrase_attempts
  for each row execute function public.kori_phrase_check_phrase_ownership();

-- ── RLS ──────────────────────────────────────────────────────────────────

alter table public.kori_phrase_collections enable row level security;
alter table public.kori_phrase_cards enable row level security;
alter table public.kori_phrase_progress enable row level security;
alter table public.kori_phrase_attempts enable row level security;

revoke all on table public.kori_phrase_collections from anon;
revoke all on table public.kori_phrase_cards from anon;
revoke all on table public.kori_phrase_progress from anon;
revoke all on table public.kori_phrase_attempts from anon;

grant select, insert, update, delete on table public.kori_phrase_collections to authenticated;
grant select, insert, update, delete on table public.kori_phrase_cards to authenticated;
grant select, insert, update, delete on table public.kori_phrase_progress to authenticated;
grant select, insert, update, delete on table public.kori_phrase_attempts to authenticated;

drop policy if exists "own phrase collections" on public.kori_phrase_collections;
create policy "own phrase collections" on public.kori_phrase_collections
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own phrase cards" on public.kori_phrase_cards;
create policy "own phrase cards" on public.kori_phrase_cards
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own phrase progress" on public.kori_phrase_progress;
create policy "own phrase progress" on public.kori_phrase_progress
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own phrase attempts" on public.kori_phrase_attempts;
create policy "own phrase attempts" on public.kori_phrase_attempts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── Romanization preference ─────────────────────────────────────────────────

alter table public.kori_profiles
  add column if not exists romanization_preference text
    not null default 'always'
    check (romanization_preference in ('always', 'on_request', 'never'));

-- ── Today's Mission: phrase_review item type ────────────────────────────────

alter table public.kori_daily_mission_items
  drop constraint if exists kori_daily_mission_items_item_type_check;
alter table public.kori_daily_mission_items
  add constraint kori_daily_mission_items_item_type_check
  check (item_type in ('vocab_review', 'correction_review', 'daily_phrase', 'scenario', 'listening', 'interview', 'phrase_review'));
