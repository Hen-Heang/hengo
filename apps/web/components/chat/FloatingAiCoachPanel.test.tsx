/** @vitest-environment jsdom */

import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({
  conversations: [] as Array<{ id: string; conversationType?: string }>,
  isLoading: false,
  createConversation: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock("@/hooks/useConversations", () => ({
  useConversations: () => ({
    conversations: state.conversations,
    isLoading: state.isLoading,
    refresh: state.refresh,
  }),
}))

vi.mock("@/lib/api", () => ({
  chatApi: {
    createConversation: state.createConversation,
  },
  getApiErrorMessage: (_cause: unknown, fallback: string) => fallback,
}))

vi.mock("@/components/chat/ChatWindow", () => ({
  ChatWindow: ({ conversationId, compact }: { conversationId: string; compact?: boolean }) => (
    <div data-testid="chat-window">
      {conversationId}:{compact ? "compact" : "full"}
    </div>
  ),
}))

import { FloatingAiCoachPanel } from "./FloatingAiCoachPanel"

beforeEach(() => {
  state.conversations = []
  state.isLoading = false
  state.createConversation.mockReset()
  state.refresh.mockReset()
  state.refresh.mockResolvedValue(undefined)
})

afterEach(cleanup)

describe("FloatingAiCoachPanel", () => {
  it("resumes the most recent free chat in compact mode", async () => {
    state.conversations = [
      { id: "scenario-1", conversationType: "SCENARIO" },
      { id: "free-1", conversationType: "FREE_CHAT" },
    ]

    render(<FloatingAiCoachPanel active />)

    expect((await screen.findByTestId("chat-window")).textContent).toContain("free-1:compact")
    expect(state.createConversation).not.toHaveBeenCalled()
  })

  it("creates a free chat when no reusable conversation exists", async () => {
    state.conversations = [{ id: "scenario-1", conversationType: "SCENARIO" }]
    state.createConversation.mockResolvedValue({ id: "free-new" })

    render(<FloatingAiCoachPanel active />)

    await waitFor(() => {
      expect(screen.getByTestId("chat-window").textContent).toContain("free-new:compact")
    })
    expect(state.createConversation).toHaveBeenCalledWith("General Practice", "FREE_CHAT")
  })

  it("shows an explicit unavailable state when a chat cannot be created", async () => {
    state.createConversation.mockRejectedValue(new Error("offline"))

    render(<FloatingAiCoachPanel active />)

    expect(await screen.findByText("Hengo Coach is unavailable")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Open full coach" }).getAttribute("href")).toBe("/chat")
  })
})
