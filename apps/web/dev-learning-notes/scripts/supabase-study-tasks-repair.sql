create extension if not exists pgcrypto;

create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid()
);

alter table public.study_tasks
  add column if not exists title text,
  add column if not exists phase text,
  add column if not exists category text,
  add column if not exists notes text not null default '',
  add column if not exists status text not null default 'todo',
  add column if not exists sort_order integer not null default 999,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.study_tasks
set
  title = coalesce(title, 'Untitled task'),
  phase = coalesce(phase, 'Phase 0'),
  category = coalesce(category, 'General'),
  notes = coalesce(notes, ''),
  status = coalesce(status, 'todo'),
  sort_order = coalesce(sort_order, 999)
where
  title is null
  or phase is null
  or category is null
  or notes is null
  or status is null
  or sort_order is null;

alter table public.study_tasks
  alter column title set not null,
  alter column phase set not null,
  alter column category set not null;

alter table public.study_tasks
  drop constraint if exists study_tasks_status_check;

alter table public.study_tasks
  add constraint study_tasks_status_check
  check (status in ('todo', 'doing', 'done'));

create or replace function public.set_study_tasks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_study_tasks_updated_at on public.study_tasks;

create trigger trg_study_tasks_updated_at
before update on public.study_tasks
for each row
execute function public.set_study_tasks_updated_at();

alter table public.study_tasks enable row level security;

drop policy if exists "public read study tasks" on public.study_tasks;
create policy "public read study tasks"
on public.study_tasks
for select
to anon, authenticated
using (true);

drop policy if exists "service role full access study tasks" on public.study_tasks;
create policy "service role full access study tasks"
on public.study_tasks
for all
to service_role
using (true)
with check (true);
