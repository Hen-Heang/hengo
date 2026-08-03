// Curated pool of everyday off-topic interview questions. Real K-Specialist
// interviewers break from the prepared topic to test spontaneous Korean, so
// each session samples a few of these into the examiner brief with an
// instruction to adapt the wording naturally — variety comes from the sampling
// plus the model's paraphrasing, with no extra AI round-trip.

export interface UnexpectedQuestion {
  ko: string
  en: string
  category: "life" | "work" | "hometown" | "hobbies" | "food" | "plans" | "study"
}

export const UNEXPECTED_QUESTIONS: UnexpectedQuestion[] = [
  // ── Life in Korea ──────────────────────────────────────────────
  { ko: "한국 생활은 어떻습니까?", en: "How is life in Korea?", category: "life" },
  { ko: "한국에 온 지 얼마나 됐습니까?", en: "How long have you been in Korea?", category: "life" },
  { ko: "한국에서 가장 놀란 것은 무엇입니까?", en: "What surprised you most in Korea?", category: "life" },
  { ko: "한국 사람들과 지내는 것은 어떻습니까?", en: "How is it getting along with Korean people?", category: "life" },
  { ko: "주말에는 보통 무엇을 합니까?", en: "What do you usually do on weekends?", category: "life" },
  { ko: "한국에서 어디에 가 봤습니까?", en: "Where have you visited in Korea?", category: "life" },
  { ko: "한국 지하철이나 버스를 자주 이용합니까?", en: "Do you often use the subway or bus in Korea?", category: "life" },
  { ko: "한국에서 힘든 점은 무엇입니까?", en: "What is difficult about living in Korea?", category: "life" },

  // ── Work ───────────────────────────────────────────────────────
  { ko: "회사에서는 무슨 일을 합니까?", en: "What do you do at your company?", category: "work" },
  { ko: "회사 생활은 어떻습니까?", en: "How is your work life?", category: "work" },
  { ko: "동료들과 한국어로 이야기합니까?", en: "Do you speak Korean with your coworkers?", category: "work" },
  { ko: "일할 때 가장 어려운 것은 무엇입니까?", en: "What is the hardest part of your job?", category: "work" },
  { ko: "왜 한국에서 일하고 싶었습니까?", en: "Why did you want to work in Korea?", category: "work" },
  { ko: "회사에서 점심은 보통 어떻게 합니까?", en: "What do you usually do for lunch at work?", category: "work" },

  // ── Hometown / Cambodia ────────────────────────────────────────
  { ko: "고향은 어떤 곳입니까?", en: "What is your hometown like?", category: "hometown" },
  { ko: "고향에서 가족은 무엇을 합니까?", en: "What does your family do back home?", category: "hometown" },
  { ko: "고향 음식 중에서 무엇이 제일 그립습니까?", en: "Which hometown food do you miss most?", category: "hometown" },
  { ko: "캄보디아에 자주 연락합니까?", en: "Do you contact Cambodia often?", category: "hometown" },
  { ko: "한국과 캄보디아의 문화 차이는 무엇입니까?", en: "What are the cultural differences between Korea and Cambodia?", category: "hometown" },
  { ko: "고향 친구들에게 한국을 어떻게 소개하고 싶습니까?", en: "How would you introduce Korea to your hometown friends?", category: "hometown" },

  // ── Hobbies ────────────────────────────────────────────────────
  { ko: "취미가 무엇입니까?", en: "What are your hobbies?", category: "hobbies" },
  { ko: "운동을 자주 합니까?", en: "Do you exercise often?", category: "hobbies" },
  { ko: "한국 드라마나 영화를 봅니까?", en: "Do you watch Korean dramas or movies?", category: "hobbies" },
  { ko: "음악 듣는 것을 좋아합니까?", en: "Do you like listening to music?", category: "hobbies" },
  { ko: "시간이 있으면 무엇을 하고 싶습니까?", en: "What would you like to do when you have free time?", category: "hobbies" },

  // ── Food ───────────────────────────────────────────────────────
  { ko: "한국 음식 중 무엇을 좋아합니까?", en: "Which Korean food do you like?", category: "food" },
  { ko: "매운 음식을 잘 먹습니까?", en: "Can you handle spicy food?", category: "food" },
  { ko: "요리를 할 수 있습니까?", en: "Can you cook?", category: "food" },
  { ko: "캄보디아 음식과 한국 음식은 어떻게 다릅니까?", en: "How is Cambodian food different from Korean food?", category: "food" },
  { ko: "아침은 보통 무엇을 먹습니까?", en: "What do you usually eat for breakfast?", category: "food" },

  // ── Future plans ───────────────────────────────────────────────
  { ko: "앞으로의 계획은 무엇입니까?", en: "What are your future plans?", category: "plans" },
  { ko: "한국에서 얼마나 살고 싶습니까?", en: "How long do you want to live in Korea?", category: "plans" },
  { ko: "5년 후에 무엇을 하고 싶습니까?", en: "What do you want to be doing in five years?", category: "plans" },
  { ko: "한국에서 꼭 해 보고 싶은 것이 있습니까?", en: "Is there something you really want to try in Korea?", category: "plans" },

  // ── Korean study ───────────────────────────────────────────────
  { ko: "한국어 공부는 어떻게 합니까?", en: "How do you study Korean?", category: "study" },
  { ko: "한국어 공부는 언제 시작했습니까?", en: "When did you start studying Korean?", category: "study" },
  { ko: "한국어에서 무엇이 가장 어렵습니까?", en: "What is hardest about Korean?", category: "study" },
  { ko: "한국어를 왜 배우고 싶었습니까?", en: "Why did you want to learn Korean?", category: "study" },
  { ko: "가장 기억에 남는 경험은 무엇입니까?", en: "What is your most memorable experience?", category: "study" },
  { ko: "한국어로 이야기할 때 긴장됩니까?", en: "Do you get nervous speaking Korean?", category: "study" },
]

/**
 * Samples `count` distinct questions from the pool (Fisher–Yates on a copy).
 * `rng` is injectable for deterministic tests; clamps when count exceeds the
 * pool size.
 */
export function sampleUnexpectedQuestions(
  count: number,
  rng: () => number = Math.random
): UnexpectedQuestion[] {
  const pool = [...UNEXPECTED_QUESTIONS]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, Math.max(0, Math.min(count, pool.length)))
}
