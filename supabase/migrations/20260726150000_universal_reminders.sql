-- Second Brain, Phase 4: Universal Reminders.
--
-- One generic table that can attach to any entity (task, goal, habit, note,
-- inbox item, journal prompt, manual activity), dispatched by a per-minute
-- pg_cron job through the existing kori_dispatch_push infrastructure — the
-- same delivery path the study reminders already use, so "existing study
-- reminders must continue working" is satisfied by construction (their own
-- functions are untouched; only kori_dispatch_push gains a backward-
-- compatible optional parameter).
--
-- Idempotency: the dispatch loop uses `for update skip locked` and advances
-- next_run_at inside the same transaction as the send, so a reminder can
-- never fire twice for the same occurrence even if the cron job somehow
-- overlaps itself. Ownership of entity_id is re-verified server-side on every
-- dispatch (never trusted from creation time) — a reminder whose linked item
-- was deleted gets cancelled with a reason, never silently retried forever.

create table if not exists public.kori_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  body text check (body is null or char_length(body) <= 1000),
  entity_type text not null
    check (entity_type in ('task', 'goal', 'habit', 'note', 'inbox_item', 'journal_prompt', 'manual_activity')),
  entity_id uuid,
  scheduled_for timestamptz,
  recurrence jsonb check (recurrence is null or jsonb_typeof(recurrence) = 'object'),
  timezone text not null default 'Asia/Seoul',
  channels text[] not null default array['web', 'telegram'],
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  next_run_at timestamptz,
  last_sent_at timestamptz,
  last_error text,
  snoozed_until timestamptz,
  dedupe_key text,
  deep_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kori_reminders_schedule_present check (scheduled_for is not null or recurrence is not null),
  constraint kori_reminders_entity_id_required check (entity_type = 'journal_prompt' or entity_id is not null)
);

create index if not exists kori_reminders_dispatch_idx
  on public.kori_reminders (next_run_at) where status = 'active';
create index if not exists kori_reminders_user_status_idx
  on public.kori_reminders (user_id, status, created_at desc);
create index if not exists kori_reminders_user_entity_idx
  on public.kori_reminders (user_id, entity_type, entity_id) where entity_id is not null;

alter table public.kori_reminders enable row level security;
revoke all on table public.kori_reminders from anon;
grant select, insert, update, delete on table public.kori_reminders to authenticated;

drop policy if exists "own reminders" on public.kori_reminders;
create policy "own reminders" on public.kori_reminders
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Pure calculator (no table access) — also called directly by the client via
-- RPC for a live "next reminder: ..." preview while creating/editing one, so
-- the UI's preview and the server's actual dispatch timing can never disagree.
-- Mirrors lib/reminders.ts's computeNextRunAt: walk forward one calendar day
-- at a time and let Postgres's own tzdata resolve the UTC instant for that
-- day's wall-clock time, so DST transitions never shift the requested time.
create or replace function public.kori_next_reminder_run(
  p_recurrence jsonb,
  p_timezone text,
  p_after timestamptz
) returns timestamptz
language plpgsql
as $function$
declare
  v_freq text := p_recurrence->>'frequency';
  v_time time;
  v_anchor_weekday int;
  v_weekdays int[];
  v_date date := (p_after at time zone p_timezone)::date;
  v_candidate timestamptz;
  v_iterations int := 0;
begin
  if p_recurrence is null or v_freq is null or p_recurrence->>'time' is null then
    return null;
  end if;
  v_time := (p_recurrence->>'time')::time;

  if v_freq = 'weekly' then
    v_anchor_weekday := (p_recurrence->>'anchorWeekday')::int;
  elsif v_freq = 'weekdays' then
    select array_agg((value)::int) into v_weekdays
    from jsonb_array_elements_text(coalesce(p_recurrence->'weekdays', '[]'::jsonb)) as value;
  end if;

  loop
    v_iterations := v_iterations + 1;
    exit when v_iterations > 400;

    v_candidate := (v_date + v_time) at time zone p_timezone;

    if v_candidate > p_after then
      if v_freq = 'daily'
        or (v_freq = 'weekly' and extract(dow from v_date)::int = v_anchor_weekday)
        or (v_freq = 'weekdays' and v_weekdays is not null and extract(dow from v_date)::int = any(v_weekdays))
      then
        return v_candidate;
      end if;
    end if;

    v_date := v_date + 1;
  end loop;

  return null;
end;
$function$;

grant execute on function public.kori_next_reminder_run(jsonb, text, timestamptz) to authenticated;

