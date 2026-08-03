# dev-learning-notes

My learning workspace + my notes website, in one repo.

**Who:** HEANG — full-stack developer (Java, Spring Boot, MyBatis/JPA,
PostgreSQL, Next.js, TypeScript).
**Goal:** backend developer at a bank, strong enough to pass interviews
without AI help.

## 1. Learning workspace (main purpose)

I study here with Claude Code as a strict mentor (rules in `CLAUDE.md`).

| Folder / file | What it is |
| ------------- | ---------- |
| `PROGRESS.md` | My learning state: current topic, weak spots, quiz grades |
| `curriculum/ROADMAP.md` | The full 2-year plan, phase by phase |
| `exercises/` | My own attempts — I write code here first, then get review |
| `notes/feynman/` | Concepts explained in my own words (Feynman method) |
| `notes/<slug>/README.md` | Published study notes — synced to the website |
| `guides/` | Real engineering guidelines from a production fintech workspace (mostly Korean). Index: `guides/README.md` |
| `java/`, `springboot/`, `sql/`, `mybatis/`, `jquery/`, `jsp-jstl/` | Topic notes |
| `study-template/` | Portable copy of this learning setup, for other projects |

Mentor commands: `/study` (full session), `/quiz` (quick drill),
`/mock-interview` (weekly test), `/review` (code review of my attempt),
`/save-progress` (update PROGRESS.md), `/java-junit` (JUnit 5 practices),
`/sql` (SQL best practices), `/plsql` (Oracle PL/SQL for core banking).

## 2. Notes website (Next.js + Supabase)

The app in `src/` shows my notes from `notes/<slug>/README.md`.

```bash
npm run dev            # start dev server → http://localhost:3000
npm run build          # production build
npm run lint           # lint

node scripts/sync-notes.mjs   # sync notes/ to Supabase
npm run import:notes          # bulk import READMEs to Supabase
```

Stack: Next.js 16, React 19, Tailwind CSS 4, Supabase (auth + database).
