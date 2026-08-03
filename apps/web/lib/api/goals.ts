// ── Goal tracking (ported from Orbit / DailyGoalMap) ─────────────────────────
// Back on Orbit's original Supabase tables (goals / tasks / goal_members /
// goal_stars / notifications) and SECURITY DEFINER RPCs, since KoriAI now shares
// the Orbit Supabase project. Scoping comes from RLS + auth.uid().
import type { Goal, GoalHealthStatus, GoalReviewFrequency } from "@/lib/goals"
import type { GoalKeyResult } from "@/lib/goal-key-results"
import type { Task, TaskSchedulingSource, TaskStatus } from "@/lib/tasks"
import { taskCompletionPatch, taskStatusPatch } from "@/lib/task-status"
import { supabase } from "@/lib/supabase"
import { getUserId, requireUserId } from "@/lib/auth-store"
import { aiPost, authHeaders } from "./ai-client"
import { readSseStream } from "./sse"

export interface CreateGoalPayload {
  title: string
  description?: string
  target_date?: string | null
  no_duration?: boolean
  status?: string
  metadata: Goal["metadata"]
  // ── Outcome fields (Goal System v2) — all optional so the existing
  //    quick-create / template flows keep working unchanged.
  outcome_statement?: string | null
  motivation?: string | null
  baseline_summary?: string | null
  success_definition?: string | null
  weekly_capacity_minutes?: number | null
  review_frequency?: GoalReviewFrequency | null
  health_status?: GoalHealthStatus
  health_reason?: string | null
  last_reviewed_at?: string | null
}

export type UpdateGoalPayload = Partial<CreateGoalPayload>

// Goal member (camelCase, shape kept from the Spring GoalMemberResponse; ids are
// Supabase auth UUIDs now).
export interface GoalMemberDto {
  id: string
  goalId: string
  userId: string
  role: "creator" | "member" | string
  displayName: string | null
  email: string | null
  joinedAt: string | null
  lastSeen: string | null
}

/** One AI-proposed task, before the user has accepted anything. */
export interface AiTaskDraft {
  title: string
  description?: string | null
  start_date: string
  end_date: string
  duration_minutes?: number | null
}

type GoalRow = Goal & {
  goal_stars?: { user_id: string }[]
  tasks?: { id: string; completed: boolean }[]
  goal_key_results?: GoalKeyResult[]
}

// Nested selects → isStarred / taskCounts / keyResults enrichment in one query.
const GOAL_SELECT = "*, goal_stars(user_id), tasks(id, completed), goal_key_results(*)"

function enrichGoal(row: GoalRow): Goal {
  const me = getUserId()
  const { goal_stars, tasks, goal_key_results, ...goal } = row
  const total = tasks?.length ?? 0
  const completed = tasks?.filter((t) => t.completed).length ?? 0
  return {
    ...goal,
    isStarred: Boolean(goal_stars?.some((s) => s.user_id === me)),
    taskCounts: { total, completed, incomplete: total - completed },
    keyResults: goal_key_results ?? [],
  } as Goal
}

