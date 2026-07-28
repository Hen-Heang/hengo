/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/components/korean-coach/CoachAudioPlayer", () => ({
  CoachAudioPlayer: () => <div>AI-generated voice controls</div>,
}))

import { CoachFeedback } from "./CoachFeedback"
import { MistakeNotebook } from "./MistakeNotebook"
import { createMockTutorFeedback } from "@/lib/korean-coach/mock"
import { KOREAN_COACH_SCENARIOS } from "@/lib/korean-coach/scenarios"

afterEach(cleanup)

describe("Korean Coach feedback and empty notebook rendering", () => {
  it("renders corrected feedback in the required learning order", () => {
    const feedback = createMockTutorFeedback("마감일 언제 있어요?", KOREAN_COACH_SCENARIOS[0])
    const { container } = render(
      <CoachFeedback
        feedback={feedback}
        romanizationMode="always"
        speed={0.75}
        onSpeedChange={vi.fn()}
        onTryAgain={vi.fn()}
        onContinue={vi.fn()}
        onSaveMistakes={vi.fn(async () => undefined)}
        mistakesSaved={false}
      />,
    )
    const text = container.textContent ?? ""
    const positions = [
      "What you said",
      "What was understood",
      "Corrected Korean",
      "Natural Korean",
      "Short explanation",
      "Listen to the correction",
      "Try Again",
      "Continue conversation",
      "Save to mistakes",
    ].map((label) => text.indexOf(label))
    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(screen.getByText(/not an exact pronunciation/i)).toBeTruthy()
  })

  it("shows an honest empty mistake notebook state", () => {
    render(
      <MistakeNotebook
        mistakes={[]}
        onMasteredChange={vi.fn(async () => undefined)}
        onDelete={vi.fn(async () => undefined)}
        onPracticeAgain={vi.fn(async () => undefined)}
      />,
    )
    expect(screen.getByTestId("empty-mistake-notebook")).toBeTruthy()
    expect(screen.getByText("No saved mistakes yet")).toBeTruthy()
  })
})

