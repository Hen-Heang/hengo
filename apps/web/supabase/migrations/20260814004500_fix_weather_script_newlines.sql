-- Convert accidentally persisted literal "\n" sequences into real line breaks.
--
-- The mentor-final weather script was synced through SQL with escaped newline
-- text, so the editor could render `\n\n` instead of paragraph breaks. Keep
-- this migration narrow to the weather interview script and its snapshots.

update public.kori_interview_scripts as script
set sections = (
      select coalesce(
        jsonb_object_agg(item.key, replace(item.value, E'\\n', chr(10))),
        '{}'::jsonb
      )
      from jsonb_each_text(script.sections) as item
    ),
    updated_at = now()
where script.topic_id = 'weather'
  and exists (
    select 1
    from jsonb_each_text(script.sections) as item
    where strpos(item.value, E'\\n') > 0
  );

update public.kori_interview_script_versions as version
set sections = (
      select coalesce(
        jsonb_object_agg(item.key, replace(item.value, E'\\n', chr(10))),
        '{}'::jsonb
      )
      from jsonb_each_text(version.sections) as item
    )
where version.topic_id = 'weather'
  and exists (
    select 1
    from jsonb_each_text(version.sections) as item
    where strpos(item.value, E'\\n') > 0
  );
