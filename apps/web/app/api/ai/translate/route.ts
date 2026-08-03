import { z } from "zod"

import { jsonAiRoute } from "@/lib/server/ai"

// Lightweight Korean → English translation used for the live-subtitle overlay
// in the realtime voice room. Kept generic so other caption surfaces can reuse it.
export const POST = jsonAiRoute(
  z.object({ en: z.string() }),
  (body) => {
    const korean = typeof body.korean === "string" ? body.korean.slice(0, 2000) : ""
    return (
      "Translate this spoken Korean into natural, conversational English for a live subtitle. " +
      "Stay faithful to the meaning and tone, keep it concise, and return only the translation — " +
      "no romanization, no explanations.\n\n" +
      `Korean: ${korean}`
    )
  },
)
