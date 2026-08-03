import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { CorrectionRetryPanel, PRONUNCIATION_DISCLAIMER } from "./CorrectionRetryPanel"

const result = {
  scores: {
    speaking: 2,
    grammar: 2,
    vocabulary: 2,
    pronunciation: 2,
    confidence: 3,
    naturalness: 2,
  },
  feedback: "Use a complete sentence.",
  correctedAnswer: "??? ??? ?? ????.",
  betterAlternative: "??? ??? ?? ??? ?? ????.",
  tip: "Pause once between the two sentences.",
}

describe("CorrectionRetryPanel", () => {
  it("keeps the pronunciation limitation visible beside transcript scores", () => {
    const html = renderToStaticMarkup(
      <CorrectionRetryPanel
        questionId="q1"
        firstAnswer="?? ?? ???"
        firstResult={result}
        onRetry={() => undefined}
        onNext={() => undefined}
        isLast={false}
      />,
    )
    expect(html).toContain(PRONUNCIATION_DISCLAIMER)
    expect(html).toContain("Retry Answer")
  })
})
