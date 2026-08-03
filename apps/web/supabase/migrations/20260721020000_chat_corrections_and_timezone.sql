-- Extends kori_corrections so automatic chat-turn analysis (and, optionally,
-- categorized manual correction checks) can dedupe repeated mistakes into one
-- card instead of creating unlimited duplicates, and adds a per-user
-- timezone so daily features (mission, streak, daily phrase) can key off
-- Korea time by default without hardcoding it everywhere.

alter table public.kori_corrections
  add column if not exists source_feature text not null default 'manual_check',
  add column if not exists source_id text,
  add column if not exists error_category text,
  add column if not exists severity text check (severity in ('minor', 'important')),
  add column if not exists natural_version text,
  add column if not exists fingerprint text,
  add column if not exists occurrence_count integer not null default 1,
  add column if not exists last_seen_at timestamptz not null default now();

-- Backfill fingerprint for pre-existing rows (normalized original::corrected::general,
-- matching lib/learning/korean-text.ts createCorrectionFingerprint's default
-- category) so the unique index below can be created safely.
update public.kori_corrections
set fingerprint = lower(trim(both from regexp_replace(original_text, '\s+', ' ', 'g')))
  || '::' || lower(trim(both from regexp_replace(corrected_text, '\s+', ' ', 'g')))
  || '::general'
where fingerprint is null;

alter table public.kori_corrections alter column fingerprint set not null;

create unique index if not exists kori_corrections_user_fingerprint_idx
  on public.kori_corrections (user_id, fingerprint);

create index if not exists kori_corrections_user_source_idx
  on public.kori_corrections (user_id, source_feature, created_at desc);

alter table public.kori_profiles
  add column if not exists timezone text not null default 'Asia/Seoul';
