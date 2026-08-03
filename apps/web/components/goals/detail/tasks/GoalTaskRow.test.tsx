/** @vitest-environment jsdom */

// Proves the two presentations of a task are the same business state, not two
// independently-written label sets. Every assertion here is semantic (visible
// text / aria state), never a snapshot.

import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { Task } from "@/lib/tasks"
import { isTaskUnscheduled } from "@/lib/task-status"

import { GoalTaskRow, type GoalTaskRowProps } from "./GoalTaskRow"

const TODAY = "2026-07-22"

let seq = 0
const task = (overrides: Partial<Task> = {}): Task => ({
  id: `t${++seq}`,
  description: "",
  completed: false,
  user_id: "u1",
  title: "Ship the API audit",
  start_date: "2026-07-25",
  end_date: "2026-07-25",
  daily_start_time: "09:00",
  daily_end_time: "10:00",
  is_anytime: false,
  duration_minutes: 60,
  ...overrides,
})

const noop = () => {}

const renderRow = (t: Task, variant: GoalTaskRowProps["variant"]) =>
  render(
    <ul>
      <GoalTaskRow
        task={t}
        todayYmd={TODAY}
        variant={variant}
        onToggleCompleted={noop}
        onOpen={noop}
        onSetStatus={noop}
        onSchedule={noop}
        onMoveToBacklog={noop}
        onDelete={noop}
      />
    </ul>,
  )

/** Visible text of the row, whitespace-normalised. */
const rowText = (): string =>
  screen.getByRole("listitem").textContent?.replace(/\s+/g, " ").trim() ?? ""

afterEach(cleanup)

// A task after "Move to backlog": tasksApi.moveToBacklog keeps start/end_date
// and only nulls the time slot, so `taskDueDate` still returns a day.
const backlogged = () =>
  task({ is_anytime: true, daily_start_time: null, daily_end_time: null })

describe("GoalTaskRow — schedule labelling", () => {
  it("is the exact shape moveToBacklog produces", () => {
    // Guards the premise of the regression below: if moveToBacklog ever starts
    // clearing the dates too, this fixture stops being representative.
    const t = backlogged()
    expect(isTaskUnscheduled(t, TODAY)).toBe(true)
    expect(t.start_date).toBeTruthy()
  })

  it.each(["card", "row"] as const)(
    "says Unscheduled for a backlogged task in the %s variant",
    (variant) => {
      renderRow(backlogged(), variant)
      expect(rowText()).toContain("Unscheduled")
    },
  )

  it.each(["card", "row"] as const)(
    "shows the plain date for a properly scheduled task in the %s variant",
    (variant) => {
      renderRow(task(), variant)
      const text = rowText()
      expect(text).toContain("2026-07-25")
      expect(text).not.toContain("Unscheduled")
    },
  )

  it("labels the two variants identically for the same task", () => {
    const t = backlogged()

    renderRow(t, "card")
    const card = rowText()
    cleanup()
    renderRow(t, "row")
    const row = rowText()

    // Both must agree on the schedule wording — the bug was that neither said
    // "Unscheduled" while the chip counting them did.
    expect(card.includes("Unscheduled")).toBe(row.includes("Unscheduled"))
  })
})

describe("GoalTaskRow — status must match stored state", () => {
  it.each(["card", "row"] as const)("renders Blocked on %s, never hidden", (variant) => {
    renderRow(task({ status: "blocked", blocked_reason: "waiting on review" }), variant)
    const text = rowText()
    expect(text).toContain("Blocked")
    // Mobile must not drop a critical status or its reason.
    expect(text).toContain("waiting on review")
  })

  it.each(["card", "row"] as const)("renders Overdue on %s for a past-due open task", (variant) => {
    renderRow(task({ start_date: "2026-07-20", end_date: "2026-07-20" }), variant)
    expect(rowText()).toContain("Overdue")
  })

  it.each(["card", "row"] as const)(
    "never calls a completed past-due task overdue on %s",
    (variant) => {
      renderRow(task({ start_date: "2026-07-20", end_date: "2026-07-20", completed: true }), variant)
      const text = rowText()
      expect(text).not.toContain("Overdue")
      expect(text).toContain("Completed")
    },
  )

  it.each(["card", "row"] as const)(
    "reflects legacy completed=true over a stale status on %s",
    (variant) => {
      // Orbit can only flip the boolean; `completed` wins on disagreement.
      renderRow(task({ completed: true, status: "in_progress" }), variant)
      const text = rowText()
      expect(text).toContain("Completed")
      expect(text).not.toContain("In progress")
    },
  )

  it.each(["card", "row"] as const)(
    "checks the completion control exactly when the task is done on %s",
    (variant) => {
      renderRow(task({ completed: true }), variant)
      const done = screen.getByRole("button", { name: /Mark .* not done/ })
      expect(done.getAttribute("aria-pressed")).toBe("true")

      cleanup()
      renderRow(task({ completed: false }), variant)
      const open = screen.getByRole("button", { name: /Mark .* done/ })
      expect(open.getAttribute("aria-pressed")).toBe("false")
    },
  )
})

describe("GoalTaskRow — evidence indicator", () => {
  it.each(["card", "row"] as const)("only claims evidence when required on %s", (variant) => {
    renderRow(task(), variant)
    expect(rowText()).not.toContain("Evidence")

    cleanup()
    renderRow(task({ evidence_required: true }), variant)
    const el = screen.getByRole("listitem")
    const hasEvidence =
      el.textContent?.includes("Evidence") ||
      within(el).queryByLabelText("Evidence required") !== null
    expect(hasEvidence).toBe(true)
  })
})

describe("GoalTaskRow — actions", () => {
  it("toggles completion through the shared handler", async () => {
    const onToggleCompleted = vi.fn()
    const t = task()
    render(
      <ul>
        <GoalTaskRow
          task={t}
          todayYmd={TODAY}
          variant="row"
          onToggleCompleted={onToggleCompleted}
          onOpen={noop}
          onSetStatus={noop}
          onSchedule={noop}
          onMoveToBacklog={noop}
          onDelete={noop}
        />
      </ul>,
    )
    screen.getByRole("button", { name: /Mark .* done/ }).click()
    expect(onToggleCompleted).toHaveBeenCalledWith(t)
  })
})
