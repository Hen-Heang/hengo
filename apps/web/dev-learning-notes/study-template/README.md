# study-template

My portable learning setup for Claude Code. One folder = my whole
study system: strict mentor rules, 5 skills, progress tracking,
2-year roadmap, exercise structure. Works for Java, SQL,
JavaScript/TypeScript, problem-solving, and design topics.

## How to use in a new project

**Option A — full setup (recommended for a dedicated study repo):**

Copy everything in this folder to the project root:

```
your-project/
├── CLAUDE.md              ← mentor rules (Claude reads this automatically)
├── PROGRESS.md            ← my learning state (reset per project, or carry over)
├── curriculum/ROADMAP.md  ← the 2-year plan
├── exercises/             ← my attempts (I write the code, mentor writes TASK.md)
├── notes/                 ← my Feynman explanations
└── .claude/
    ├── settings.json      ← safe permissions (no .env reads, no force push)
    └── skills/            ← /study  /quiz  /review  /mock-interview  /save-progress  /java-junit  /sql  /plsql  /dsa
```

Then open Claude Code in that project and type `/study`.

**Option B — minimal (existing work project, just want the mentor):**

Copy only `CLAUDE.md` (or paste its content into the project's
existing CLAUDE.md). I lose the skills and progress tracking, but
the Golden Rule and modes still work.

## The rules in short

- **Golden Rule:** Claude never writes full solutions before I attempt.
- **Modes:** LEARNING (default) / PAIR (review my code) /
  SPEED (only mastered topics) / TRANSLATION (Korean ↔ English, free).
- **Every session:** warm-up quiz → one concept → exercise →
  Feynman check → update PROGRESS.md.
- **Grading is honest:** PASS / WEAK / FAIL. WEAK and FAIL go to
  weak spots and get re-tested.

## Skills

| Skill | What it does |
| ----- | ------------ |
| `/study` | One full mentoring session, start to finish |
| `/quiz [topic]` | Quick 3-5 question drill (weak spots if no topic) |
| `/review [path]` | Strict PAIR-MODE review of MY code, never rewrites it |
| `/mock-interview` | Weekly: 5 questions, no hints, honest score |
| `/save-progress` | Save session state to PROGRESS.md if I stop early |
| `/java-junit` | JUnit 5 + parameterized testing best practices (reference) |
| `/sql` | SQL best practices for PostgreSQL + MyBatis (reference) |
| `/plsql [topic]` | Oracle PL/SQL best practices for core banking (reference) |
| `/dsa [topic]` | One LeetCode-style problem in plain Java, graded with Big-O |

## Weekly rhythm

- 3-4 × `/study` (one concept each)
- 1 × `/mock-interview`
- `/review` whenever I finish an exercise

## Rule for myself

If I catch myself asking Claude to "just write it" — that is the
habit I am here to break. Real interviews have no AI.

## Tips

- Keep ONE main `PROGRESS.md` (in my main study repo) as the source
  of truth. In other projects, either copy it in or skip Option A.
- If a project has its own CLAUDE.md already, merge — don't overwrite.
- The roadmap is for the bank-backend goal. For a different goal,
  edit `curriculum/ROADMAP.md`, keep everything else the same.
