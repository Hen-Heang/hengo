---
name: sql
description: 'Get SQL best practices for PostgreSQL and MyBatis mappers — writing rules, index usage, dynamic SQL analysis, and the query quality checklist'
---

# SQL Best Practices (PostgreSQL + MyBatis)

Your goal is to help me write correct, fast, and safe SQL.
This merges the team guidelines from `guides/backend/guide-mybatis.md`,
`guides/checklists/query-quality-check.md`, and the DB rules in
`guides/conventions/base-rule.md` into one place, in simple English.

## Writing Rules

- Write SQL in UPPERCASE: keywords, table names, column names
  (`SELECT USER_ID FROM TB_USER WHERE USER_ID = #{userId}`).
- Exception: MyBatis parameters (`#{userId}`) and variables inside
  dynamic tags (`<if test="email != null">`) stay camelCase.
- Never use `SELECT *`. List the columns you need.
- Do not add a schema prefix (`schema.TB_USER`) when the DB connection
  already sets `search_path`. Follow the project's single source of
  truth for this rule.
- Always use bind parameters (`#{param}`), never string concatenation
  (`${param}`) for values — `${}` allows SQL injection.
- Never hardcode DB passwords, connection strings, or API keys in
  code, docs, or logs.

## Self-Check (run this on every query you write or change)

Check these 8 points before you call a query done:

1. **Purpose** — business goal, where it is called, how often it runs.
2. **Input/Output** — parameter → column mapping, result column list.
3. **JOIN structure** — why each JOIN exists, table relationships,
   which table drives the query.
4. **WHERE conditions** — which index each condition uses
   (PK / UNIQUE / normal / none).
5. **Dynamic SQL** — analyze each branch separately (see below).
6. **User-defined functions** — `FN_*` calls (see below).
7. **Index usage** — classify each access as Eq / Range / Seq Scan.
8. **Optimization points** — JOIN order, missed indexes, useless
   JOINs, duplicate conditions, possible N+1.

## Index Access Patterns

| Pattern      | Meaning                                            | Notes                                          |
| ------------ | -------------------------------------------------- | ---------------------------------------------- |
| **Eq**       | `WHERE col = value` — exact index match            | Fastest. Works with PK, UNIQUE, normal indexes |
| **Range**    | `BETWEEN`, `>= / <=`, `LIKE 'x%'`                  | Range scan using index order                   |
| **Seq Scan** | No index — reads the whole table row by row        | OK for small tables only. Avoid on big tables  |

- A leading wildcard (`LIKE '%x'`) cannot use a normal index.
- A function wrapped around a column (`WHERE TO_CHAR(REG_DT,...) = ...`)
  blocks the index. Move the function to the parameter side instead.

## Dynamic SQL (MyBatis) — analyze every branch

Dynamic tags change the final SQL, so check index usage per branch:

- `<if>`: compare the WHERE clause with the condition present and
  absent. Watch for the case where removing an optional condition
  makes the query lose its index and fall to Seq Scan.
- `<choose>/<when>/<otherwise>`: compare the index usage of each path.
- `<foreach>` (IN lists): large lists hurt performance. For 100+
  items, switch to a temporary table JOIN.
- `<where>/<set>/<trim>`: write out the final generated SQL and check
  the index usage of that real SQL.

## User-Defined Functions (`FN_*`)

Functions inside SQL can be slow. Check 4 things:

1. **Call position** — SELECT / WHERE / JOIN. A function in WHERE can
   block index usage — biggest impact.
2. **Call frequency** — once per row vs once per group. Per-row calls
   on large results are expensive.
3. **Internal I/O** — does the function read other tables? With which
   index? If you cannot see the source, say "internal logic unknown".
4. **Caching** — can the result be cached (same input → same output)?

## Function Signature vs Column Type

- Before using `TO_CHAR`, `TO_DATE`, `CAST`, `SUBSTRING`, `LPAD`,
  `||`, or arithmetic on a column, confirm the column's real
  `data_type` from the table metadata.
- `TO_CHAR` directly on a varchar column fails at runtime
  (`function does not exist`) — there is no `TO_CHAR(varchar)`.
- Convert explicitly: `TO_DATE(varchar_col, 'YYYYMMDD')` first, then
  `TO_CHAR(date_value, 'YYYY.MM.DD')`.

## New Index Proposal

- In production, always use `CREATE INDEX CONCURRENTLY` — a plain
  `CREATE INDEX` takes an `ACCESS EXCLUSIVE` lock on the table.
- A proposal must include: index name (e.g. `idx_tb_user_email_dept`),
  target columns (single/composite), the query it helps, and the
  expected effect (Seq Scan → Eq/Range, response time).

## When to Recommend Deep Analysis

Even if the self-check passes, recommend `EXPLAIN ANALYZE` or a DBA
review when any of these is true:

- 3 or more dynamic SQL branches
- A user-defined function in the WHERE clause
- 4 or more JOINed tables
- A full SELECT without LIMIT on a large table
