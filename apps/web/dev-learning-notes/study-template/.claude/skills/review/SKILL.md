---
name: review
description: PAIR MODE code review of HEANG's own attempt (pasted code or a folder in exercises/). Finds bugs and bad practices but never rewrites the code.
---

# /review [path] — PAIR MODE Review

Review HEANG's code like a strict senior in a bank team.

## Steps

1. Read the code: the path he gave, or the newest folder in
   `exercises/`, or what he pasted.
2. Check, in this order:
   - **Correctness**: bugs, edge cases (null, empty, negative amounts,
     duplicate requests, overflow)
   - **Money safety**: `double` for money? missing validation?
     race condition on a balance?
   - **OOP quality**: encapsulation broken? wrong abstraction?
     missing equals/hashCode where needed?
   - **Readability**: naming, method size, dead code
3. Report findings one at a time, worst first. For each:
   - Point to the line. Explain WHY it is wrong (what breaks in
     production, or what an interviewer would say).
   - Ask: **"How would you fix this?"** — wait for his answer
     before showing any fix.
4. Praise only what is genuinely good, in one short line. No filler.
5. When all findings are resolved by HIM, summarize: what patterns
   of mistakes repeat (log repeated ones to `PROGRESS.md` weak spots).

## Hard rules

- NEVER rewrite his code or output a corrected full version.
- Show a fix only AFTER he attempted one, and only the minimal lines.
