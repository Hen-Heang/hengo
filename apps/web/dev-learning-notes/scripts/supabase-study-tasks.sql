create extension if not exists pgcrypto;

create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  phase text not null,
  category text not null,
  notes text not null default '',
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  sort_order integer not null default 999,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
