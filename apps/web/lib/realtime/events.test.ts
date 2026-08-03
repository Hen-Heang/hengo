import { describe, expect, it } from "vitest"

import {
  buildBootstrapEvents,
  contentTypeForRole,
  conversationItemCreate,
  hasMeaningfulHistory,
  limitBootstrapHistory,
  MAX_BOOTSTRAP_MESSAGES,
  responseCreate,
  shouldCreateInitialResponse,
  type RealtimeBootstrapMessage,
} from "./events"

function msg(role: "user" | "assistant", text: string, id = `${role}-${text}`): RealtimeBootstrapMessage {
  return { id, role, text }
}

describe("contentTypeForRole", () => {
  it("uses input_text for user and text for assistant", () => {
    expect(contentTypeForRole("user")).toBe("input_text")
    expect(contentTypeForRole("assistant")).toBe("text")
  })
})

describe("conversationItemCreate", () => {
  it("builds a user message item with input_text", () => {
    expect(conversationItemCreate("user", "안녕하세요")).toEqual({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: "안녕하세요" }],
      },
    })
  })

  it("builds an assistant message item with text", () => {
    expect(conversationItemCreate("assistant", "네, 반가워요").item.content[0].type).toBe("text")
  })
})

describe("responseCreate", () => {
  it("is a bare response.create event", () => {
    expect(responseCreate()).toEqual({ type: "response.create" })
  })
})

describe("limitBootstrapHistory", () => {
  it("trims whitespace and drops empty messages", () => {
    const result = limitBootstrapHistory([
      msg("user", "  hi   there  "),
      msg("assistant", "   "),
      msg("user", ""),
    ])
    expect(result).toHaveLength(1)
    expect(result[0].text).toBe("hi there")
  })

  it("keeps only the last N messages in order", () => {
    const many = Array.from({ length: 20 }, (_, i) => msg("user", `m${i}`, `id-${i}`))
    const result = limitBootstrapHistory(many, 12)
    expect(result).toHaveLength(12)
    expect(result[0].text).toBe("m8")
    expect(result[11].text).toBe("m19")
  })

  it("defaults to MAX_BOOTSTRAP_MESSAGES", () => {
    const many = Array.from({ length: 30 }, (_, i) => msg("assistant", `m${i}`, `id-${i}`))
    expect(limitBootstrapHistory(many)).toHaveLength(MAX_BOOTSTRAP_MESSAGES)
  })
})

describe("hasMeaningfulHistory", () => {
  it("is false for empty or whitespace-only history", () => {
    expect(hasMeaningfulHistory([])).toBe(false)
    expect(hasMeaningfulHistory([msg("user", "   ")])).toBe(false)
  })

  it("is true when any message has text", () => {
    expect(hasMeaningfulHistory([msg("user", "안녕")])).toBe(true)
  })
})

describe("shouldCreateInitialResponse", () => {
  it("greets when there is no history", () => {
    expect(shouldCreateInitialResponse([])).toBe(true)
  })

  it("answers when the last message is from the learner", () => {
    expect(shouldCreateInitialResponse([msg("assistant", "a"), msg("user", "b")])).toBe(true)
  })

  it("waits when the last message is from the assistant", () => {
    expect(shouldCreateInitialResponse([msg("user", "a"), msg("assistant", "b")])).toBe(false)
  })
})

describe("buildBootstrapEvents", () => {
  it("maps each message to a conversation.item.create with the right content type", () => {
    const events = buildBootstrapEvents([msg("user", "질문"), msg("assistant", "답변")])
    expect(events).toHaveLength(2)
    expect(events[0].item.role).toBe("user")
    expect(events[0].item.content[0].type).toBe("input_text")
    expect(events[1].item.role).toBe("assistant")
    expect(events[1].item.content[0].type).toBe("text")
  })
})
