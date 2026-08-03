---
name: save-progress
description: Update PROGRESS.md with what happened this session (grades, weak spots, next plan). Use when the session ends early or HEANG says /save-progress.
---

# /save-progress — Save Session State

Update `PROGRESS.md` so the next session can continue exactly here.

## Steps

1. Read `PROGRESS.md`.
2. Update:
   - **Current position**: phase, week, topic, today's date as last session
   - **Quiz history**: append every graded question from this session
   - **Weak spots**: add any WEAK/FAIL topics; remove topics that got
     their 2nd PASS (move them to Mastered)
   - **Next session plan**: 2-3 lines — what to warm-up on, what
     concept comes next, anything unfinished (e.g., "exercise
     exercises/p1-oop-pillars not yet reviewed")
3. Keep history append-only. Never delete old rows.
4. Confirm to HEANG in 2-3 lines what was saved and what is next.