export const goalsApi = {
  list: async (status?: string): Promise<Goal[]> => {
    let query = supabase.from("goals").select(GOAL_SELECT).order("created_at", { ascending: false })
    if (status) query = query.eq("status", status)
    const { data, error } = await query
    if (error) throw error
    return (data as unknown as GoalRow[]).map(enrichGoal)
  },

  get: async (id: string): Promise<Goal> => {
    const { data, error } = await supabase.from("goals").select(GOAL_SELECT).eq("id", id).single()
    if (error) throw error
    return enrichGoal(data as unknown as GoalRow)
  },

  create: async (data: CreateGoalPayload): Promise<Goal> => {
    const userId = requireUserId()
    const { data: row, error } = await supabase
      .from("goals")
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description ?? "",
        target_date: data.target_date ?? null,
        no_duration: data.no_duration ?? false,
        status: data.status ?? "active",
        metadata: data.metadata,
        outcome_statement: data.outcome_statement ?? null,
        motivation: data.motivation ?? null,
        baseline_summary: data.baseline_summary ?? null,
        success_definition: data.success_definition ?? null,
        weekly_capacity_minutes: data.weekly_capacity_minutes ?? null,
        review_frequency: data.review_frequency ?? null,
      })
      .select()
      .single()
    if (error) throw error
    // Creator membership row (used by the members list / shared goals).
    const { error: joinError } = await supabase.rpc("join_goal", {
      p_goal_id: row.id,
      p_user_id: userId,
      p_role: "creator",
    })
    if (joinError) throw joinError
    return goalsApi.get(row.id)
  },

  update: async (id: string, data: UpdateGoalPayload): Promise<Goal> => {
    const { error } = await supabase
      .from("goals")
      .update({
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.target_date !== undefined ? { target_date: data.target_date } : {}),
        ...(data.no_duration !== undefined ? { no_duration: data.no_duration } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
        ...(data.outcome_statement !== undefined ? { outcome_statement: data.outcome_statement } : {}),
        ...(data.motivation !== undefined ? { motivation: data.motivation } : {}),
        ...(data.baseline_summary !== undefined ? { baseline_summary: data.baseline_summary } : {}),
        ...(data.success_definition !== undefined ? { success_definition: data.success_definition } : {}),
        ...(data.weekly_capacity_minutes !== undefined
          ? { weekly_capacity_minutes: data.weekly_capacity_minutes }
          : {}),
        ...(data.review_frequency !== undefined ? { review_frequency: data.review_frequency } : {}),
        ...(data.health_status !== undefined ? { health_status: data.health_status } : {}),
        ...(data.health_reason !== undefined ? { health_reason: data.health_reason } : {}),
        ...(data.last_reviewed_at !== undefined ? { last_reviewed_at: data.last_reviewed_at } : {}),
      })
      .eq("id", id)
    if (error) throw error
    return goalsApi.get(id)
  },

  remove: async (id: string) => {
    const { error } = await supabase.from("goals").delete().eq("id", id)
    if (error) throw error
  },

  // Share-link / join-by-code — Orbit's SECURITY DEFINER RPCs (they can read a
  // goal the caller isn't a member of yet).
  previewByShareCode: async (code: string): Promise<Goal> => {
    const { data, error } = await supabase.rpc("get_goal_by_share_code", { p_share_code: code })
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    if (!row) throw new Error("Invalid share code")
    return row as Goal
  },

  joinByShareCode: async (code: string): Promise<Goal> => {
    const goal = await goalsApi.previewByShareCode(code)
    const { error } = await supabase.rpc("join_goal", {
      p_goal_id: goal.id,
      p_user_id: requireUserId(),
      p_role: "member",
    })
    if (error) throw error
    return goalsApi.get(goal.id)
  },

  regenerateShareCode: async (id: string): Promise<{ shareCode: string }> => {
    const { data, error } = await supabase.rpc("regenerate_goal_share_code", { p_goal_id: id })
    if (error) throw error
    const code = Array.isArray(data) ? data[0] : data
    return { shareCode: typeof code === "string" ? code : String(code ?? "") }
  },

  getMembers: async (id: string): Promise<GoalMemberDto[]> => {
    const { data, error } = await supabase.rpc("get_goal_members", { p_goal_id: id })
    if (error) throw error
    type Row = {
      id: string
      goal_id: string
      user_id: string
      role: string
      display_name?: string | null
      email?: string | null
      joined_at?: string | null
      last_seen?: string | null
    }
    return ((data ?? []) as Row[]).map((m) => ({
      id: m.id,
      goalId: m.goal_id,
      userId: m.user_id,
      role: m.role,
      displayName: m.display_name ?? null,
      email: m.email ?? null,
      joinedAt: m.joined_at ?? null,
      lastSeen: m.last_seen ?? null,
    }))
  },

  leaveGoal: async (id: string) => {
    const { error } = await supabase
      .from("goal_members")
      .delete()
      .eq("goal_id", id)
      .eq("user_id", requireUserId())
    if (error) throw error
  },

  removeMember: async (id: string, userId: string) => {
    const { data: member, error } = await supabase
      .from("goal_members")
      .select("id")
      .eq("goal_id", id)
      .eq("user_id", userId)
      .maybeSingle()
    if (error) throw error
    if (!member) return
    const { error: rpcError } = await supabase.rpc("remove_goal_member", { p_member_id: member.id })
    if (rpcError) throw rpcError
  },

  toggleStar: async (id: string): Promise<{ isStarred: boolean }> => {
    const userId = requireUserId()
    const { data: existing, error } = await supabase
      .from("goal_stars")
      .select("goal_id")
      .eq("goal_id", id)
      .eq("user_id", userId)
      .maybeSingle()
    if (error) throw error
    if (existing) {
      const { error: delError } = await supabase
        .from("goal_stars")
        .delete()
        .eq("goal_id", id)
        .eq("user_id", userId)
      if (delError) throw delError
      return { isStarred: false }
    }
    const { error: insError } = await supabase
      .from("goal_stars")
      .insert({ goal_id: id, user_id: userId })
    if (insError) throw insError
    return { isStarred: true }
  },

  getTasks: async (id: string): Promise<Task[]> => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("goal_id", id)
      .order("start_date", { ascending: true })
    if (error) throw error
    return data as Task[]
  },

  // AI task drafts for a goal (server AI key via app/api/ai). Read-only: this
  // returns a draft the user reviews and confirms — nothing is written until
  // `createTasksFromDrafts` is called. See docs/goal-planning-scheduling-audit.md
  // ("Never create tasks without a preview").
  previewTasks: async (
    id: string,
    body?: { count?: number; note?: string },
  ): Promise<AiTaskDraft[]> => {
    const goal = await goalsApi.get(id)
    const { tasks } = await aiPost<{ tasks: AiTaskDraft[] }>("/goals/generate-tasks", {
      goalTitle: goal.title,
      goalDescription: goal.description,
      targetDate: goal.target_date,
      startDate: goal.metadata?.start_date ?? null,
      metadata: goal.metadata,
      count: body?.count,
      note: body?.note,
    })
    return tasks
  },

  // Persist drafts the user explicitly accepted (the review screen passes only
  // the selected subset).
  createTasksFromDrafts: async (id: string, drafts: AiTaskDraft[]): Promise<Task[]> => {
    if (drafts.length === 0) return []
    const userId = requireUserId()
    const { data, error } = await supabase
      .from("tasks")
      .insert(
        drafts.map((t) => ({
          user_id: userId,
          goal_id: id,
          title: t.title,
          description: t.description ?? "",
          start_date: t.start_date,
          end_date: t.end_date,
          duration_minutes: t.duration_minutes ?? null,
          effort_minutes: t.duration_minutes ?? null,
          source: "ai" as const,
          scheduling_source: "ai" as const,
        })),
      )
      .select()
    if (error) throw error
    return data as Task[]
  },

  // Per-goal AI coach chat — SSE stream from the Next.js route (same
  // token / done / error event protocol the Spring stream used).
  coachStream: async (
    id: string,
    message: string,
    history: { role: "user" | "assistant"; content: string }[],
    onToken: (token: string) => void,
    onDone: () => void,
    signal?: AbortSignal,
  ): Promise<void> => {
    const response = await fetch(`/api/ai/goals/coach`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ goalId: id, message, history }),
      signal,
    })
    if (!response.ok) throw new Error(`Coach stream failed: ${response.status}`)

    await readSseStream(response, (event, raw) => {
      if (event === "token") {
        try {
          onToken(JSON.parse(raw).token)
        } catch {
          /* ignore malformed chunk */
        }
      } else if (event === "done") {
        onDone()
      } else if (event === "error") {
        let msg = "Coach is unavailable right now."
        try {
          msg = JSON.parse(raw).message || msg
        } catch {
          /* ignore */
        }
        throw new Error(msg)
      }
    })
  },

  // Sends a goal invitation: a pending row in Orbit's notifications table that
  // the receiver answers via notificationsApi.respond.
  invite: async (id: string, receiverId: string) => {
    const { error } = await supabase.from("notifications").insert({
      type: "goal_invitation",
      goal_id: id,
      sender_id: requireUserId(),
      receiver_id: receiverId,
      invitation_status: "pending",
    })
    if (error) throw error
  },
}

