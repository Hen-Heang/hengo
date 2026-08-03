-- Feed meaningful daily speaking corrections into Hengo's existing SRS queue.
-- The trigger runs as the signed-in invoker, so the existing corrections RLS
-- policy still enforces row ownership. Attempts with no meaningful error and
-- successful retry rows do not create review cards.

create or replace function public.kori_sync_daily_study_mistakes()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  attempt jsonb;
  feedback jsonb;
  category text;
  original_text_value text;
  corrected_text_value text;
  fingerprint_value text;
begin
  for attempt in
    select value
    from jsonb_array_elements(new.attempts)
    where not exists (
      select 1
      from jsonb_array_elements(old.attempts) previous
      where previous ->> 'id' = value ->> 'id'
    )
  loop
    feedback := attempt -> 'feedback';
    category := feedback ->> 'errorCategory';
    original_text_value := trim(feedback ->> 'originalAnswer');
    corrected_text_value := trim(feedback ->> 'correctedAnswer');

    if category is null
      or category = 'none'
      or coalesce((attempt ->> 'successfulRetry')::boolean, false)
      or original_text_value = ''
      or corrected_text_value = ''
      or original_text_value = corrected_text_value
    then
      continue;
    end if;

    category := case category
      when 'vocabulary' then 'vocabulary'
      when 'politeness' then 'politeness'
      else 'expression'
    end;
    fingerprint_value :=
      lower(trim(regexp_replace(original_text_value, '\s+', ' ', 'g')))
      || '::'
      || lower(trim(regexp_replace(corrected_text_value, '\s+', ' ', 'g')))
      || '::'
      || category;

    insert into public.kori_corrections (
      user_id,
      original_text,
      corrected_text,
      explanation,
      grammar_points,
      source_feature,
      source_id,
      error_category,
      severity,
      natural_version,
      fingerprint,
      next_review_date
    ) values (
      new.user_id,
      original_text_value,
      corrected_text_value,
      feedback ->> 'shortExplanation',
      array[category],
      'daily_study_plan',
      new.id::text,
      category,
      case when feedback ->> 'errorCategory' in ('meaning', 'politeness')
        then 'important' else 'minor' end,
      feedback ->> 'naturalAlternative',
      fingerprint_value,
      now()
    )
    on conflict (user_id, fingerprint) do update
      set original_text = excluded.original_text,
          corrected_text = excluded.corrected_text,
          explanation = excluded.explanation,
          source_feature = excluded.source_feature,
          source_id = excluded.source_id,
          error_category = excluded.error_category,
          severity = excluded.severity,
          natural_version = excluded.natural_version,
          occurrence_count = public.kori_corrections.occurrence_count + 1,
          next_review_date = least(public.kori_corrections.next_review_date, now()),
          last_seen_at = now();
  end loop;

  return new;
end;
$$;

drop trigger if exists kori_daily_study_mistake_sync on public.kori_daily_study_plans;
create trigger kori_daily_study_mistake_sync
  after update of attempts on public.kori_daily_study_plans
  for each row
  when (old.attempts is distinct from new.attempts)
  execute function public.kori_sync_daily_study_mistakes();
