# Mapper XML Query Quality Check (English Reference)

> English companion of `query-quality-check.md`. The original is a step
> in the company's automated dev pipeline ("step 4-1" run by an AI dev
> agent right after creating a Mapper XML). This version translates it
> as a **human checklist you run on yourself** after writing or changing
> any MyBatis query, adds **💡 Why** notes, and fixes references to point
> at files in this repo.
>
> Writing conventions (schema prefix, uppercase, dynamic SQL, function
> signatures) live in `../backend/guide-mybatis.md` and
> `../conventions/base-rule.md` §8 "DB query common rules".

💡 **The idea behind this checklist:** the database will accept almost
any query and run it — slowly. Nothing warns you at compile time that
your WHERE clause skips every index. So the company forces a manual
verification step *immediately after writing* the query, while the
intent is still fresh in your head.

---

## Step 1. Look up metadata for every table you used

1. Extract **every table** from your query — FROM, JOIN, INSERT INTO,
   UPDATE, **and tables inside subqueries** (the easy ones to miss).
2. For each table, query the DB for its **indexes, PK/UNIQUE
   constraints, and column info including `data_type`**.
   *(The original workspace did this through a Postgres MCP tool and
   kept the lookup SQL in its root CLAUDE.md. In this repo, use psql /
   your SQL client — `\d tablename` in psql shows columns + indexes.)*
3. **You must know the real `data_type`** of every column that goes
   into a SQL function (`TO_CHAR`, `TO_DATE`, `CAST`, `||` concat,
   arithmetic). Step 2's function-signature check needs this.

💡 **Why metadata first?** You cannot judge "does this WHERE use an
index?" without knowing which indexes exist. Guessing from column
names ("it's called USER_ID, surely it's indexed") is how slow queries
reach production.

---

## Step 2. Static checks

| Check area | Where the rule lives |
|------------|---------------------|
| Writing rules (no schema prefix / ALL UPPERCASE / no `SELECT *`) | `../conventions/base-rule.md` §8 + `../backend/guide-mybatis.md` §2–§3 |
| 8-item self-review (purpose, in/out, JOIN structure, WHERE, dynamic SQL, user functions, index usage, optimization points) | `../backend/guide-mybatis.md` §4 |
| Index usage pattern (Eq / Range / Seq Scan) | `../backend/guide-mybatis.md` §7 |
| **Function signature ↔ column `data_type` compatibility** | this file, below |

**The function-signature check** (this rule exists only in this
checklist — it is not in the MyBatis guide):

For every SQL function call (`TO_CHAR`, `TO_DATE`, `CAST`,
`SUBSTRING`, `LPAD`, `||`, arithmetic...), confirm the argument types
actually exist as a PostgreSQL function overload.

💡 **The classic failure:** calling `TO_CHAR` directly on a *varchar*
column. PostgreSQL has `TO_CHAR(timestamp, text)`, `TO_CHAR(numeric,
text)` — but **no `TO_CHAR(varchar, text)`**. The query fails at
runtime with `function to_char(character varying, unknown) does not
exist`. It compiles fine in your head because Oracle allows it —
PostgreSQL does not.

Fix with explicit casting through the right type:

```sql
-- ❌ fails at runtime if REG_DT is varchar 'YYYYMMDD'
TO_CHAR(REG_DT, 'YYYY.MM.DD')

-- ✅ varchar → date → formatted text
TO_CHAR(TO_DATE(REG_DT, 'YYYYMMDD'), 'YYYY.MM.DD')
```

---

## Step 3. Dynamic SQL — analyze each branch (mandatory)

If the query has `<if>` / `<choose>` / `<foreach>` / `<where>` /
`<set>` / `<trim>`, write out the **actual SQL of every branch** and
check index usage per branch (rules in `../backend/guide-mybatis.md`
§5).

💡 **Why per-branch?** A dynamic query is really N different queries
wearing one id. The branch WITH the indexed condition may be fast
while the branch WITHOUT it does a full table scan. You tested one
branch; production runs all of them.

Special cases:

- A skipped `<if>` that removes the only indexed condition →
  full scan branch. Decide: is that branch ever called with real data
  volume?
- `<foreach>` IN-lists with **100+ items** → consider a temp-table
  JOIN instead (per `guide-mybatis.md` §5).

---

## Step 4. User-defined functions (`FN_*`)

If the query calls `FN_*` functions, apply the 4 checks from
`../backend/guide-mybatis.md` §6: call position, call frequency,
internal I/O, cacheability. If you cannot read the function source,
mark it "internal logic unverified" and say so in your report/PR.

💡 **Why WHERE-clause functions are the dangerous ones:** `WHERE
FN_CALC_FEE(ACCT_NO) > 100` must run the function on EVERY row before
filtering — the index on ACCT_NO cannot help. The same function in the
SELECT list runs only on rows that survived the WHERE. Position
changes cost by orders of magnitude.

---

## Step 5. When to recommend deep analysis

Even if all checks pass, flag the query for deeper review
(EXPLAIN ANALYZE / DBA look) when **any** of these is true:

- 3 or more dynamic SQL branches
- user-defined function used in WHERE
- 4 or more JOINed tables
- large reads with no LIMIT (full SELECT of a big table)

💡 **Why these thresholds?** Each one multiplies the ways the planner
can choose badly. Self-review catches structural mistakes; it cannot
predict the planner's row estimates on real data. EXPLAIN ANALYZE on
production-sized data can.

If this check made you change the query, include **before/after** in
your PR description.

---

**Related in this repo:** `/sql` skill (PostgreSQL + MyBatis best
practices), `../backend/guide-mybatis.md` (the writing rules this
checklist verifies).
