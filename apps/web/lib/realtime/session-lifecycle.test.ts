import { describe, expect, it } from "vitest"

import {
  isLiveStatus,
  isTerminalStatus,
  nextSessionStatus,
  type VoiceSessionStatus,
} from "./session-lifecycle"

describe("nextSessionStatus", () => {
  it("walks the happy path start → active → ending → completed", () => {
    let status: VoiceSessionStatus = "idle"
    status = nextSessionStatus(status, "start")
    expect(status).toBe("starting")
    status = nextSessionStatus(status, "connected")
    expect(status).toBe("active")
    status = nextSessionStatus(status, "end")
    expect(status).toBe("ending")
    status = nextSessionStatus(status, "summarize")
    expect(status).toBe("summarizing")
    status = nextSessionStatus(status, "summaryReady")
    expect(status).toBe("completed")
  })

  it("handles a reconnect loop", () => {
    expect(nextSessionStatus("active", "disconnect")).toBe("reconnecting")
    expect(nextSessionStatus("reconnecting", "connected")).toBe("active")
  })

  it("can fail from any live-ish status", () => {
    expect(nextSessionStatus("starting", "fail")).toBe("failed")
    expect(nextSessionStatus("active", "fail")).toBe("failed")
    expect(nextSessionStatus("reconnecting", "fail")).toBe("failed")
  })

  it("still completes even if summarizing fails (report is best-effort)", () => {
    expect(nextSessionStatus("summarizing", "fail")).toBe("completed")
  })

  it("ignores invalid transitions instead of throwing", () => {
    expect(nextSessionStatus("idle", "connected")).toBe("idle")
    expect(nextSessionStatus("completed", "disconnect")).toBe("completed")
  })

  it("can restart or reset from a terminal status", () => {
    expect(nextSessionStatus("completed", "reset")).toBe("idle")
    expect(nextSessionStatus("failed", "start")).toBe("starting")
  })
})

describe("status predicates", () => {
  it("classifies live statuses", () => {
    expect(isLiveStatus("active")).toBe(true)
    expect(isLiveStatus("reconnecting")).toBe(true)
    expect(isLiveStatus("starting")).toBe(false)
    expect(isLiveStatus("completed")).toBe(false)
  })
  it("classifies terminal statuses", () => {
    expect(isTerminalStatus("completed")).toBe(true)
    expect(isTerminalStatus("failed")).toBe(true)
    expect(isTerminalStatus("active")).toBe(false)
  })
})
