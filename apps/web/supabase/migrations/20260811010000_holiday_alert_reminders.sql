-- Holiday alert reminders — same shape as the existing kori_send_streak_saver_reminders /
-- kori_send_exam_countdown_reminders / kori_send_reviews_due_reminders functions (per-minute
-- cron, hardcoded local send hour, a "*_pushed_on" date column so a reminder can never fire
-- twice in the same day even if the cron overlaps itself), delivered through the same
-- kori_dispatch_push helper the universal reminders migration introduced — so this reaches
-- both Telegram and web push for free, with no new delivery code.
--
-- kori_public_holidays mirrors apps/web/lib/holidays.ts's static Korea + Cambodia dataset
-- (2025-2027) so the SQL side has something to look up "is tomorrow a holiday?" against —
-- that lib file has no server-side visibility. Keep the two in sync when either changes.

create table if not exists public.kori_public_holidays (
  date date not null,
  country text not null check (country in ('KR', 'KH')),
  name text not null,
  primary key (date, country, name)
);

comment on table public.kori_public_holidays is
  'Reference data (no user_id) mirroring apps/web/lib/holidays.ts. Keep both in sync.';

alter table public.kori_public_holidays enable row level security;
revoke all on table public.kori_public_holidays from anon;
grant select on table public.kori_public_holidays to authenticated;

drop policy if exists "public holidays are readable by any signed-in user" on public.kori_public_holidays;
create policy "public holidays are readable by any signed-in user" on public.kori_public_holidays
  for select to authenticated using (true);