export interface CreateTaskPayload {
  title?: string
  description?: string
  goal_id?: string | null
  start_date: string
  end_date: string
  daily_start_time?: string | null
  daily_end_time?: string | null
  is_anytime?: boolean | null
  duration_minutes?: number | null
  color?: string | null
  tags?: string[]
  completed?: boolean
  // ── Quality + plan/schedule linkage (Goal System v2 / Planning & Scheduling)
  key_result_id?: string | null
  phase_id?: string | null
  schedule_rule_id?: string | null
  occurrence_date?: string | null
  scheduling_source?: TaskSchedulingSource
  effort_minutes?: number | null
  impact_level?: "low" | "medium" | "high" | null
  expected_output?: string | null
  completion_criteria?: string | null
  reschedule_count?: number
  status?: TaskStatus
  blocked_reason?: string | null
  evidence_required?: boolean
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>

export const tasksApi = {
  // Range query backs both the calendar and the "today" widget.
  // goalId omitted = all the user's tasks; goalId null = personal tasks only.
  range: async (params: { from?: string; to?: string; goalId?: string | null }): Promise<Task[]> => {
    let query = supabase.from("tasks").select("*").order("start_date", { ascending: true })
    if (params.from) query = query.gte("end_date", params.from)
    if (params.to) query = query.lte("start_date", params.to)
    if (params.goalId === null) query = query.is("goal_id", null)
    else if (params.goalId) query = query.eq("goal_id", params.goalId)
    const { data, error } = await query
    if (error) throw error
    return data as Task[]
  },

  create: async (data: CreateTaskPayload): Promise<Task> => {
    const { data: row, error } = await supabase
      .from("tasks")
      .insert({ user_id: requireUserId(), ...data })
      .select()
      .single()
    if (error) throw error
    return row as Task
  },

  update: async (id: string, data: UpdateTaskPayload): Promise<Task> => {
    const { data: row, error } = await supabase
      .from("tasks")
      .update({ ...data, updated_by: getUserId() })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return row as Task
  },

  remove: async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id)
    if (error) throw error
  },

  /**
   * Set a task's workflow status. Goes through `taskStatusPatch` so `status`
   * and the legacy `completed` boolean can never drift apart — this is the
   * only sanctioned way to change either (see lib/task-status.ts).
   */
  setStatus: async (
    id: string,
    status: TaskStatus,
    blockedReason?: string | null,
  ): Promise<Task> => tasksApi.update(id, taskStatusPatch(status, blockedReason)),

  /** Toggle completion, deriving the resulting status from the schedule. */
  setCompleted: async (
    task: Pick<Task, "id" | "start_date" | "end_date">,
    completed: boolean,
    todayYmd: string,
  ): Promise<Task> =>
    tasksApi.update(task.id, taskCompletionPatch(completed, task, todayYmd)),

  /**
   * Move a missed task. `reschedule_count` is incremented here (and only here)
   * so the counter means "times this slipped", not "times it was edited" —
   * a plain `update()` that happens to change dates does not bump it.
   */
  reschedule: async (
    task: Pick<Task, "id" | "reschedule_count">,
    data: UpdateTaskPayload,
  ): Promise<Task> => {
    const { data: row, error } = await supabase
      .from("tasks")
      .update({
        ...data,
        scheduling_source: "rescheduled",
        reschedule_count: (task.reschedule_count ?? 0) + 1,
        updated_by: getUserId(),
      })
      .eq("id", task.id)
      .select()
      .single()
    if (error) throw error
    return row as Task
  },

  /**
   * Return a task to the unscheduled backlog (keeps its day, drops the slot).
   *
   * The status has to move too. Dropping only the slot left `status` on its
   * previous value — usually `"scheduled"` — so the row's badge said
   * "Scheduled" while its schedule column said "Unscheduled", and a status
   * filter for `scheduled` still returned tasks sitting in the backlog.
   * `taskStatusPatch` also mirrors `completed`, which is why the boolean is
   * never written by hand here.
   */
  moveToBacklog: async (task: Pick<Task, "id" | "reschedule_count">): Promise<Task> =>
    tasksApi.reschedule(task, {
      daily_start_time: null,
      daily_end_time: null,
      is_anytime: true,
      ...taskStatusPatch("backlog"),
    }),
}

