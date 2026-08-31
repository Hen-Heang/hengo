import { describe, expect, it } from "vitest"

import {
  buildHengoSessionEntries,
  buildTimeline,
  filterTimelineEntries,
  fromHabitCheckin,
  fromJournalEntry,
  fromManualActivity,
  fromRecoveryCheckin,
  fromTask,
  groupTimelineByDay,
  type TimelineEntry,
} from "./timeline"

describe("fromTask", () => {
  it("returns null for an incomplete task", () => {
    expect(
      fromTask({
        id: "1",
        description: "desc",
        completed: false,
        start_date: "2026-07-01",
        end_date: "2026-07-01",
      }),
    ).toBeNull()
  })

  it("maps a completed task", () => {
    const entry = fromTask({
      id: "1",
      title: "Ship feature",
      description: "desc",
      completed: true,
      start_date: "2026-07-01",
      end_date: "2026-07-02",
      goal_id: "g1",
    })
    expect(entry).toMatchObject({
      kind: "task",
      title: "Ship feature",
      occurredAt: "2026-07-02",
      href: "/goals/g1/tasks",
    })
  })

  it("falls back to the description when there's no title", () => {
    const entry = fromTask({
      id: "1",
      description: "A long task description",
      completed: true,
      start_date: "2026-07-01",
      end_date: "2026-07-01",
    })
    expect(entry?.title).toBe("A long task description")
  })
})

describe("fromHabitCheckin", () => {
  it("returns null for an uncompleted day", () => {
    expect(
      fromHabitCheckin({
        id: "1",
        habitId: "h1",
        habitLabel: "Read",
        date: "2026-07-01",
        completed: false,
      }),
    ).toBeNull()
  })

  it("maps a completed check-in", () => {
    const entry = fromHabitCheckin({
      id: "1",
      habitId: "h1",
      habitLabel: "Read",
      date: "2026-07-01",
      completed: true,
    })
    expect(entry).toMatchObject({ kind: "habit_checkin", title: "Read — checked in" })
  })
})

describe("buildHengoSessionEntries", () => {
  it("merges same-day, same-feature rows into a single entry with summed duration", () => {
    const entries = buildHengoSessionEntries([
      { feature: "vocab", durationMs: 60_000, createdAt: "2026-07-01T09:00:00.000Z" },
      { feature: "vocab", durationMs: 120_000, createdAt: "2026-07-01T14:00:00.000Z" },
      { feature: "reading", durationMs: 30_000, createdAt: "2026-07-01T10:00:00.000Z" },
    ])
    const vocab = entries.find((e) => e.id.includes("vocab"))
    expect(vocab?.durationMinutes).toBe(3)
    expect(entries).toHaveLength(2)
  })

  it("keeps separate days as separate entries", () => {
    const entries = buildHengoSessionEntries([
      { feature: "vocab", durationMs: 60_000, createdAt: "2026-07-01T09:00:00.000Z" },
      { feature: "vocab", durationMs: 60_000, createdAt: "2026-07-02T09:00:00.000Z" },
    ])
    expect(entries).toHaveLength(2)
  })
})

describe("fromJournalEntry", () => {
  it("falls back to achievement when title and content are both empty (the daily-template case)", () => {
    const entry = fromJournalEntry({
      id: "1",
      occurredAt: "2026-07-26T00:00:00.000Z",
      content: "",
      achievement: "Shipped the feature",
    })
    expect(entry.title).toBe("Shipped the feature")
  })

  it("prefers title, then content, over achievement", () => {
    expect(
      fromJournalEntry({
        id: "1",
        occurredAt: "2026-07-26T00:00:00.000Z",
        title: "My day",
        content: "",
        achievement: "x",
      }).title,
    ).toBe("My day")
    expect(
      fromJournalEntry({
        id: "1",
        occurredAt: "2026-07-26T00:00:00.000Z",
        content: "Free-form notes",
        achievement: "x",
      }).title,
    ).toBe("Free-form notes")
  })
})

describe("fromManualActivity / fromRecoveryCheckin", () => {
  it("carries category into tags", () => {
    const entry = fromManualActivity({
      id: "1",
      occurredAt: "2026-07-01T09:00:00.000Z",
      label: "Went for a run",
      category: "exercise",
    })
    expect(entry.tags).toEqual(["exercise"])
  })

  it("never surfaces anything beyond the user's own free text for recovery check-ins", () => {
    const entry = fromRecoveryCheckin({ id: "1", date: "2026-07-01", win: "Stayed calm" })
    expect(entry.title).toBe("Check-in — Stayed calm")
    expect(JSON.stringify(entry)).not.toMatch(/habit/i)
  })
})

describe("buildTimeline", () => {
  it("merges all sources and sorts newest first", () => {
    const entries = buildTimeline({
      tasks: [
        {
          id: "t1",
          description: "d",
          completed: true,
          start_date: "2026-07-01",
          end_date: "2026-07-01",
        },
      ],
      journalEntries: [{ id: "j1", occurredAt: "2026-07-05T00:00:00.000Z", content: "reflection" }],
    })
    expect(entries.map((e) => e.kind)).toEqual(["journal", "task"])
  })

  it("excludes incomplete tasks", () => {
    const entries = buildTimeline({
      tasks: [
        {
          id: "t1",
          description: "d",
          completed: false,
          start_date: "2026-07-01",
          end_date: "2026-07-01",
        },
      ],
    })
    expect(entries).toHaveLength(0)
  })
})

describe("filterTimelineEntries", () => {
  const entries: TimelineEntry[] = [
    { id: "1", kind: "task", occurredAt: "2026-07-01T00:00:00.000Z", title: "Ship feature" },
    {
      id: "2",
      kind: "journal",
      occurredAt: "2026-07-01T00:00:00.000Z",
      title: "Reflection on Korean practice",
    },
  ]

  it("filters by kind", () => {
    expect(filterTimelineEntries(entries, { kind: "journal" }).map((e) => e.id)).toEqual(["2"])
  })

  it("matches query against title", () => {
    expect(filterTimelineEntries(entries, { query: "korean" }).map((e) => e.id)).toEqual(["2"])
  })
})

describe("groupTimelineByDay", () => {
  it("groups entries by local day, newest day first", () => {
    const entries: TimelineEntry[] = [
      {
        id: "1",
        kind: "hengo_session",
        occurredAt: "2026-07-02T09:00:00.000Z",
        title: "5 min",
        durationMinutes: 5,
      },
      { id: "2", kind: "manual_activity", occurredAt: "2026-07-01T09:00:00.000Z", title: "Ran 5k" },
    ]
    const summary = groupTimelineByDay(entries)
    expect(summary.map((d) => d.date)).toEqual(["2026-07-02", "2026-07-01"])
    expect(summary[0].hengoMinutes).toBe(5)
    expect(summary[1].manualActivityCount).toBe(1)
  })
})
