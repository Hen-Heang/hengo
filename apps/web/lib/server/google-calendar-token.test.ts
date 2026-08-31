import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  getGoogleCalendarTokens,
  markGoogleCalendarIntegrationError,
  updateGoogleCalendarAccessToken,
} = vi.hoisted(() => ({
  getGoogleCalendarTokens: vi.fn(),
  markGoogleCalendarIntegrationError: vi.fn(async () => undefined),
  updateGoogleCalendarAccessToken: vi.fn(async () => undefined),
}))

const { refreshGoogleAccessToken } = vi.hoisted(() => ({
  refreshGoogleAccessToken: vi.fn(),
}))

vi.mock("@/lib/server/google-calendar-store", () => ({
  getGoogleCalendarTokens,
  markGoogleCalendarIntegrationError,
  updateGoogleCalendarAccessToken,
}))

vi.mock("@/lib/server/google-calendar-oauth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/google-calendar-oauth")>(
    "@/lib/server/google-calendar-oauth",
  )
  return { ...actual, refreshGoogleAccessToken }
})

import { GoogleCalendarNotConnectedError, getValidGoogleAccessToken } from "./google-calendar-token"
import { GoogleCalendarReauthRequiredError } from "./google-calendar-oauth"

beforeEach(() => {
  getGoogleCalendarTokens.mockReset()
  markGoogleCalendarIntegrationError.mockReset().mockResolvedValue(undefined)
  updateGoogleCalendarAccessToken.mockReset().mockResolvedValue(undefined)
  refreshGoogleAccessToken.mockReset()
})

describe("getValidGoogleAccessToken", () => {
  it("throws GoogleCalendarNotConnectedError when there is no stored connection", async () => {
    getGoogleCalendarTokens.mockResolvedValue(null)
    await expect(getValidGoogleAccessToken("user-1")).rejects.toBeInstanceOf(
      GoogleCalendarNotConnectedError,
    )
  })

  it("returns the stored access token without refreshing when it is still valid", async () => {
    getGoogleCalendarTokens.mockResolvedValue({
      accessToken: "still-valid",
      refreshToken: "refresh-1",
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    })
    const token = await getValidGoogleAccessToken("user-1")
    expect(token).toBe("still-valid")
    expect(refreshGoogleAccessToken).not.toHaveBeenCalled()
  })

  it("refreshes an expired token and persists the new access token", async () => {
    getGoogleCalendarTokens.mockResolvedValue({
      accessToken: "expired",
      refreshToken: "refresh-1",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    })
    const newExpiresAt = new Date(Date.now() + 3600_000)
    refreshGoogleAccessToken.mockResolvedValue({
      accessToken: "fresh",
      refreshToken: null,
      expiresAt: newExpiresAt,
    })

    const token = await getValidGoogleAccessToken("user-1")

    expect(token).toBe("fresh")
    expect(refreshGoogleAccessToken).toHaveBeenCalledWith("refresh-1")
    // Google didn't return a new refresh token — the existing one must be
    // preserved, never overwritten with null.
    expect(updateGoogleCalendarAccessToken).toHaveBeenCalledWith({
      userId: "user-1",
      accessToken: "fresh",
      refreshToken: null,
      expiresAt: newExpiresAt,
    })
  })

  it("marks the connection as errored and throws when there is no refresh token to use", async () => {
    getGoogleCalendarTokens.mockResolvedValue({
      accessToken: "expired",
      refreshToken: null,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    })

    await expect(getValidGoogleAccessToken("user-1")).rejects.toBeInstanceOf(
      GoogleCalendarReauthRequiredError,
    )
    expect(markGoogleCalendarIntegrationError).toHaveBeenCalledWith("user-1")
  })

  it("marks the connection as errored when Google rejects the refresh grant", async () => {
    getGoogleCalendarTokens.mockResolvedValue({
      accessToken: "expired",
      refreshToken: "revoked-refresh-token",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    })
    refreshGoogleAccessToken.mockRejectedValue(new GoogleCalendarReauthRequiredError())

    await expect(getValidGoogleAccessToken("user-1")).rejects.toBeInstanceOf(
      GoogleCalendarReauthRequiredError,
    )
    expect(markGoogleCalendarIntegrationError).toHaveBeenCalledWith("user-1")
    expect(updateGoogleCalendarAccessToken).not.toHaveBeenCalled()
  })
})
