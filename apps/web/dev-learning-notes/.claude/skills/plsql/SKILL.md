---
name: plsql
description: 'Oracle PL/SQL best practices for core banking — procedures, packages, cursors, transactions, exceptions, and the PL/SQL quality checklist. Use when HEANG says /plsql, optionally with a topic (e.g. /plsql cursors, /plsql packages).'
---

# Oracle PL/SQL Best Practices (Core Banking)

Your goal is to help me write correct, safe, fast PL/SQL — the kind
core-banking shops on **Oracle FLEXCUBE** run (KB PRASAC, Prince,
Hattha, Wing). This is my **primary DB target** for the Cambodia plan
(see `curriculum/CAMBODIA-CAREER-PLAN.md`). PostgreSQL is my second DB
(`/sql`); call out Oracle-vs-Postgres differences when they matter.

Mentor note: the Golden Rule from `CLAUDE.md` still applies. If I ask
"write me a procedure", make me attempt it in `exercises/` first —
give a hint or the first step, not the full answer. Use banking
examples (accounts, transfers, ledgers) and quiz me after teaching.

## Why PL/SQL matters in a bank

Core-banking systems put business logic **inside the database** as
procedures and packages, close to the data, inside one transaction.
A money transfer (lock → debit → credit → ledger row) is the classic
PL/SQL job. MyBatis maps cleanly onto this style, which is why
PL/SQL-heavy shops like MyBatis. Know this story for interviews.

## Writing Rules

- Write SQL keywords, tables, and columns in UPPERCASE
  (`SELECT BALANCE INTO V_BAL FROM TB_ACCOUNT WHERE ACCT_ID = P_ACCT_ID`).
- Prefix by role so intent is obvious: `P_` parameters, `V_` local
  variables, `C_` cursors, `FN_` functions, `SP_`/`PR_` procedures,
  `PKG_` packages. Follow the team's real convention if it differs.
- Use `%TYPE` and `%ROWTYPE` so variables follow the table — never
  hardcode `VARCHAR2(20)` when you can write `TB_ACCOUNT.ACCT_ID%TYPE`.
- Use **bind variables / parameters**, never string-concatenated
  values. Concatenating user input into dynamic SQL is SQL injection.
- Money is `NUMBER`, never a float/binary type. Never trust client
  rounding — round in one agreed place.
- Never hardcode passwords, connection strings, or API keys in code,
  scripts, or logs.

## Transactions & Concurrency (the part a bank tests hardest)

- One business operation = one transaction. Do **not** `COMMIT`
  inside a reusable procedure that a caller may want to roll back —
  let the top-level caller own COMMIT/ROLLBACK. State this rule when
  asked.
- Lock the rows you will change **before** you change them:
  `SELECT ... FOR UPDATE` (optionally `FOR UPDATE NOWAIT` or
  `WAIT n`). This prevents the double-withdrawal / lost-update race.
- Lock accounts in a **consistent order** (e.g. by ascending ACCT_ID)
  to avoid deadlocks when two transfers touch the same pair.
