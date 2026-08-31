import { beforeEach, describe, expect, it, vi } from "vitest"

const { getValidGoogleAccessToken } = vi.hoisted(() => ({
  getValidGoogleAccessToken: vi.fn(async () => "test-access-token"),
}))
const { recordGoogleCalendarSync } = vi.hoisted(() => ({
  recordGoogleCalendarSync: vi.fn(async () => undefined),
}))

vi.mock("@/lib/server/google-calendar-token", () => ({ getValidGoogleAccessToken }))
vi.mock("@/lib/server/google-calendar-store", () => ({ recordGoogleCalendarSync }))

import { getEvents, getFreeBusy, normalizeGoogleEvent } from "./google-calendar-client"

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response
}

beforeEach(() => {
  getValidGoogleAccessToken.mockClear()
  recordGoogleCalendarSync.mockClear()
  vi.stubGlobal("fetch", vi.fn())
})

describe("normalizeGoogleEvent", () => {
  it("normalizes a timed event", () => {
    const result = normalizeGoogleEvent(
      {
        id: "evt-1",
        summary: "1:1 with manager",
        start: { dateTime: "2026-08-12T09:00:00+09:00" },
        end: { dateTime: "2026-08-12T09:30:00+09:00" },
      },
      "primary",
    )
    expect(result).toEqual({
      id: "evt-1",
      source: "google",
      calendarId: "primary",
      title: "1:1 with manager",
      start: "2026-08-12T09:00:00+09:00",
      end: "2026-08-12T09:30:00+09:00",
      allDay: false,
      readOnly: true,
    })
  })

  it("normalizes an all-day event using the date-only fields", () => {
    const result = normalizeGoogleEvent(
      {
        id: "evt-2",
        summary: "Company holiday",
        start: { date: "2026-08-15" },
        end: { date: "2026-08-16" },
      },
      "primary",
    )
    expect(result?.allDay).toBe(true)
    expect(result?.start).toBe("2026-08-15")
  })

  it("falls back to a placeholder title when the event has none", () => {
    const result = normalizeGoogleEvent(
      {
        id: "evt-3",
        start: { dateTime: "2026-08-12T09:00:00Z" },
        end: { dateTime: "2026-08-12T09:30:00Z" },
      },
      "primary",
    )
    expect(result?.title).toBe("(No title)")
  })

  it("drops cancelled events", () => {
    const result = normalizeGoogleEvent(
      {
        id: "evt-4",
        status: "cancelled",
        start: { dateTime: "2026-08-12T09:00:00Z" },
        end: { dateTime: "2026-08-12T09:30:00Z" },
      },
      "primary",
    )
    expect(result).toBeNull()
  })

  it("drops events missing start or end", () => {
    expect(normalizeGoogleEvent({ id: "evt-5" }, "primary")).toBeNull()
  })
})

describe("getEvents", () => {
  const timeMin = "2026-08-10T00:00:00Z"
  const timeMax = "2026-08-17T00:00:00Z"

  it("rejects an inverted or invalid range", async () => {
    await expect(getEvents("user-1", { timeMin: timeMax, timeMax: timeMin })).rejects.toThrow()
  })

  it("rejects a range spanning more than ~3 months", async () => {
    await expect(
      getEvents("user-1", { timeMin: "2026-01-01T00:00:00Z", timeMax: "2026-12-01T00:00:00Z" }),
    ).rejects.toThrow(/3 months/)
  })

  it("follows pagination and merges events across pages, then records a sync", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          timeZone: "Asia/Seoul",
          items: [
            {
              id: "evt-1",
              summary: "First",
              start: { dateTime: "2026-08-11T09:00:00Z" },
              end: { dateTime: "2026-08-11T09:30:00Z" },
            },
          ],
          nextPageToken: "page-2",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          timeZone: "Asia/Seoul",
          items: [
            {
              id: "evt-2",
              summary: "Second",
              start: { dateTime: "2026-08-12T09:00:00Z" },
              end: { dateTime: "2026-08-12T09:30:00Z" },
            },
          ],
        }),
      )

    const result = await getEvents("user-1", { timeMin, timeMax })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result.timeZone).toBe("Asia/Seoul")
    expect(result.events.map((e) => e.id)).toEqual(["evt-1", "evt-2"])
    expect(recordGoogleCalendarSync).toHaveBeenCalledWith("user-1")
  })
})

describe("getFreeBusy", () => {
  it("maps busy blocks per requested calendar and defaults missing ones to empty", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        calendars: {
          primary: { busy: [{ start: "2026-08-11T09:00:00Z", end: "2026-08-11T10:00:00Z" }] },
        },
      }),
    )

    const result = await getFreeBusy("user-1", {
      timeMin: "2026-08-11T00:00:00Z",
      timeMax: "2026-08-12T00:00:00Z",
      calendarIds: ["primary", "team@example.com"],
    })

    expect(result).toEqual([
      {
        calendarId: "primary",
        busy: [{ start: "2026-08-11T09:00:00Z", end: "2026-08-11T10:00:00Z" }],
      },
      { calendarId: "team@example.com", busy: [] },
    ])
  })
})
