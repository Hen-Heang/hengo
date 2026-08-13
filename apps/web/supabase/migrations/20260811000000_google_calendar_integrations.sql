-- Google Calendar integration (Settings > Integrations). One connection per
-- Hengo user for V1. This is a *second*, separate OAuth grant from Google
-- login (auth.identities) — see lib/api/integrations.ts for why it's
-- authorized directly against Google instead of through Supabase Auth.
--
-- Token values are stored as ciphertext (AES-256-GCM, encrypted in
-- lib/server/google-calendar-store.ts with a server-only key) and the two
-- ciphertext columns are never granted to `authenticated`/`anon` at all —
-- not even as ciphertext. Only the service-role client (server-only,
-- SUPABASE_SERVICE_ROLE_KEY) can read or write them, bypassing RLS. Every
-- other column is safe, user-visible metadata gated by RLS.
create table public.kori_google_calendar_integrations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider_account_email text,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  access_token_expires_at timestamptz,
  granted_scopes text,
  status text not null default 'active' check (status in ('active', 'error', 'revoked')),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.kori_google_calendar_integrations enable row level security;

create policy "Users can view their own Google Calendar connection metadata"
  on public.kori_google_calendar_integrations
  for select
  to authenticated
  using (user_id = auth.uid());

-- No insert/update/delete policy for `authenticated` — every write goes
-- through the service-role client. Column-level grant excludes the two
-- ciphertext columns, so even `select *` from the browser's own row fails on
-- those columns instead of returning ciphertext.
revoke all on public.kori_google_calendar_integrations from authenticated, anon;
grant select (
  user_id,
  provider_account_email,
  access_token_expires_at,
  granted_scopes,
  status,
  last_synced_at,
  created_at,
  updated_at
) on public.kori_google_calendar_integrations to authenticated;
