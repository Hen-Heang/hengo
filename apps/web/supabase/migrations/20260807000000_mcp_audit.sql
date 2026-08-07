-- Audit trail for the Hengo MCP server (apps/web/lib/mcp). Every tool call —
-- read or write, success or failure — gets one row here, written
-- fire-and-forget by lib/mcp/audit.ts through the same per-request,
-- RLS-scoped client every tool uses (never a service key). Distinct from
-- kori_ai_usage (which stays the rate-limit bucket via lib/server/ai-limits.ts,
-- feature="mcp.<tool>"): that table has no room for client_id, request_id, or
-- a read/write kind, which this design's audit requirements call for
-- explicitly. Never stores access tokens or user-authored content — shape
-- only (tool name, client, outcome, timing).

create table if not exists public.kori_mcp_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null check (char_length(client_id) <= 200),
  tool_name text not null check (char_length(tool_name) <= 100),
  kind text not null check (kind in ('read', 'write')),
  success boolean not null,
  error_code text check (error_code is null or char_length(error_code) <= 100),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  request_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists kori_mcp_audit_user_created_idx
  on public.kori_mcp_audit (user_id, created_at desc);
create index if not exists kori_mcp_audit_user_tool_idx
  on public.kori_mcp_audit (user_id, tool_name, created_at desc);

alter table public.kori_mcp_audit enable row level security;

-- Insert-only from the app's point of view: a user can see their own
-- connector activity but never edit or delete the record of it (matches
-- kori_ai_usage's grant shape — the GRANT is the actual gate; update/delete
-- are simply never issued).
revoke all on table public.kori_mcp_audit from anon;
grant select, insert on table public.kori_mcp_audit to authenticated;

drop policy if exists "own mcp audit rows" on public.kori_mcp_audit;
create policy "own mcp audit rows" on public.kori_mcp_audit
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
