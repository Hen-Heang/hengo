import { describe, expect, it } from "vitest"
import { ALLOWED_AI_MODELS, resolveAllowedModel } from "./models"

describe("resolveAllowedModel", () => {
  it("returns the requested model when it is on the allowlist", () => {
    expect(resolveAllowedModel("gpt-5-nano")).toBe("gpt-5-nano")
  })

  it("falls back to the default for an unlisted model", () => {
    expect(resolveAllowedModel("gpt-4o")).toBe("gpt-5-mini")
  })

  it("falls back to the default for null/undefined/empty", () => {
    expect(resolveAllowedModel(null)).toBe("gpt-5-mini")
    expect(resolveAllowedModel(undefined)).toBe("gpt-5-mini")
    expect(resolveAllowedModel("")).toBe("gpt-5-mini")
  })

  it("rejects arbitrary strings that aren't real model ids", () => {
    expect(resolveAllowedModel("'; DROP TABLE users; --")).toBe("gpt-5-mini")
  })

  it("every allowlisted model resolves to itself", () => {
    for (const model of ALLOWED_AI_MODELS) {
      expect(resolveAllowedModel(model)).toBe(model)
    }
  })
})
