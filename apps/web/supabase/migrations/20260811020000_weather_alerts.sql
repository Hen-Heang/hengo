-- Weather alerts: unusual-forecast notifications for the calendar's fixed
-- location (Yeongdeungpo-gu, Seoul), delivered through the existing
-- kori_dispatch_push pipeline (Telegram + web push) — same per-minute,
-- self-gated cron pattern as kori_send_reviews_due_reminders /
-- kori_send_streak_saver_reminders / kori_send_exam_countdown_reminders.
--
-- The external Open-Meteo fetch only actually happens once per calendar day:
-- the function first checks whether any opted-in user is still waiting on
-- today's alert (weather_alert_pushed_on < today or null) and bails out
-- immediately otherwise, so the per-minute cron tick is a no-op the rest of
-- the day. pg_net is asynchronous, so the fetch is a queue-then-poll against
-- net._http_response rather than a single blocking call.

alter table public.kori_profiles
  add column if not exists weather_alerts_enabled boolean not null default false,
  add column if not exists weather_alert_pushed_on date;

create or replace function public.kori_send_weather_alerts() returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_eligible boolean;
  v_request_id bigint;
  v_content text;
  v_json jsonb;
  v_code int;
  v_tmax numeric;
  v_tmin numeric;
  v_parts text[] := array[]::text[];
  v_title text := '⚠️ Weather alert — Yeongdeungpo-gu, Seoul';
  v_body text;
  v_waited int := 0;
  r record;
  v_count int := 0;
begin
  select exists (
    select 1 from public.kori_profiles
    where weather_alerts_enabled
      and (weather_alert_pushed_on is null or weather_alert_pushed_on < v_today)
  ) into v_eligible;

  if not v_eligible or (now() at time zone 'Asia/Seoul')::time < make_time(7, 0, 0) then
    return 0;
  end if;

  select net.http_get(
    'https://api.open-meteo.com/v1/forecast?latitude=37.5219&longitude=126.9245&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FSeoul&forecast_days=1',
    timeout_milliseconds := 8000
  ) into v_request_id;

  loop
    select content into v_content from net._http_response where id = v_request_id;
    if v_content is not null or v_waited >= 10 then
      exit;
    end if;
    perform pg_sleep(0.5);
    v_waited := v_waited + 1;
  end loop;

  -- Open-Meteo didn't answer in time — try again on next minute's tick
  -- rather than marking anyone as checked for today.
  if v_content is null then
    return 0;
  end if;

  v_json := v_content::jsonb;
  v_code := (v_json->'daily'->'weathercode'->>0)::int;
  v_tmax := (v_json->'daily'->'temperature_2m_max'->>0)::numeric;
  v_tmin := (v_json->'daily'->'temperature_2m_min'->>0)::numeric;

  if v_code in (51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82) then
    v_parts := v_parts || ('🌧️ Rain expected, high ' || round(v_tmax) || '°C');
  end if;
  if v_code in (95, 96, 99) then
    v_parts := v_parts || '⛈️ Thunderstorms expected today';
  end if;
  if v_code in (71, 73, 75, 77, 85, 86) then
    v_parts := v_parts || ('🌨️ Snow expected, low ' || round(v_tmin) || '°C');
  end if;
  if v_tmax >= 33 then
    v_parts := v_parts || ('🥵 Heatwave — up to ' || round(v_tmax) || '°C');
  end if;
  if v_tmin <= -12 then
    v_parts := v_parts || ('🥶 Cold wave — down to ' || round(v_tmin) || '°C');
  end if;

  if array_length(v_parts, 1) is null then
    -- Nothing unusual — mark today checked so we don't refetch all day.
    update public.kori_profiles
    set weather_alert_pushed_on = v_today
    where weather_alerts_enabled
      and (weather_alert_pushed_on is null or weather_alert_pushed_on < v_today);
    return 0;
  end if;

  v_body := array_to_string(v_parts, ' · ');

  for r in
    select id from public.kori_profiles
    where weather_alerts_enabled
      and (weather_alert_pushed_on is null or weather_alert_pushed_on < v_today)
  loop
    begin
      perform public.kori_dispatch_push(r.id, v_title, v_body, 'https://hengo.henheang.site/goals/calendar');
    exception when others then
      null; -- one user's failed dispatch must never block the others
    end;
    update public.kori_profiles set weather_alert_pushed_on = v_today where id = r.id;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$function$;

select cron.schedule('kori-weather-alerts', '* * * * *', $$select public.kori_send_weather_alerts();$$);

-- No legitimate reason for a client to invoke this directly — matches
-- kori_dispatch_push / kori_dispatch_reminders' lockdown in the universal
-- reminders migration.
revoke execute on function public.kori_send_weather_alerts() from public, anon, authenticated;
