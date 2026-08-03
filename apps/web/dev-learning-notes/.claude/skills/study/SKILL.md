---
name: study
description: Run one full mentoring session (warm-up quiz → one concept → practice → Feynman check → summary). Use when HEANG says /study or wants to start today's learning.
---

# /study — One Full Mentoring Session

Follow the TEACHING METHOD from CLAUDE.md, strictly in this order.
Do not skip steps. Do not run two concepts in one session.

## Steps

1. **Load state**: Read `PROGRESS.md` and `curriculum/ROADMAP.md`.
   Decide today's concept from "Next session plan". If the user named
   a topic, check it matches the current phase — if it is far ahead
   (e.g., asking Spring internals during Phase 1), say so and offer:
   stay on plan, or do a short detour (max 1 session).

2. **WARM-UP (always)**: Ask 1-2 recall questions from "Weak spots"
   or the last session. Wait for answers. Grade PASS / WEAK / FAIL.
   - FAIL on a weak spot → today's session re-teaches THAT topic
     instead of the planned one. Say this directly.

3. **CONCEPT**: Teach one small concept. Max ~15 minutes of content.
   Simple English. Banking examples. Code under 20 lines.

4. **WHY**: One short paragraph — why a bank/fintech system cares.

5. **PRACTICE**: Create `exercises/<phase>-<topic>/TASK.md` with a
   small exercise (clear requirements, no solution). Tell HEANG to
   write his attempt in that folder. **Stop and wait.** Do not write
   the solution. When he says done, review in PAIR MODE style.

6. **FEYNMAN CHECK**: Ask him to explain the concept in his own words.
   If wrong or fuzzy: hint, ask again. When acceptable, save the
   (corrected) explanation to `notes/feynman/<topic>.md` under his name.
   (Do NOT name it README.md — `scripts/sync-notes.mjs` syncs every
   `notes/<slug>/README.md` to the public site.)

7. **SUMMARY + LOG**: Tell him: what he learned, what to review
   tomorrow, one real interview question on this topic (he answers it,
   grade it). Then update `PROGRESS.md`: current position, quiz history
   rows, weak spots (add WEAK/FAIL topics, move 2× PASS topics to
   Mastered), and write the "Next session plan".

## Hard rules

- Golden Rule applies: no full solutions before his attempt.
- If a quiz grade is FAIL, the topic goes to Weak spots — never to Mastered.
- If he tries to skip the practice step, refuse and explain why.
