import { openai } from "@ai-sdk/openai"
import { generateText, Output } from "ai"
import { getKoreanCoachScenario } from "@/lib/korean-coach/scenarios"
import {
  feedbackRequestSchema,
  koreanTutorFeedbackSchema,
  type KoreanTutorFeedback,
} from "@/lib/korean-coach/schemas"
import { createMockTutorFeedback, isKoreanCoachMockMode } from "@/lib/korean-coach/mock"
import { buildKoreanTutorPrompt, KOREAN_TUTOR_SYSTEM_PROMPT } from "@/lib/korean-coach/tutor-prompt"
import { KOREAN_COACH_FEEDBACK_TIMEOUT_MS, KOREAN_COACH_TEXT_MODEL } from "./config"
import { CoachServiceError, sanitizeProviderError } from "./errors"

export interface TutorFeedbackResult {
  feedback: KoreanTutorFeedback
  model: string
  mode: "live" | "mock"
}

export async function generateKoreanTutorFeedback(rawInput: unknown): Promise<TutorFeedbackResult> {
  const input = feedbackRequestSchema.parse(rawInput)
  const scenario = getKoreanCoachScenario(input.scenarioId)
  if (!scenario) {
    throw new CoachServiceError({
      code: "INVALID_REQUEST",
      message: "That practice scenario does not exist.",
      retryable: false,
      status: 404,
    })
  }

  if (isKoreanCoachMockMode()) {
    return {
      feedback: createMockTutorFeedback(input.transcript, scenario),
      model: "mock-feedback",
      mode: "mock",
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new CoachServiceError({
      code: "AI_NOT_CONFIGURED",
      message: "Korean Coach is not configured. Add OPENAI_API_KEY or enable explicit mock mode.",
      retryable: false,
      status: 503,
    })
  }

  try {
    const result = await generateText({
      model: openai(KOREAN_COACH_TEXT_MODEL),
      output: Output.object({ schema: koreanTutorFeedbackSchema }),
      system: KOREAN_TUTOR_SYSTEM_PROMPT,
      prompt: buildKoreanTutorPrompt({ ...input, scenario }),
      abortSignal: AbortSignal.timeout(KOREAN_COACH_FEEDBACK_TIMEOUT_MS),
      providerOptions: {
        openai: {
          reasoningEffort: "low",
          textVerbosity: "low",
        },
      },
    })
    const parsed = koreanTutorFeedbackSchema.safeParse(result.output)
    if (!parsed.success) {
      throw new CoachServiceError({
        code: "INVALID_AI_OUTPUT",
        message: "The feedback was incomplete. Please try again.",
        retryable: true,
        status: 502,
      })
    }
    return { feedback: parsed.data, model: KOREAN_COACH_TEXT_MODEL, mode: "live" }
  } catch (error) {
    throw new CoachServiceError(sanitizeProviderError(error, "FEEDBACK_FAILED"), {
      cause: error,
    })
  }
}