// Goal notifications over Orbit's notifications table; the enriched feed
// (sender display name, goal title) comes from Orbit's RPC.
export interface GoalNotification {
  id: string
  type: string
  goalId: string | null
  senderId: string | null
  receiverId: string | null
  invitationStatus: string | null
  read: boolean
  url: string | null
  senderDisplayName: string | null
  goalTitle: string | null
  createdAt: string | null
}

export const notificationsApi = {
  list: async (onlyUnread = false): Promise<GoalNotification[]> => {
    const { data, error } = await supabase.rpc("get_enriched_notifications", {
      p_user_id: requireUserId(),
      p_limit: 50,
      p_before: null,
      p_only_unread: onlyUnread,
      p_only_invites: false,
    })
    if (error) throw error
    type Row = {
      id: string
      type: string
      goal_id: string | null
      sender_id: string | null
      receiver_id: string | null
      invitation_status: string | null
      read_at: string | null
      url: string | null
      sender_display_name?: string | null
      goal_title?: string | null
      created_at: string | null
    }
    return ((data ?? []) as Row[]).map((n) => ({
      id: n.id,
      type: n.type,
      goalId: n.goal_id,
      senderId: n.sender_id,
      receiverId: n.receiver_id,
      invitationStatus: n.invitation_status,
      read: Boolean(n.read_at),
      url: n.url,
      senderDisplayName: n.sender_display_name ?? null,
      goalTitle: n.goal_title ?? null,
      createdAt: n.created_at,
    }))
  },

  markRead: async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
    if (error) throw error
  },

  respond: async (id: string, accept: boolean) => {
    const { data: notification, error } = await supabase
      .from("notifications")
      .select("goal_id")
      .eq("id", id)
      .single()
    if (error) throw error
    const { error: updateError } = await supabase
      .from("notifications")
      .update({
        invitation_status: accept ? "accepted" : "declined",
        read_at: new Date().toISOString(),
      })
      .eq("id", id)
    if (updateError) throw updateError
    if (accept && notification.goal_id) {
      const { error: joinError } = await supabase.rpc("join_goal", {
        p_goal_id: notification.goal_id,
        p_user_id: requireUserId(),
        p_role: "member",
      })
      if (joinError) throw joinError
    }
  },
}
