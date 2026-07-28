import { beforeEach, describe, expect, it, vi } from "vitest"

const { generateFeedback } = vi.hoisted(() => ({
  generateFeedback: vi.fn(),
}))

vi.mock("@/lib/server/ai-limits", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, limit: 50, used: 0 })),
  recordUsage: vi.fn(async () => undefined),
}))

vi.mock("@/lib/server/korean-coach/feedback", () => ({
  generateKoreanTutorFeedback: generateFeedback,
}))

vi.mock("@/lib/server/korean-coach/http", () => ({
  requireCoachUser: vi.fn(async () => ({ user: { id: "user-1" }, db: {} })),
  coachDataResponse: (data: unknown, mode: string) => Response.json({ data, meta: { mode } }),
  coachErrorResponse: (error: { status: number }) =>
    Response.json({ error }, { status: error.status }),
  simpleCoachError: (code: string, message: string, status: number, retryable = false) =>
    Response.json({ error: { code, message, retryable } }, { status }),
}))

import { POST } from "./route"

beforeEach(() => generateFeedback.mockReset())

describe("POST /api/ai/korean/feedback input validation", () => {
  it("rejects an invalid body before calling the provider", async () => {
    const request = new Request("http://localhost/api/ai/korean/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId: "bad id", transcript: "" }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    expect(generateFeedback).not.toHaveBeenCalled()
    expect(await response.json()).toMatchObject({
      error: { code: "INVALID_REQUEST", retryable: false },
    })
  })
})
