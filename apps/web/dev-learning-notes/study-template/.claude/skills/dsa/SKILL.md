---
name: dsa
description: Problem-solving practice — one LeetCode-style problem in plain Java, graded with Big-O analysis. Use when HEANG says /dsa, optionally with a topic (e.g. /dsa arrays, /dsa hashmap).
---

# /dsa [topic] — Problem-Solving Practice

One problem per run. Plain Java only (no Spring, no libraries
beyond `java.util`). The Golden Rule applies fully: never show
the solution before a real attempt.

## Steps

1. **Load state**: Read `PROGRESS.md`. Find his DSA level from
   quiz history (look for rows tagged `dsa`).
   - No history yet → start at Level 1.
   - If a topic was given, use it. If not, pick from the level
     table below, preferring patterns he failed before.

2. **Give ONE problem**: Create `exercises/dsa-<topic>/TASK.md` with:
   - Problem statement in simple English, banking-flavored when
     possible (transactions, accounts, balances).
   - Input/output examples (at least 2, one with an edge case).
   - Constraints (array size, value ranges).
   - A target: "Try for O(...) time" — but only at Level 3+.
   - NO hints, NO approach, NO solution in the file.

3. **Stop and wait** for his attempt in that folder.
   - If he asks for the answer: refuse, give ONE small hint
     (e.g. "what data structure gives O(1) lookup?").
   - Max 3 hints, each smaller than a full step.

4. **Before reviewing the code**, ask him two questions:
   - "What is the time complexity of your solution? Why?"
   - "What input would break it?" (edge cases: empty, one element,
     duplicates, negative numbers, overflow)

5. **Review in PAIR MODE**: check correctness first, then edge
   cases, then complexity, then code style. Do not rewrite his
   code. Point at the line, explain WHY it is wrong, ask
   "How would you fix this?"

6. **Grade**: PASS / WEAK / FAIL — honestly.
   - PASS = correct, handles edge cases, correct Big-O answer.
   - WEAK = works but missed edge cases or could not explain Big-O.
   - FAIL = wrong output or copied without understanding.
   - WEAK/FAIL → same pattern again next `/dsa`, different problem.

7. **Log**: Add a row to `PROGRESS.md` quiz history tagged `dsa`,
   with the pattern name (e.g. `dsa: two-pointer`). Update weak
   spots. 2× PASS on the same pattern → next level.

## Level table

| Level | Patterns |
|-------|----------|
| 1 | arrays, strings, loops, simple math |
| 2 | HashMap/HashSet counting, two pointers, prefix sum |
| 3 | sliding window, binary search, sorting-based |
| 4 | stack/queue, linked list, recursion |
| 5 | trees (traversal, BST), heaps |
| 6 | graphs (BFS/DFS), dynamic programming basics |

## Hard rules

- One problem per run. No "give me 5 problems".
- He must state Big-O himself. Never state it for him first.
- If his solution is brute force and a better one exists, PASS is
  still possible at Level 1-2, but tell him the better approach
  exists and ask what data structure could help — do not show it.
- Never mark a pattern mastered in `PROGRESS.md` after a WEAK or FAIL.
