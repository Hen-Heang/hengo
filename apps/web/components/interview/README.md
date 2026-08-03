# K-Specialist Speaking Exam — Guide & Process

Personal prep guide for the K-Specialist spoken Korean exam, matching what's built into the Exam Prep pages (`/interview` and `/interview/script`). This is the "why" and "how" behind those screens — the actual live data lives in `lib/study-plan.ts`, `lib/interview.ts`, and `lib/exam-strategy.ts`.

## Exam basics

- **Date:** Sat, Aug 29, 2026 · 13:00 KST
- **Format:** Spoken Q&A only — no written section
- **Topic:** Korean summer weather vs. Cambodian weather, and its effect on daily life and health
- **Script deadline:** Aug 21, 2026 — the written script must be finalized and submitted before the exam
- **Judged on:** Speaking, Pronunciation, Vocabulary, Confidence (4 criteria, scored out of 5 each)

## The week-by-week process

The plan runs 11 weeks (`w0`–`w10`) in four phases:

1. **Baseline (Week 0)** — take one full mock to get a starting score, draft all 7 script sections roughly, start the daily routine.
2. **Foundation (Weeks 1–3)** — daily core routine, grammar points, rewrite two script sections per week, build listening reps.
3. **Speaking (Weeks 4–6)** — switch to daily *full* mocks (5+ turns) with real scoring, drill your top mistakes, start memorizing script content (not just reading it).
4. **Polish (Weeks 7–9)** — tighten wording, fix weak pronunciation, handle off-script/follow-up questions, finalize and submit the script by Aug 21.
5. **Taper (Week 10)** — timed mocks under real conditions (no English, no notes), light review only, rest before exam day.

Each week's tasks and the live countdown are what `StudyPlanCard` and `ExamCountdownBanner` render — check off tasks there as you go; that state (plus any custom tasks you add) is saved per-device.

## The script

Seven sections, each with a Korean draft + English translation, memorized in this order:

1. 인사 및 주제 소개 — Greeting & topic intro
2. 한국의 여름 날씨 — Korea's summer weather
3. 캄보디아 날씨와 비교 — Compared with Cambodia
4. 날씨와 일상생활 — Weather & daily life
5. 건강에 미치는 영향 — Effects on health
6. 나의 경험과 느낀 점 — My experience & reflection
7. 마무리 — Conclusion

Write and edit this in `/interview/script` — it autosaves locally and syncs to your account. You can also draft answers to the likely Q&A questions there (separate tab).

## Speaking strategy — the 9 rules

1. **Short is best** — 2–3 sentences, stop once your point is clear.
2. **Answer first, explain after** — direct answer, then one reason or example.
3. **Slow speaking wins** — speed doesn't score; clarity and calm do.
4. **Use easy words only** — common vocabulary, simple grammar.
5. **Pause before you answer** — a 1-second pause reads as confidence, not hesitation.
6. **Mistakes are OK** — don't over-apologize, keep going.
7. **Always show growth** — "처음에는 어려웠습니다" → "지금은 좋아졌습니다."
8. **Use safety sentences** — memorized fallback lines to buy time under pressure.
9. **Be honest, not perfect** — sincerity and effort score higher than fake fluency.

**Safety sentences to memorize:**
- 네, 질문 감사합니다. — Yes, thank you for the question.
- 천천히 말씀해 주시면 감사하겠습니다. — I would appreciate it if you could speak slowly.
- 한국어가 아직 부족해서 간단히 말씀드리겠습니다. — My Korean is still limited, so I'll keep it simple.
- 처음에는 어려웠습니다. / 지금은 좋아졌습니다. — At first it was difficult. / Now it's gotten better.

**Judges reward:** clear message, calm attitude, confidence, effort.
**Judges don't reward:** fancy words, long answers.

## Training plan by skill

| Skill | Goal | Frequency |
|---|---|---|
| Reading | Read the topic smoothly | Daily · 15–20 min |
| Listening | Understand common questions | 3–4×/week · 20 min |
| Pronunciation | Clear sounds, not speed | Daily · 10 min |
| Speaking | Short, simple answers | Daily · 15 min |
| Confidence | Repetition + routine | Weekly full simulation + daily consistency |

## Using the app to practice

- **Mock Interview** (`/interview` → Start Interview) — an AI examiner asks one question at a time; answer by voice or typed text and get feedback after each turn. Finish a session to get a scorecard against the four exam criteria; scores build a trend over time.
- **Repeat Drill** (`/interview/repeat`) — Duolingo-style listen & repeat: the app speaks a sentence from your script (or a key phrase), the mic opens, you say it back, and missed words are marked word by word (`lib/repeat-drill.ts`, graded locally — no AI call).
- **Write my script** (`/interview/script`) — the Google-Docs-style editor for the 7-section script and Q&A prep, described above.
- **Study Pack** — vocabulary, key phrases, and likely questions for the weather topic, each with TTS playback.
- **Speaking Strategy card** — the rules, safety sentences, and training plan above, always available as a quick reference during a live session.