insert into public.kori_public_holidays (date, country, name) values
  ('2025-01-01', 'KR', 'New Year''s Day'),
  ('2025-01-27', 'KR', 'Seollal Holiday'),
  ('2025-01-28', 'KR', 'Seollal Holiday'),
  ('2025-01-29', 'KR', 'Seollal (Lunar New Year)'),
  ('2025-01-30', 'KR', 'Seollal Holiday'),
  ('2025-03-01', 'KR', 'Independence Movement Day'),
  ('2025-05-05', 'KR', 'Children''s Day / Buddha''s Birthday'),
  ('2025-06-03', 'KR', 'Election Day (temporary holiday)'),
  ('2025-06-06', 'KR', 'Memorial Day'),
  ('2025-08-15', 'KR', 'Liberation Day'),
  ('2025-10-03', 'KR', 'National Foundation Day'),
  ('2025-10-05', 'KR', 'Chuseok Holiday'),
  ('2025-10-06', 'KR', 'Chuseok (Harvest Festival)'),
  ('2025-10-07', 'KR', 'Chuseok Holiday'),
  ('2025-10-09', 'KR', 'Hangeul Day'),
  ('2025-12-25', 'KR', 'Christmas Day'),
  ('2026-01-01', 'KR', 'New Year''s Day'),
  ('2026-02-16', 'KR', 'Seollal Holiday'),
  ('2026-02-17', 'KR', 'Seollal (Lunar New Year)'),
  ('2026-02-18', 'KR', 'Seollal Holiday'),
  ('2026-03-01', 'KR', 'Independence Movement Day'),
  ('2026-03-02', 'KR', 'Independence Movement Day (in lieu)'),
  ('2026-05-01', 'KR', 'Labor Day'),
  ('2026-05-05', 'KR', 'Children''s Day'),
  ('2026-05-24', 'KR', 'Buddha''s Birthday'),
  ('2026-05-25', 'KR', 'Buddha''s Birthday (in lieu)'),
  ('2026-06-06', 'KR', 'Memorial Day'),
  ('2026-07-17', 'KR', 'Constitution Day'),
  ('2026-08-15', 'KR', 'Liberation Day'),
  ('2026-08-17', 'KR', 'Liberation Day (in lieu)'),
  ('2026-09-24', 'KR', 'Chuseok Holiday'),
  ('2026-09-25', 'KR', 'Chuseok (Harvest Festival)'),
  ('2026-09-26', 'KR', 'Chuseok Holiday'),
  ('2026-10-03', 'KR', 'National Foundation Day'),
  ('2026-10-05', 'KR', 'National Foundation Day (in lieu)'),
  ('2026-10-09', 'KR', 'Hangeul Day'),
  ('2026-12-25', 'KR', 'Christmas Day'),
  ('2027-01-01', 'KR', 'New Year''s Day'),
  ('2027-02-06', 'KR', 'Seollal (Lunar New Year)'),
  ('2027-02-07', 'KR', 'Seollal Holiday'),
  ('2027-02-08', 'KR', 'Seollal Holiday'),
  ('2027-02-09', 'KR', 'Seollal Holiday (in lieu)'),
  ('2027-03-01', 'KR', 'Independence Movement Day'),
  ('2027-05-01', 'KR', 'Labor Day'),
  ('2027-05-03', 'KR', 'Labor Day (in lieu)'),
  ('2027-05-05', 'KR', 'Children''s Day'),
  ('2027-05-13', 'KR', 'Buddha''s Birthday'),
  ('2027-06-06', 'KR', 'Memorial Day'),
  ('2027-07-17', 'KR', 'Constitution Day'),
  ('2027-07-19', 'KR', 'Constitution Day (in lieu)'),
  ('2027-08-15', 'KR', 'Liberation Day'),
  ('2027-08-16', 'KR', 'Liberation Day (in lieu)'),
  ('2027-09-14', 'KR', 'Chuseok Holiday'),
  ('2027-09-15', 'KR', 'Chuseok (Harvest Festival)'),
  ('2027-09-16', 'KR', 'Chuseok Holiday'),
  ('2027-10-03', 'KR', 'National Foundation Day'),
  ('2027-10-04', 'KR', 'National Foundation Day (in lieu)'),
  ('2027-10-09', 'KR', 'Hangeul Day'),
  ('2027-10-11', 'KR', 'Hangeul Day (in lieu)'),
  ('2027-12-25', 'KR', 'Christmas Day'),
  ('2025-01-01', 'KH', 'New Year''s Day'),
  ('2025-01-07', 'KH', 'Victory over Genocide Day'),
  ('2025-03-08', 'KH', 'International Women''s Day'),
  ('2025-04-14', 'KH', 'Khmer New Year'),
  ('2025-04-15', 'KH', 'Khmer New Year Holiday'),
  ('2025-04-16', 'KH', 'Khmer New Year Holiday'),
  ('2025-05-01', 'KH', 'International Labour Day'),
  ('2025-05-11', 'KH', 'Visak Bochea Day'),
  ('2025-05-14', 'KH', 'King''s Birthday'),
  ('2025-05-15', 'KH', 'Royal Ploughing Ceremony'),
  ('2025-06-18', 'KH', 'King''s Mother''s Birthday'),
  ('2025-09-21', 'KH', 'Pchum Ben (Ancestors'' Day)'),
  ('2025-09-22', 'KH', 'Pchum Ben Holiday'),
  ('2025-09-23', 'KH', 'Pchum Ben Holiday'),
  ('2025-09-24', 'KH', 'Constitution Day'),
  ('2025-10-15', 'KH', 'Commemoration Day of King''s Father'),
  ('2025-10-29', 'KH', 'King''s Coronation Day'),
  ('2025-11-04', 'KH', 'Water Festival'),
  ('2025-11-05', 'KH', 'Water Festival Holiday'),
  ('2025-11-06', 'KH', 'Water Festival Holiday'),
  ('2025-11-09', 'KH', 'Independence Day'),
  ('2025-12-29', 'KH', 'Peace Day'),
  ('2026-01-01', 'KH', 'New Year''s Day'),
  ('2026-01-07', 'KH', 'Victory over Genocide Day'),
  ('2026-03-08', 'KH', 'International Women''s Day'),
  ('2026-04-14', 'KH', 'Khmer New Year'),
  ('2026-04-15', 'KH', 'Khmer New Year Holiday'),
  ('2026-04-16', 'KH', 'Khmer New Year Holiday'),
  ('2026-05-01', 'KH', 'International Labour Day'),
  ('2026-05-04', 'KH', 'Visak Bochea Day'),
  ('2026-05-05', 'KH', 'Royal Ploughing Ceremony'),
  ('2026-05-14', 'KH', 'King''s Birthday'),
  ('2026-06-18', 'KH', 'King''s Mother''s Birthday'),
  ('2026-09-24', 'KH', 'Constitution Day'),
  ('2026-10-10', 'KH', 'Pchum Ben (Ancestors'' Day)'),
  ('2026-10-11', 'KH', 'Pchum Ben Holiday'),
  ('2026-10-12', 'KH', 'Pchum Ben Holiday'),
  ('2026-10-15', 'KH', 'Commemoration Day of King''s Father'),
  ('2026-10-29', 'KH', 'King''s Coronation Day'),
  ('2026-11-09', 'KH', 'Independence Day'),
  ('2026-11-24', 'KH', 'Water Festival'),
  ('2026-11-25', 'KH', 'Water Festival Holiday'),
  ('2026-11-26', 'KH', 'Water Festival Holiday'),
  ('2026-12-29', 'KH', 'Peace Day'),
  ('2027-01-01', 'KH', 'New Year''s Day'),
  ('2027-01-07', 'KH', 'Victory over Genocide Day'),
  ('2027-03-08', 'KH', 'International Women''s Day'),
  ('2027-04-14', 'KH', 'Khmer New Year'),
  ('2027-04-15', 'KH', 'Khmer New Year Holiday'),
  ('2027-04-16', 'KH', 'Khmer New Year Holiday'),
  ('2027-05-01', 'KH', 'International Labour Day'),
  ('2027-05-14', 'KH', 'King''s Birthday'),
  ('2027-05-20', 'KH', 'Visak Bochea Day'),
  ('2027-05-24', 'KH', 'Royal Ploughing Ceremony'),
  ('2027-06-18', 'KH', 'King''s Mother''s Birthday'),
  ('2027-09-24', 'KH', 'Constitution Day'),
  ('2027-10-15', 'KH', 'Commemoration Day of King''s Father'),
  ('2027-10-29', 'KH', 'King''s Coronation Day'),
  ('2027-11-09', 'KH', 'Independence Day'),
  ('2027-12-29', 'KH', 'Peace Day')