-- Backward-compatible extension of the existing dispatch helper: adds an
-- optional channels filter (defaults to both, matching every existing call
-- site's behavior exactly) and isolates the Telegram send in its own
-- exception block — previously only the web-push half was isolated, so a
-- Telegram failure could abort the whole function before push was even
-- attempted. Existing callers (kori_send_reviews_due_reminders,
-- kori_send_streak_saver_reminders, kori_send_exam_countdown_reminders) all
-- call this with exactly 4 positional arguments and are unaffected — but
-- `create or replace function` only replaces a function when its name AND
-- parameter *types* match exactly; adding a parameter creates a second
-- overload instead of truly replacing it. Drop the old 4-arg signature first
-- so there is exactly one kori_dispatch_push again (the 4-arg calls above
-- then resolve to this one, using the default for the new parameter).
drop function if exists public.kori_dispatch_push(uuid, text, text, text);

create or replace function public.kori_dispatch_push(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_url text,
  p_channels text[] default array['web', 'telegram']
) returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_chat text;
  v_service_key text;
begin
  if 'telegram' = any(p_channels) then
    begin
      SELECT COALESCE(
        (SELECT ktl.chat_id FROM public.kori_telegram_links ktl WHERE ktl.user_id = p_user_id),
        (SELECT up.telegram_chat_id FROM public.user_profiles up WHERE up.id = p_user_id)
      ) INTO v_chat;

      IF v_chat IS NOT NULL THEN
        PERFORM public.kori_tg_send(
          v_chat,
          '<b>' || public.tg_esc(p_title) || '</b>' || chr(10) || public.tg_esc(p_body),
          p_url,
          'Open KoriAI'
        );
      END IF;
    exception when others then
      null; -- a Telegram failure must never block the web-push attempt below
    end;
  end if;

  if 'web' = any(p_channels) then
    BEGIN
      SELECT decrypted_secret INTO v_service_key
      FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY';
      IF v_service_key IS NOT NULL THEN
        PERFORM net.http_post(
          url := 'https://dnzqgnejwyucenghugrb.supabase.co/functions/v1/kori-send-push',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_service_key,
            'apikey', v_service_key
          ),
          body := jsonb_build_object('userId', p_user_id, 'title', p_title, 'body', p_body, 'url', p_url),
          timeout_milliseconds := 10000
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  end if;
end;
$function$;

-- The per-minute dispatch loop. `for update skip locked` makes re-entrancy
-- safe; ownership is re-checked per entity_type so a deleted/foreign entity_id
-- can never leak a notification.
create or replace function public.kori_dispatch_reminders() returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  r record;
  v_count int := 0;
  v_owned boolean;
  v_next timestamptz;
begin
  for r in
    select * from public.kori_reminders
    where status = 'active' and next_run_at is not null and next_run_at <= now()
    order by next_run_at
    limit 200
    for update skip locked
  loop
    v_owned := case r.entity_type
      when 'task' then exists (select 1 from public.tasks t where t.id = r.entity_id and t.user_id = r.user_id)
      when 'goal' then exists (select 1 from public.goals g where g.id = r.entity_id and g.user_id = r.user_id)
      when 'habit' then exists (select 1 from public.kori_habits h where h.id = r.entity_id and h.user_id = r.user_id)
      when 'note' then exists (select 1 from public.kori_notes n where n.id = r.entity_id and n.user_id = r.user_id)
      when 'inbox_item' then exists (select 1 from public.kori_inbox_items i where i.id = r.entity_id and i.user_id = r.user_id)
      when 'manual_activity' then exists (select 1 from public.kori_manual_activities m where m.id = r.entity_id and m.user_id = r.user_id)
      when 'journal_prompt' then true
      else false
    end;

    if not v_owned then
      update public.kori_reminders
      set status = 'cancelled', last_error = 'Linked item no longer exists', updated_at = now()
      where id = r.id;
      continue;
    end if;

    begin
      perform public.kori_dispatch_push(
        r.user_id, r.title, coalesce(r.body, ''), coalesce(r.deep_link, 'https://hengo.henheang.site'), r.channels
      );
    exception when others then
      update public.kori_reminders set last_error = left(sqlerrm, 500), updated_at = now() where id = r.id;
    end;

    if r.recurrence is null then
      update public.kori_reminders
      set status = 'completed', last_sent_at = now(), next_run_at = null, snoozed_until = null,
          dedupe_key = r.id::text || ':' || r.next_run_at::text, updated_at = now()
      where id = r.id;
    else
      v_next := public.kori_next_reminder_run(r.recurrence, r.timezone, r.next_run_at);
      update public.kori_reminders
      set last_sent_at = now(),
          snoozed_until = null,
          dedupe_key = r.id::text || ':' || r.next_run_at::text,
          next_run_at = v_next,
          status = case when v_next is null then 'completed' else status end,
          updated_at = now()
      where id = r.id;
    end if;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$function$;

select cron.schedule('kori-universal-reminders', '* * * * *', $$select public.kori_dispatch_reminders();$$);

-- Postgres grants EXECUTE to PUBLIC by default on function creation. Unlike
-- the existing kori_send_*_reminders functions (already locked down), these
-- two would otherwise be directly callable by anyone via the public REST RPC
-- endpoint — kori_dispatch_push takes an arbitrary p_user_id, so left open it
-- would let anyone spam push/Telegram messages to any user. Both are only
-- ever invoked internally: by pg_cron (runs as postgres, bypasses grants) or
-- by other SECURITY DEFINER functions.
revoke execute on function public.kori_dispatch_push(uuid, text, text, text, text[]) from public, anon, authenticated;
revoke execute on function public.kori_dispatch_reminders() from public, anon, authenticated;

-- kori_next_reminder_run has no side effects and touches no tables, but
-- there's no legitimate reason for an unauthenticated caller either —
-- restrict to signed-in users only (matches its actual use: the client-side
-- "next reminder" preview while creating/editing a reminder).
revoke execute on function public.kori_next_reminder_run(jsonb, text, timestamptz) from public, anon;
