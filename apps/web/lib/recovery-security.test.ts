import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"

import { recoveryCoachInputSchema, urgeEventInputSchema, weeklyReviewInputSchema, whenThenPlanInputSchema } from "./recovery-schemas"
import { DEFAULT_RECOVERY_NOTIFICATION_TEXT, recoveryNotificationText } from "./recovery-notifications"

const migration = readFileSync(join(process.cwd(), "supabase/migrations/20260719045208_recovery_workspace.sql"), "utf8")
const recoveryTables = [
  "kori_focus_habits",
  "kori_focus_triggers",
  "kori_focus_events",
  "kori_focus_plans",
  "kori_focus_daily_checkins",
  "kori_focus_protection_items",
  "kori_focus_weekly_reviews",
  "kori_focus_support_contacts",
  "kori_focus_privacy_settings",
]

describe("Recovery security contract", () => {
  it("enables RLS, removes anon privileges, grants authenticated CRUD, and adds owner guards for every table", () => {
    for (const table of recoveryTables) {
      expect(migration).toContain(`alter table public.${table} enable row level security`)
      expect(migration).toContain(`revoke all on table public.${table} from anon`)
      expect(migration).toContain(`grant select, insert, update, delete on table public.${table} to authenticated`)
    }
    expect(migration).toContain("table_name || '_owner_guard'")
    expect(migration).toContain("with check ((select auth.uid()) is not null and (select auth.uid()) = user_id)")
    expect(migration).toContain("h.user_id = (select auth.uid())")
  })

  it("requires explicit consent and strips fields outside the AI allowlist", () => {
    expect(recoveryCoachInputSchema.safeParse({ mode: "urge" }).success).toBe(false)
    const parsed = recoveryCoachInputSchema.parse({ consent: true, mode: "urge", intensity: 7, privateNote: "must not pass" })
    expect(parsed).toEqual({ consent: true, mode: "urge", intensity: 7, preferredActions: [] })
    expect("privateNote" in parsed).toBe(false)
  })

  it("allows urgent events without optional sensitive context", () => {
    expect(urgeEventInputSchema.parse({ kind: "moment" })).toEqual({ kind: "moment" })
  })

  it("validates implementation intentions and AI review consent", () => {
    expect(whenThenPlanInputSchema.safeParse({ ifText: " ", thenText: "Take a walk" }).success).toBe(false)
    expect(weeklyReviewInputSchema.safeParse({ weekStart: "2026-07-13", statistics: {}, aiSummary: "Private summary" }).success).toBe(false)
  })

  it("fails unauthenticated AI coach requests before an AI call", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key")
    const { POST: recoveryCoachPost } = await import("@/app/api/ai/recovery-coach/route")
    const response = await recoveryCoachPost(new Request("http://localhost/api/ai/recovery-coach", { method: "POST", body: JSON.stringify({ consent: true, mode: "urge" }) }))
    expect(response.status).toBe(401)
  })

  it("uses discreet notification wording by default and never needs a target label", () => {
    const settings = { lockEnabled: false, discreetNotifications: true, morningReminder: false, eveningReminder: false, riskTimeReminder: false, bedtimeReminder: false, weeklyReviewReminder: false, aiConsent: false }
    expect(recoveryNotificationText(settings)).toBe(DEFAULT_RECOVERY_NOTIFICATION_TEXT)
    expect(DEFAULT_RECOVERY_NOTIFICATION_TEXT).toBe("Your Hengo check-in is ready.")
  })
})
