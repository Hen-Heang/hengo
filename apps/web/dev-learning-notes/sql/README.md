# 🗃️ SQL Fundamentals

[<- Back to root](../README.md)

## 🎯 Purpose

Daily SQL reference for CRUD, filtering, joins, and aggregation.

## 🧱 Statement Types

| Type | Purpose |
| --- | --- |
| `SELECT` | Read data |
| `INSERT` | Add data |
| `UPDATE` | Change data |
| `DELETE` | Remove data |

## 📐 Basic Query Shape

```sql
SELECT columns
FROM table
WHERE condition
ORDER BY column
LIMIT n OFFSET m;
```

## 🔎 Filtering

```sql
SELECT * FROM users WHERE status = 'ACTIVE';
SELECT * FROM users WHERE status = 'ACTIVE' AND age >= 18;
SELECT * FROM users WHERE status = 'ACTIVE' OR status = 'PENDING';
```

Comparison operators: `=` `!=` `<>` `>` `<` `>=` `<=`

## 🔤 Pattern Search (`LIKE`)

| Symbol | Meaning |
| --- | --- |
| `%` | 0 or more chars |
| `_` | exactly 1 char |

```sql
SELECT * FROM users WHERE username LIKE 'john%';
SELECT * FROM users WHERE email LIKE '%@gmail.com';
SELECT * FROM users WHERE username LIKE '%admin%';
```

## 🧭 `IN`, `BETWEEN`, and sorting

```sql
SELECT * FROM users WHERE id IN (1, 2, 3);
SELECT * FROM users WHERE age BETWEEN 18 AND 30;
SELECT * FROM users ORDER BY created_at DESC;
```

## 📄 Pagination

```sql
SELECT * FROM users LIMIT 10 OFFSET 0;
SELECT * FROM users LIMIT 10 OFFSET 10;
```

Formula: `offset = (page - 1) * page_size`

## ✍️ Write Operations

```sql
INSERT INTO users (username, email, status)
VALUES ('john', 'john@test.com', 'ACTIVE');
```

```sql
UPDATE users
SET status = 'INACTIVE'
WHERE id = 1;
```

```sql
DELETE FROM users
WHERE id = 1;
```

Important: always include `WHERE` for `UPDATE` and `DELETE` unless you intentionally target all rows.

## 🔗 JOIN

```sql
SELECT u.username, o.amount
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

SELECT u.username, o.amount
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;
```

## 📊 Aggregation

| Function | Meaning |
| --- | --- |
| `COUNT(*)` | Row count |
| `SUM(col)` | Sum |
| `AVG(col)` | Average |
| `MAX(col)` | Max |
| `MIN(col)` | Min |

```sql
SELECT status, COUNT(*) AS cnt
FROM users
GROUP BY status
HAVING COUNT(*) > 10;
```

## 🧠 Execution Order (Conceptual)

```sql
FROM -> JOIN -> WHERE -> GROUP BY -> SELECT -> HAVING -> ORDER BY -> LIMIT/OFFSET
```

## ⚡ Quick Cheat Sheet

```sql
SELECT * FROM users WHERE name LIKE '%john%';
SELECT * FROM users ORDER BY created_at DESC LIMIT 10 OFFSET 20;
INSERT INTO users (name, email) VALUES ('john', 'j@test.com');
UPDATE users SET status = 'INACTIVE' WHERE id = 1;
DELETE FROM users WHERE id = 1;
SELECT status, COUNT(*) FROM users GROUP BY status;
```
