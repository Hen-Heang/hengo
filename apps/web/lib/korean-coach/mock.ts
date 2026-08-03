import type { KoreanScenario, KoreanTutorFeedback } from "./schemas"

export function createMockTutorFeedback(
  transcript: string,
  scenario: KoreanScenario,
): KoreanTutorFeedback {
  return {
    transcript,
    understoodMeaning: "You communicated a short answer related to the scenario.",
    taskCompleted: false,
    feedback: {
      summary: "Your meaning was understandable. This is mock feedback for local UI development.",
      grammar: {
        isCorrect: false,
        explanation: "Mock mode shows the feedback layout without sending content to an AI service.",
      },
      naturalness: { score: 70, explanation: "The sentence can be made slightly more natural." },
      vocabulary: { score: 75, explanation: "The key idea was communicated with simple vocabulary." },
      communication: { score: 80, explanation: "The main meaning was understandable." },
      fluencyObservation: "A transcript cannot measure pronunciation; try saying the corrected sentence smoothly.",
      wordsToRetry: [],
    },
    correctedSentence: {
      korean: "마감일이 언제예요?",
      romanization: "Magamiri eonjeyeyo?",
      english: "When is the deadline?",
    },
    alternativeSentence: {
      korean: "이 작업은 언제까지 하면 돼요?",
      romanization: "I jag-eobeun eonjekkaji hamyeon dwaeyo?",
      english: "By when should I finish this task?",
    },
    mistakes: [
      {
        type: "grammar",
        original: transcript,
        correction: "마감일이 언제예요?",
        explanation: "Mock example: use 이/가 after 마감일 in this question.",
        important: true,
      },
    ],
    nextTutorMessage: {
      korean: "금요일까지 완료할 수 있어요?",
      romanization: "Geumyoilkkaji wanryohal su isseoyo?",
      english: "Can you complete it by Friday?",
    },
    strongPoint: "You attempted to communicate directly in Korean.",
    recommendedImprovement: "Try the corrected sentence once more with a steady pace.",
    newVocabulary: scenario.usefulVocabulary.slice(0, 2),
  }
}

export function isKoreanCoachMockMode(): boolean {
  return process.env.KOREAN_COACH_MOCK_MODE === "true"
}

