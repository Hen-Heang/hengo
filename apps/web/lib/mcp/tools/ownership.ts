// Write-time ownership gates.
//
// RLS alone is not enough to authorize a write from an MCP tool: `goals`
// admits reads (and, via `tasks`, writes) from goal *members*, not just the
// owner — a real feature for the in-app collaboration flow, but a
// confused-deputy hazard for an agent acting unattended. These gates enforce
// the stricter rule the plan calls for: MCP writes touch only goals the
// caller owns, even where RLS would technically allow more.
//
// `false` is returned both when the row doesn't exist and when it exists but
// isn't owned by the caller — same NOT_FOUND-shaped answer either way. RLS
// still decides visibility underneath: a goal the caller can't see resolves
// to `false` here for exactly the same reason.
import type { SupabaseClient } from "@supabase/supabase-js"

export async function isGoalOwnedBy(db: SupabaseClient, goalId: string, userId: string): Promise<boolean> {
  const { data, error } = await db.from("goals").select("user_id").eq("id", goalId).maybeSingle()
  if (error || !data) return false
  return data.user_id === userId
}

/** A task is writable when it's the caller's own standalone task, or it sits
 * under a goal the caller owns — never merely a goal the caller was shared into. */
export async function isTaskWritableBy(
  db: SupabaseClient,
  task: { user_id: string; goal_id: string | null },
  userId: string,
): Promise<boolean> {
  if (task.goal_id) return isGoalOwnedBy(db, task.goal_id, userId)
  return task.user_id === userId
}