- Know `SAVEPOINT` for partial rollback inside a long operation.
- Oracle's default isolation is READ COMMITTED; `SET TRANSACTION
  ISOLATION LEVEL SERIALIZABLE` is available. Be able to say which a
  transfer needs and why.
- Never use **autonomous transactions** (`PRAGMA AUTONOMOUS_TRANSACTION`)
  for business writes — only for things like audit logging that must
  persist even on rollback. Misusing it breaks atomicity.

## Cursors

- Prefer an **implicit cursor FOR loop** (`FOR R IN (SELECT ...)`) for
  simple reads — Oracle handles open/fetch/close and bulk-fetches.
- Use an **explicit cursor** when you need `%ROWCOUNT`, `%FOUND`,
  `%NOTFOUND`, or to pass the cursor around. Always close what you
  open (or use the FOR-loop form that closes for you).
- For set work, do **not** loop row-by-row. Use a single SQL statement,
  or `BULK COLLECT` + `FORALL` for batches — row-by-row ("slow by
  slow") is the #1 PL/SQL performance mistake.
- Cap `BULK COLLECT` with `LIMIT` (e.g. 1000) so huge result sets
  don't blow up PGA memory.

## Exceptions

- Handle named exceptions explicitly: `NO_DATA_FOUND` (a `SELECT INTO`
  that returns nothing), `TOO_MANY_ROWS`, `DUP_VAL_ON_INDEX`.
- Define business exceptions with `EXCEPTION` + `RAISE_APPLICATION_ERROR`
  (codes −20000 to −20999) — e.g. raise `-20001 'INSUFFICIENT_FUNDS'`.
- Never write a silent `WHEN OTHERS THEN NULL` — it swallows errors.
  If you catch `WHEN OTHERS`, log `SQLERRM`/`SQLCODE` and re-raise.
- Let the exception reach the caller so the **transaction rolls back**;
  don't COMMIT in a handler to "save what we have".

## Packages

- Group related logic into a **package**: SPEC (public API) + BODY
  (implementation). The spec is the contract; hide helpers in the body.
- Packages give you persistent session state, fewer recompiles, and
  better dependency handling than standalone procedures. Prefer them
  for any non-trivial module (e.g. `PKG_ACCOUNT`, `PKG_TRANSFER`).
- Keep procedures small and single-purpose; one transfer procedure
  should not also generate statements and send notifications.

## Self-Check (run on every procedure/function you write or change)

1. **Purpose** — the business operation, who calls it, how often.
2. **Params** — `IN` / `OUT` / `IN OUT` correct? Types use `%TYPE`?
3. **Transaction ownership** — who COMMITs/ROLLBACKs? Any stray COMMIT?
4. **Locking** — are changed rows locked `FOR UPDATE` first, in a
   consistent order? Deadlock risk?
5. **Set vs loop** — could a row-by-row loop be one SQL / BULK +
   FORALL?
6. **Exceptions** — named exceptions handled? business errors raised
   with `RAISE_APPLICATION_ERROR`? no silent `WHEN OTHERS`?
7. **Index usage** — do the WHERE clauses hit indexes? (same Eq /
   Range / Seq Scan thinking as `/sql`). No function wrapping a column.
8. **Cursors/resources** — everything opened is closed; `BULK COLLECT`
   is `LIMIT`ed.

## Oracle vs PostgreSQL (so I don't mix them up)

| Thing            | Oracle                          | PostgreSQL                       |
| ---------------- | ------------------------------- | -------------------------------- |
| Procedural lang  | PL/SQL                          | PL/pgSQL                         |
| Sequences / IDs  | `seq.NEXTVAL`, IDENTITY         | `SERIAL`/`IDENTITY`, `nextval()` |
| Empty string     | `''` is treated as `NULL`       | `''` is a real empty string      |
| Get inserted row | `RETURNING ... INTO`            | `RETURNING ...`                  |
| String concat    | `||` (and `CONCAT`)             | `||`                             |
| Top-N            | `FETCH FIRST n ROWS ONLY`       | `LIMIT n`                        |
| Packages         | Yes (spec + body)               | No packages (use schemas)        |
| Date now         | `SYSDATE` / `SYSTIMESTAMP`      | `NOW()` / `CURRENT_TIMESTAMP`    |

## When to Recommend Deep Analysis

Recommend `EXPLAIN PLAN` / SQL trace or a DBA review when any holds:

- A loop that runs DML row-by-row over a large set
- A `SELECT ... FOR UPDATE` whose lock scope or order is unclear
- 4+ joined tables, or a function called inside a WHERE clause
- A procedure that COMMITs partway through a multi-step money operation
- Any `PRAGMA AUTONOMOUS_TRANSACTION` on a business write

## Interview Questions to Drill Me On

- Walk through a safe transfer procedure: what do you lock, in what
  order, when do you COMMIT, what rolls back on failure?
- Difference between `%TYPE` and `%ROWTYPE`, and why use them?
- Implicit vs explicit cursor — when each?
- Why is row-by-row processing slow, and how do BULK COLLECT / FORALL
  fix it?
- What does `RAISE_APPLICATION_ERROR` do, and why not `WHEN OTHERS
  THEN NULL`?
- Package spec vs body — what goes where and why?
- How do you prevent a deadlock between two concurrent transfers?
</content>