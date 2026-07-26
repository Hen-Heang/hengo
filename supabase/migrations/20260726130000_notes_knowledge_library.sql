-- Second Brain, Phase 2: Notes → Knowledge Library.
--
-- Additive columns on kori_notes only — existing note URLs/slugs, RLS, and
-- data are untouched. `note_type` gets a NOT NULL DEFAULT so every existing
-- row is safely backfilled as 'technical' by Postgres without a separate
-- UPDATE statement. `category`/`icon` keep their pre-existing meaning; the
-- app layer now lets users set them independently instead of always mirroring
-- icon into category.

alter table public.kori_notes
  add column if not exists note_type text not null default 'technical'
    check (note_type in ('technical', 'korean', 'personal', 'decision', 'idea', 'reference')),
  add column if not exists pinned boolean not null default false,
  add column if not exists source_url text
    check (source_url is null or char_length(source_url) <= 2000),
  add column if not exists goal_id uuid references public.goals(id) on delete set null,
  add column if not exists task_id uuid references public.tasks(id) on delete set null,
  add column if not exists inbox_item_id uuid references public.kori_inbox_items(id) on delete set null;

-- Full-text search across title/description/content — content search was the
-- one thing the old client-side metadata-only filter couldn't do.
alter table public.kori_notes
  add column if not exists search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) stored;

create index if not exists kori_notes_user_pinned_updated_idx
  on public.kori_notes (user_id, pinned, updated_at desc);
create index if not exists kori_notes_user_type_idx
  on public.kori_notes (user_id, note_type);
create index if not exists kori_notes_search_idx
  on public.kori_notes using gin (search);
create index if not exists kori_notes_user_goal_idx
  on public.kori_notes (user_id, goal_id) where goal_id is not null;
create index if not exists kori_notes_user_task_idx
  on public.kori_notes (user_id, task_id) where task_id is not null;
create index if not exists kori_notes_user_inbox_item_idx
  on public.kori_notes (user_id, inbox_item_id) where inbox_item_id is not null;
