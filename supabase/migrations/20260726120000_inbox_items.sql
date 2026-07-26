-- Second Brain, Phase 1: Quick Capture Inbox.
--
-- A fast, generic capture surface (ideas, notes, tasks, activities, Korean
-- phrases, dev learnings, journal thoughts) that gets explicitly triaged into
-- Notes/Tasks/Journal later. Nothing here is destructive: converting an item
-- only stamps status/converted_to_* — the original row is never deleted by
-- the app.

create table if not exists public.kori_inbox_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text check (title is null or char_length(title) <= 200),
  content text not null check (char_length(content) between 1 and 4000),
  item_type text not null default 'note'
    check (item_type in ('idea', 'note', 'task', 'activity', 'phrase', 'dev', 'journal')),
  tags text[] not null default '{}',
  captured_at timestamptz not null default now(),
  event_at timestamptz,
  goal_id uuid references public.goals(id) on delete set null,
  status text not null default 'inbox'
    check (status in ('inbox', 'processed', 'archived')),
  source text not null default 'manual'
    check (source in ('manual', 'voice', 'ai', 'converted')),
  pinned boolean not null default false,
  converted_to_type text check (converted_to_type in ('note', 'task', 'journal')),
  converted_to_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) stored
);

create index if not exists kori_inbox_items_user_status_created_idx
  on public.kori_inbox_items (user_id, status, created_at desc);
create index if not exists kori_inbox_items_user_type_created_idx
  on public.kori_inbox_items (user_id, item_type, created_at desc);
create index if not exists kori_inbox_items_user_pinned_idx
  on public.kori_inbox_items (user_id, pinned, created_at desc);
create index if not exists kori_inbox_items_user_goal_idx
  on public.kori_inbox_items (user_id, goal_id) where goal_id is not null;
create index if not exists kori_inbox_items_search_idx
  on public.kori_inbox_items using gin (search);
create index if not exists kori_inbox_items_tags_idx
  on public.kori_inbox_items using gin (tags);

alter table public.kori_inbox_items enable row level security;
revoke all on table public.kori_inbox_items from anon;
grant select, insert, update, delete on table public.kori_inbox_items to authenticated;

drop policy if exists "own inbox items" on public.kori_inbox_items;
create policy "own inbox items" on public.kori_inbox_items
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