on conflict (date, country, name) do nothing;

alter table public.kori_profiles
  add column if not exists holiday_alerts_enabled boolean not null default false,
  add column if not exists holiday_alert_pushed_on date;

-- Fires once per user, at 18:00 Asia/Seoul the evening before any Korea or Cambodia
-- holiday, for everyone with holiday_alerts_enabled = true. holiday_alert_pushed_on
-- guards against a second send later the same day (this runs every minute, same as
-- the other kori_send_*_reminders jobs).
create or replace function public.kori_send_holiday_reminders() returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  r record;
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_tomorrow date := v_today + 1;
  v_names text;
  v_body text;
  v_count int := 0;
begin
  select string_agg(distinct name, ', ' order by name) into v_names
  from public.kori_public_holidays
  where date = v_tomorrow;

  if v_names is null then
    return 0;
  end if;

  v_body := v_names || ' — no work day tomorrow (' || to_char(v_tomorrow, 'Mon DD') || ').';

  for r in
    select id from public.kori_profiles
    where coalesce(holiday_alerts_enabled, false)
      and (holiday_alert_pushed_on is null or holiday_alert_pushed_on < v_today)
      and (now() at time zone 'Asia/Seoul')::time >= make_time(18, 0, 0)
  loop
    perform public.kori_dispatch_push(r.id, '📅 Holiday tomorrow', v_body, 'https://hengo.henheang.site/goals/calendar');
    update public.kori_profiles set holiday_alert_pushed_on = v_today where id = r.id;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$function$;

revoke execute on function public.kori_send_holiday_reminders() from public, anon, authenticated;

select cron.schedule('kori-holiday-alert-reminder', '* * * * *', $$select public.kori_send_holiday_reminders();$$);
