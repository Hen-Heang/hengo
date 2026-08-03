# SQL Reference — Spring Boot + MyBatis Developer Guide

A comprehensive SQL reference from basics to advanced, focused on what a Spring Boot + MyBatis developer needs on the job.

---

## Table of Contents

1. [SQL Fundamentals](#1-sql-fundamentals)
2. [DML — CRUD Operations](#2-dml--crud-operations)
3. [Joins & Set Operations](#3-joins--set-operations)
4. [Aggregations & GROUP BY](#4-aggregations--group-by)
5. [Subqueries & CTEs](#5-subqueries--ctes)
6. [Window Functions](#6-window-functions)
7. [Database Design](#7-database-design)
8. [Indexing & Query Optimization](#8-indexing--query-optimization)
9. [Transactions & Concurrency](#9-transactions--concurrency)
10. [MyBatis SQL Patterns](#10-mybatis-sql-patterns)

---

## 1. SQL Fundamentals

### SELECT Structure

```sql
SELECT column1, column2, expression AS alias
FROM   table_name
WHERE  condition
ORDER  BY column1 ASC, column2 DESC
LIMIT  10 OFFSET 20;   -- MySQL / PostgreSQL
```

Full logical execution order (not written order):

```text
FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT
```

### Data Types

| Type | MySQL / PostgreSQL | Oracle | Notes |
| ---- | ----------------- | ------ | ----- |
| String | `VARCHAR(255)` | `VARCHAR2(255)` | Variable-length |
| Integer | `INT` / `BIGINT` | `NUMBER(10)` | Use BIGINT for PKs |
| Decimal | `DECIMAL(10,2)` | `NUMBER(10,2)` | Money fields |
| Date only | `DATE` | `DATE` | Oracle DATE includes time |
| Date + time | `DATETIME` / `TIMESTAMP` | `TIMESTAMP` | Prefer TIMESTAMP |
| Boolean | `BOOLEAN` / `TINYINT(1)` | `NUMBER(1)` | Oracle has no boolean |
| Large text | `TEXT` | `CLOB` | Don't index these |

### WHERE Operators

```sql
-- AND / OR
SELECT * FROM orders
WHERE  status = 'ACTIVE'
  AND  (total > 100 OR priority = 'HIGH');

-- IN list
SELECT * FROM products
WHERE  category_id IN (1, 2, 3);

-- BETWEEN (inclusive on both ends)
SELECT * FROM orders
WHERE  created_at BETWEEN '2024-01-01' AND '2024-12-31';

-- LIKE -- % = any characters, _ = single character
SELECT * FROM users
WHERE  email LIKE '%@gmail.com';     -- ends with
WHERE  username LIKE 'kim_%';        -- starts with + at least 1 char

-- IS NULL / IS NOT NULL
SELECT * FROM employees
WHERE  manager_id IS NULL;           -- top-level managers
```

### NULL Handling — COALESCE and NVL

```sql
-- COALESCE: returns first non-NULL value (standard SQL, works everywhere)
SELECT name, COALESCE(phone, email, 'No contact') AS contact
FROM   customers;

-- NVL: Oracle only -- NVL(value, fallback)
SELECT NVL(commission, 0) AS commission FROM employees;

-- NVL2: Oracle -- NVL2(value, if_not_null, if_null)
SELECT NVL2(commission, 'Has commission', 'No commission') FROM employees;

-- NULLIF: returns NULL if two values are equal (useful for division)
SELECT total / NULLIF(quantity, 0) AS unit_price FROM order_lines;
```

### ORDER BY, LIMIT / OFFSET, FETCH FIRST

```sql
-- MySQL / PostgreSQL
SELECT * FROM products
ORDER  BY price DESC, name ASC
LIMIT  10 OFFSET 20;          -- page 3 of 10 items per page

-- Oracle (12c+) -- FETCH FIRST
SELECT * FROM products
ORDER  BY price DESC
FETCH  FIRST 10 ROWS ONLY;

-- Oracle -- OFFSET + FETCH
SELECT * FROM products
ORDER  BY price DESC
OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;

-- Oracle (older, pre-12c) -- ROWNUM
SELECT * FROM (
    SELECT t.*, ROWNUM rn FROM products t
    WHERE  ROWNUM <= 30
)
WHERE  rn > 20;
```

---

## 2. DML — CRUD Operations

### INSERT INTO

```sql
-- Single row
INSERT INTO users (username, email, created_at)
VALUES ('kim_dev', 'kim@example.com', NOW());

-- Multiple rows (MySQL / PostgreSQL)
INSERT INTO users (username, email)
VALUES ('lee_dev', 'lee@example.com'),
       ('park_dev', 'park@example.com'),
       ('choi_dev', 'choi@example.com');

-- Insert from SELECT
INSERT INTO archived_orders (order_id, total, archived_at)
SELECT order_id, total, NOW()
FROM   orders
WHERE  status = 'CLOSED' AND created_at < '2023-01-01';
```

### UPDATE

```sql
-- Basic update
UPDATE products
SET    price = price * 1.10,
       updated_at = NOW()
WHERE  category_id = 5;

-- Update with JOIN (MySQL)
UPDATE orders o
JOIN   customers c ON o.customer_id = c.id
SET    o.priority = 'VIP'
WHERE  c.tier = 'GOLD';

-- Update with subquery (standard SQL / Oracle)
UPDATE orders
SET    priority = 'VIP'
WHERE  customer_id IN (
    SELECT id FROM customers WHERE tier = 'GOLD'
);
```

### DELETE vs TRUNCATE

```sql
-- DELETE: logged, respects WHERE, can ROLLBACK
DELETE FROM sessions
WHERE  expires_at < NOW();

-- TRUNCATE: fast, removes ALL rows, minimal logging
-- Cannot rollback in some databases, resets AUTO_INCREMENT
TRUNCATE TABLE temp_import_data;
```

| Feature | DELETE | TRUNCATE |
| ------- | ------ | -------- |
| WHERE clause | Yes | No |
| Rollback | Yes | DB-dependent |
| Triggers fire | Yes | No (usually) |
| Speed | Slow on large tables | Very fast |
| Resets auto-increment | No | Yes |

### MERGE (Upsert) — Critical for MyBatis Batch Jobs

```sql
-- Oracle MERGE
MERGE INTO products p
USING (SELECT 1001 AS product_id, 'New Name' AS name, 99.99 AS price FROM DUAL) src
ON (p.product_id = src.product_id)
WHEN MATCHED THEN
    UPDATE SET p.name = src.name, p.price = src.price, p.updated_at = SYSDATE
WHEN NOT MATCHED THEN
    INSERT (product_id, name, price, created_at)
    VALUES (src.product_id, src.name, src.price, SYSDATE);

-- MySQL equivalent -- INSERT ... ON DUPLICATE KEY UPDATE
INSERT INTO products (product_id, name, price)
VALUES (1001, 'New Name', 99.99)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    price = VALUES(price),
    updated_at = NOW();

-- PostgreSQL -- INSERT ... ON CONFLICT
INSERT INTO products (product_id, name, price)
VALUES (1001, 'New Name', 99.99)
ON CONFLICT (product_id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    updated_at = NOW();
```

---

## 3. Joins & Set Operations

### INNER JOIN — Only Matching Rows

```sql
SELECT o.order_id, c.name, o.total
FROM   orders o
INNER  JOIN customers c ON o.customer_id = c.id
WHERE  o.status = 'ACTIVE';
```

### LEFT JOIN — Keep All Left Rows

```sql
-- Returns all customers, even those with no orders
SELECT c.name, COUNT(o.order_id) AS order_count
FROM   customers c
LEFT   JOIN orders o ON c.id = o.customer_id
GROUP  BY c.id, c.name;

-- Find customers with NO orders
SELECT c.name
FROM   customers c
LEFT   JOIN orders o ON c.id = o.customer_id
WHERE  o.order_id IS NULL;
```

### RIGHT JOIN

```sql
-- Rarely used -- prefer LEFT JOIN with tables swapped
-- Returns all departments, including those with no employees
SELECT d.name, e.full_name
FROM   employees e
RIGHT  JOIN departments d ON e.dept_id = d.id;
```

### Self JOIN — Hierarchical Data (Org Chart)

```sql
-- Employee and their manager (both in same table)
SELECT e.full_name AS employee,
       m.full_name AS manager
FROM   employees e
LEFT   JOIN employees m ON e.manager_id = m.id
ORDER  BY m.full_name NULLS FIRST;

-- Find all direct reports of a specific manager
SELECT e.full_name
FROM   employees e
JOIN   employees m ON e.manager_id = m.id
WHERE  m.full_name = 'Kim Manager';
```

### UNION vs UNION ALL

```sql
-- UNION: removes duplicates (costs extra sort)
SELECT email FROM customers
UNION
SELECT email FROM newsletter_subscribers;

-- UNION ALL: keeps duplicates, faster
SELECT product_id, 'SALE' AS source FROM sale_items
UNION ALL
SELECT product_id, 'REGULAR' AS source FROM regular_items;
```

### INTERSECT

```sql
-- Rows that exist in BOTH result sets
SELECT customer_id FROM online_orders
INTERSECT
SELECT customer_id FROM in_store_orders;
-- Customers who shop both online and in-store
```

---

## 4. Aggregations & GROUP BY

### Aggregate Functions

```sql
SELECT
    COUNT(*)           AS total_rows,
    COUNT(email)       AS rows_with_email,   -- excludes NULLs
    SUM(total)         AS revenue,
    AVG(total)         AS avg_order,
    MIN(created_at)    AS first_order,
    MAX(created_at)    AS last_order
FROM orders
WHERE status = 'COMPLETE';
```

### GROUP BY

```sql
-- Sales per category per month
SELECT
    c.name                                         AS category,
    DATE_FORMAT(o.created_at, '%Y-%m')             AS month,  -- MySQL
    -- TO_CHAR(o.created_at, 'YYYY-MM')            AS month,  -- Oracle
    COUNT(*)                                       AS orders,
    SUM(oi.quantity * oi.unit_price)               AS revenue
FROM   order_items oi
JOIN   orders o     ON oi.order_id   = o.id
JOIN   products p   ON oi.product_id = p.id
JOIN   categories c ON p.category_id = c.id
WHERE  o.status = 'COMPLETE'
GROUP  BY c.name, DATE_FORMAT(o.created_at, '%Y-%m')
ORDER  BY month DESC, revenue DESC;
```

### HAVING vs WHERE

```sql
-- WHERE filters BEFORE grouping (uses index)
-- HAVING filters AFTER grouping (no index benefit)

SELECT customer_id, SUM(total) AS total_spent
FROM   orders
WHERE  status = 'COMPLETE'          -- row-level filter (use WHERE here)
GROUP  BY customer_id
HAVING SUM(total) > 10000           -- group-level filter (must use HAVING)
ORDER  BY total_spent DESC;
```

### COUNT(DISTINCT)

```sql
-- Count unique customers who placed orders this month
SELECT COUNT(DISTINCT customer_id) AS unique_buyers
FROM   orders
WHERE  created_at >= '2024-01-01';

-- Unique buyers per category
SELECT c.name, COUNT(DISTINCT o.customer_id) AS unique_buyers
FROM   order_items oi
JOIN   orders o   ON oi.order_id = o.id
JOIN   products p ON oi.product_id = p.id
JOIN   categories c ON p.category_id = c.id
GROUP  BY c.name;
```

### ROLLUP — Subtotals and Grand Totals

```sql
-- MySQL / PostgreSQL
SELECT region, department, SUM(salary) AS total
FROM   employees
GROUP  BY ROLLUP(region, department);

-- Oracle
SELECT region, department, SUM(salary) AS total
FROM   employees
GROUP  BY ROLLUP(region, department);

-- Result includes: region+dept subtotals, region subtotals, grand total
-- NULL in a column indicates a rollup row
```

---

## 5. Subqueries & CTEs

### Scalar Subquery in SELECT

```sql
-- Adds a calculated column from another table per row
SELECT
    p.name,
    p.price,
    (SELECT AVG(price) FROM products WHERE category_id = p.category_id) AS avg_category_price,
    p.price - (SELECT AVG(price) FROM products WHERE category_id = p.category_id) AS diff_from_avg
FROM products p;
```

### Table Subquery in FROM

```sql
-- Use a derived table as if it were a real table
SELECT dept, AVG(emp_count) AS avg_headcount
FROM (
    SELECT department_id AS dept, COUNT(*) AS emp_count
    FROM   employees
    GROUP  BY department_id
) AS dept_counts
GROUP  BY dept;
```

### Correlated Subquery

```sql
-- References outer query -- runs once per outer row (can be slow)
SELECT e.full_name, e.salary
FROM   employees e
WHERE  e.salary > (
    SELECT AVG(salary)
    FROM   employees
    WHERE  department_id = e.department_id   -- correlated reference
);
-- Tip: Often replaceable with a window function (faster)
```

### EXISTS vs IN — Performance Difference

```sql
-- IN: fetches all matching IDs first, then compares
-- Slow when subquery returns many rows
SELECT * FROM customers
WHERE  id IN (SELECT customer_id FROM orders WHERE total > 500);

-- EXISTS: stops as soon as first match is found
-- Faster for large datasets, especially with proper indexes
SELECT * FROM customers c
WHERE  EXISTS (
    SELECT 1 FROM orders o
    WHERE  o.customer_id = c.id AND o.total > 500
);

-- NOT EXISTS vs NOT IN: NOT IN fails silently with NULLs!
-- If orders.customer_id can be NULL, NOT IN returns no rows!
-- Always use NOT EXISTS for safety:
SELECT * FROM customers c
WHERE  NOT EXISTS (
    SELECT 1 FROM orders o WHERE o.customer_id = c.id
);
```

### WITH Clause (CTE)

```sql
-- Makes complex queries readable and reusable
WITH monthly_revenue AS (
    SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        SUM(total)                        AS revenue
    FROM   orders
    WHERE  status = 'COMPLETE'
    GROUP  BY DATE_FORMAT(created_at, '%Y-%m')
),
ranked AS (
    SELECT month, revenue,
           RANK() OVER (ORDER BY revenue DESC) AS rnk
    FROM   monthly_revenue
)
SELECT * FROM ranked WHERE rnk <= 3;
```

### Recursive CTE — Tree / Hierarchical Data

```sql
-- Build full org chart from self-referencing table
WITH RECURSIVE org_tree AS (
    -- Anchor: start from the CEO (no manager)
    SELECT id, full_name, manager_id, 0 AS depth, CAST(full_name AS CHAR(1000)) AS path
    FROM   employees
    WHERE  manager_id IS NULL

    UNION ALL

    -- Recursive: find direct reports at each level
    SELECT e.id, e.full_name, e.manager_id, ot.depth + 1, CONCAT(ot.path, ' > ', e.full_name)
    FROM   employees e
    JOIN   org_tree ot ON e.manager_id = ot.id
)
SELECT depth, full_name, path FROM org_tree ORDER BY path;

-- Oracle syntax: CONNECT BY PRIOR (alternative)
SELECT LEVEL, full_name,
       SYS_CONNECT_BY_PATH(full_name, ' > ') AS path
FROM   employees
START  WITH manager_id IS NULL
CONNECT BY PRIOR id = manager_id;
```

---

## 6. Window Functions

Window functions compute values across rows related to the current row without collapsing them (unlike GROUP BY). Essential for reports.

### ROW_NUMBER() OVER (PARTITION BY)

```sql
-- Rank orders per customer by date (newest = 1)
SELECT
    order_id,
    customer_id,
    created_at,
    ROW_NUMBER() OVER (
        PARTITION BY customer_id
        ORDER BY created_at DESC
    ) AS rn
FROM orders;

-- Get only the most recent order per customer
SELECT * FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) AS rn
    FROM orders
) t
WHERE rn = 1;
```

### RANK() vs DENSE_RANK()

```sql
SELECT
    full_name,
    salary,
    RANK()       OVER (ORDER BY salary DESC) AS rnk,
    DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rnk
FROM employees;

-- Scores: 100, 90, 90, 80
-- RANK:        1,  2,  2,  4   (gap after tie)
-- DENSE_RANK:  1,  2,  2,  3   (no gap)
```

### LAG / LEAD — Comparing Rows

```sql
-- Compare current month revenue to previous month
SELECT
    month,
    revenue,
    LAG(revenue, 1)  OVER (ORDER BY month) AS prev_month,
    LEAD(revenue, 1) OVER (ORDER BY month) AS next_month,
    revenue - LAG(revenue, 1) OVER (ORDER BY month) AS mom_change
FROM monthly_revenue;

-- LAG/LEAD with PARTITION: compare within groups
SELECT
    department_id,
    full_name,
    hire_date,
    LAG(full_name) OVER (PARTITION BY department_id ORDER BY hire_date) AS previous_hire
FROM employees;
```

### Running Totals — SUM() OVER

```sql
-- Cumulative revenue over time
SELECT
    order_date,
    daily_revenue,
    SUM(daily_revenue) OVER (ORDER BY order_date ROWS UNBOUNDED PRECEDING) AS cumulative_revenue,
    SUM(daily_revenue) OVER (ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS rolling_7day
FROM daily_sales;

-- Running total per category
SELECT
    category,
    order_date,
    daily_revenue,
    SUM(daily_revenue) OVER (
        PARTITION BY category
        ORDER BY order_date
        ROWS UNBOUNDED PRECEDING
    ) AS cumulative_by_category
FROM daily_sales_by_category;

-- % of total using window function
SELECT
    name,
    revenue,
    SUM(revenue) OVER () AS grand_total,
    ROUND(revenue * 100.0 / SUM(revenue) OVER (), 2) AS pct_of_total
FROM product_revenue;
```

---

## 7. Database Design

### Primary Key and Foreign Key

```sql
CREATE TABLE departments (
    id          INT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    CONSTRAINT  pk_departments PRIMARY KEY (id)
);

CREATE TABLE employees (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    full_name     VARCHAR(200) NOT NULL,
    department_id INT,
    manager_id    BIGINT,
    CONSTRAINT pk_employees  PRIMARY KEY (id),
    CONSTRAINT fk_emp_dept   FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_emp_mgr    FOREIGN KEY (manager_id)    REFERENCES employees(id)   ON DELETE SET NULL
);
```

### 1:N and N:M Relationships

```sql
-- 1:N -- One customer, many orders
CREATE TABLE customers (
    id   BIGINT PRIMARY KEY,
    name VARCHAR(200) NOT NULL
);

CREATE TABLE orders (
    id          BIGINT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- N:M -- Many students, many courses
-- Requires a junction (bridge) table
CREATE TABLE students (id BIGINT PRIMARY KEY, name VARCHAR(200));
CREATE TABLE courses  (id BIGINT PRIMARY KEY, title VARCHAR(200));

CREATE TABLE student_courses (
    student_id BIGINT NOT NULL,
    course_id  BIGINT NOT NULL,
    enrolled_at DATE,
    PRIMARY KEY (student_id, course_id),           -- composite PK
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id)  REFERENCES courses(id)
);
```

### Normalization — 1NF, 2NF, 3NF

**1NF (First Normal Form)** — Each column holds atomic (indivisible) values; no repeating groups.

```text
BAD:  orders(id, customer_name, items)   -- "product1, product2" in one column
GOOD: orders(id, customer_name) + order_items(order_id, product_id, qty)
```

**2NF (Second Normal Form)** — 1NF + every non-key column depends on the FULL primary key (no partial dependencies). Matters with composite PKs.

```text
BAD:  order_items(order_id, product_id, product_name, qty)
      -- product_name depends only on product_id, not the full PK
GOOD: order_items(order_id, product_id, qty) + products(id, name)
```

**3NF (Third Normal Form)** — 2NF + no transitive dependencies (non-key column depending on another non-key column).

```text
BAD:  employees(id, dept_id, dept_name)
      -- dept_name depends on dept_id, not on id
GOOD: employees(id, dept_id) + departments(id, name)
```

### Constraints

```sql
CREATE TABLE products (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    sku         VARCHAR(50)  NOT NULL,
    name        VARCHAR(200) NOT NULL,
    price       DECIMAL(10,2) NOT NULL,
    stock       INT          NOT NULL DEFAULT 0,
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',

    PRIMARY KEY (id),
    UNIQUE KEY uq_sku (sku),                             -- UNIQUE
    CONSTRAINT chk_price  CHECK (price >= 0),            -- CHECK
    CONSTRAINT chk_stock  CHECK (stock >= 0),
    CONSTRAINT chk_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'DISCONTINUED'))
);
```

---

## 8. Indexing & Query Optimization

### B-Tree Index (Default)

```sql
-- Single column index
CREATE INDEX idx_orders_customer ON orders(customer_id);

-- Index is used for: =, <, >, BETWEEN, LIKE 'prefix%'
-- Index is NOT used for: LIKE '%suffix', function on column, type mismatch

-- Good: uses index
SELECT * FROM orders WHERE customer_id = 123;

-- Bad: function on indexed column disables index
SELECT * FROM orders WHERE YEAR(created_at) = 2024;

-- Good: range on indexed column
SELECT * FROM orders WHERE created_at >= '2024-01-01';
```

### Composite Index — Column Order Matters

```sql
-- Composite index: (status, customer_id, created_at)
CREATE INDEX idx_orders_composite ON orders(status, customer_id, created_at);

-- USES index (leftmost prefix rule)
-- WHERE status = 'ACTIVE'
-- WHERE status = 'ACTIVE' AND customer_id = 123
-- WHERE status = 'ACTIVE' AND customer_id = 123 AND created_at > '2024-01-01'

-- DOES NOT USE index
-- WHERE customer_id = 123          -- skips leftmost column
-- WHERE created_at > '2024-01-01' -- skips first two columns

-- Rule: put equality conditions first, range conditions last
```

### Covering Index

```sql
-- A covering index contains ALL columns needed by the query
-- No need to access the actual table row ("index-only scan")
CREATE INDEX idx_covering ON orders(customer_id, status, total);

-- This query can be satisfied entirely from the index:
SELECT customer_id, status, SUM(total)
FROM   orders
WHERE  customer_id = 123
GROUP  BY customer_id, status;
```

### EXPLAIN / EXPLAIN PLAN

```sql
-- MySQL / PostgreSQL
EXPLAIN SELECT * FROM orders WHERE customer_id = 123;
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 123;

-- Oracle
EXPLAIN PLAN FOR
SELECT * FROM orders WHERE customer_id = 123;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Key columns to check in EXPLAIN output:
-- type/access: ALL (table scan, BAD) vs ref/range (index, GOOD)
-- rows: estimated rows scanned -- should be low
-- Extra: "Using index" = covering index (great)
--        "Using filesort" = ORDER BY can't use index (tune this)
--        "Using temporary" = implicit GROUP BY temp table (bad at scale)
```

### Common Slow Query Patterns to Avoid

```sql
-- 1. Function on indexed column
-- BAD:
SELECT * FROM users WHERE LOWER(email) = 'kim@test.com';
-- GOOD: store emails already lowercased, or use functional index
CREATE INDEX idx_email_lower ON users((LOWER(email)));  -- PostgreSQL
SELECT * FROM users WHERE email = 'kim@test.com';

-- 2. Leading wildcard
-- BAD (full table scan):
SELECT * FROM products WHERE name LIKE '%phone%';
-- GOOD: use full-text search or Elasticsearch for keyword search

-- 3. SELECT * -- fetches unused columns, breaks covering indexes
-- BAD:
SELECT * FROM orders WHERE customer_id = 123;
-- GOOD:
SELECT order_id, total, status FROM orders WHERE customer_id = 123;

-- 4. OR on different columns (prevents index use)
-- BAD:
SELECT * FROM contacts WHERE phone = '010-0000-0000' OR email = 'kim@example.com';
-- GOOD: UNION ALL
SELECT * FROM contacts WHERE phone = '010-0000-0000'
UNION ALL
SELECT * FROM contacts WHERE email = 'kim@example.com';
```

### N+1 Problem

The N+1 problem occurs when code fetches 1 parent row then runs N separate queries for child rows.

```sql
-- BAD pattern in application code:
-- SELECT * FROM customers;              -- 1 query, returns N customers
-- Then for each customer:
-- SELECT * FROM orders WHERE customer_id = ?;  -- N more queries!

-- GOOD: single JOIN query
SELECT c.id, c.name, o.order_id, o.total
FROM   customers c
JOIN   orders o ON c.id = o.customer_id
WHERE  c.id IN (1, 2, 3, 4, 5);

-- In MyBatis: use a single <select> with JOIN + ResultMap
-- rather than nested selects for each parent record
```

---

## 9. Transactions & Concurrency

### ACID Properties

| Property | Meaning | Example |
| -------- | ------- | ------- |
| **Atomicity** | All operations succeed or all rollback | Bank transfer: debit + credit both succeed or both fail |
| **Consistency** | DB moves from one valid state to another | Balance can never go below 0 |
| **Isolation** | Concurrent transactions don't interfere | Two users booking the last seat |
| **Durability** | Committed data survives system failure | Data written to disk before commit returns |

```sql
-- Basic transaction
BEGIN;  -- or START TRANSACTION (MySQL)

UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
UPDATE accounts SET balance = balance + 1000 WHERE id = 2;

-- Check for errors in application code, then:
COMMIT;    -- make permanent
-- or:
ROLLBACK;  -- undo all changes since BEGIN
```

### Isolation Levels

```sql
-- MySQL
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- Oracle: only supports READ COMMITTED and SERIALIZABLE
ALTER SESSION SET ISOLATION_LEVEL = SERIALIZABLE;
```

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read |
| --------------- | ---------- | ------------------- | ------------ |
| READ UNCOMMITTED | Possible | Possible | Possible |
| READ COMMITTED (default) | Prevented | Possible | Possible |
| REPEATABLE READ (MySQL default) | Prevented | Prevented | Possible |
| SERIALIZABLE | Prevented | Prevented | Prevented |

**Dirty Read** — Reading uncommitted data from another transaction.

```sql
-- Transaction A:
UPDATE products SET price = 999 WHERE id = 1;
-- (not yet committed)

-- Transaction B (READ UNCOMMITTED):
SELECT price FROM products WHERE id = 1;  -- sees 999 (dirty!)

-- Transaction A:
ROLLBACK;  -- price was never really 999
-- Transaction B read wrong data
```

**Phantom Read** — A re-executed query returns new rows added by another committed transaction.

```sql
-- Transaction A:
SELECT COUNT(*) FROM orders WHERE date = '2024-01-15';  -- returns 10

-- Transaction B: INSERT INTO orders ... date = '2024-01-15' + COMMIT;

-- Transaction A:
SELECT COUNT(*) FROM orders WHERE date = '2024-01-15';  -- now returns 11!
```

### Deadlock Example and Prevention

```sql
-- DEADLOCK SCENARIO:
-- Transaction A:
UPDATE accounts SET balance = balance - 100 WHERE id = 1;  -- locks row 1
UPDATE accounts SET balance = balance + 100 WHERE id = 2;  -- waits for B's lock on row 2

-- Transaction B (at same time):
UPDATE accounts SET balance = balance - 50 WHERE id = 2;   -- locks row 2
UPDATE accounts SET balance = balance + 50 WHERE id = 1;   -- waits for A's lock on row 1
-- DEADLOCK: each waits for the other -- DB kills one transaction

-- PREVENTION: always lock resources in the same order
-- Transaction A and B should always update id=1 THEN id=2
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;  -- always smaller id first
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

### SAVEPOINT

```sql
BEGIN;

INSERT INTO orders (customer_id, total) VALUES (1, 500);
SAVEPOINT after_order;

INSERT INTO order_items (order_id, product_id, qty) VALUES (LAST_INSERT_ID(), 10, 2);
-- Something fails here...

ROLLBACK TO SAVEPOINT after_order;   -- undo items, keep order row

-- Try alternative logic...
INSERT INTO order_items (order_id, product_id, qty) VALUES (LAST_INSERT_ID(), 10, 1);

COMMIT;
```

---

## 10. MyBatis SQL Patterns

### `<if>` Dynamic WHERE

```xml
<!-- UserMapper.xml -->
<select id="searchUsers" resultType="UserDto">
    SELECT id, username, email, status
    FROM   users
    <where>
        <!-- <where> auto-adds WHERE and strips leading AND/OR -->
        <if test="username != null and username != ''">
            AND username LIKE CONCAT('%', #{username}, '%')
        </if>
        <if test="status != null">
            AND status = #{status}
        </if>
        <if test="startDate != null">
            AND created_at >= #{startDate}
        </if>
        <if test="endDate != null">
            AND created_at &lt;= #{endDate}
        </if>
    </where>
    ORDER BY created_at DESC
</select>
```

### `<foreach>` for IN Lists

```xml
<!-- Get orders by list of IDs -->
<select id="getOrdersByIds" resultType="OrderDto">
    SELECT * FROM orders
    WHERE  order_id IN
    <foreach item="id" collection="list" open="(" separator="," close=")">
        #{id}
    </foreach>
</select>

<!-- Batch INSERT with <foreach> -->
<insert id="batchInsertOrderItems">
    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
    VALUES
    <foreach item="item" collection="list" separator=",">
        (#{item.orderId}, #{item.productId}, #{item.quantity}, #{item.unitPrice})
    </foreach>
</insert>
```

### Pagination — MySQL vs Oracle

```xml
<!-- MySQL / PostgreSQL pagination -->
<select id="getProductsPage" resultType="ProductDto">
    SELECT id, name, price
    FROM   products
    WHERE  status = 'ACTIVE'
    ORDER  BY created_at DESC
    LIMIT  #{pageSize} OFFSET #{offset}
</select>

<!-- Oracle 12c+ pagination -->
<select id="getProductsPage" resultType="ProductDto" databaseId="oracle">
    SELECT id, name, price
    FROM   products
    WHERE  status = 'ACTIVE'
    ORDER  BY created_at DESC
    OFFSET #{offset} ROWS FETCH NEXT #{pageSize} ROWS ONLY
</select>

<!-- Oracle pre-12c with ROWNUM -->
<select id="getProductsPage" resultType="ProductDto" databaseId="oracle_legacy">
    SELECT * FROM (
        SELECT t.*, ROWNUM rn
        FROM (
            SELECT id, name, price
            FROM   products
            WHERE  status = 'ACTIVE'
            ORDER  BY created_at DESC
        ) t
        WHERE ROWNUM &lt;= #{endRow}
    )
    WHERE rn &gt; #{startRow}
</select>
```

Java mapper call:

```java
// Service layer
int offset = (pageNumber - 1) * pageSize;
List<ProductDto> products = productMapper.getProductsPage(pageSize, offset);
```

### `<choose><when>` Switch Pattern

```xml
<select id="getOrdersSorted" resultType="OrderDto">
    SELECT * FROM orders
    WHERE customer_id = #{customerId}
    ORDER BY
    <choose>
        <when test="sortBy == 'total'">total DESC</when>
        <when test="sortBy == 'date'">created_at DESC</when>
        <when test="sortBy == 'status'">status ASC</when>
        <otherwise>created_at DESC</otherwise>
    </choose>
</select>
```

### ResultMap for JOIN Results

```xml
<!-- Mapper XML -->
<resultMap id="OrderWithItemsMap" type="OrderDto">
    <id     property="orderId"     column="order_id" />
    <result property="totalAmount" column="total" />
    <result property="status"      column="status" />

    <!-- 1:1 nested object -->
    <association property="customer" javaType="CustomerDto">
        <id     property="customerId" column="customer_id" />
        <result property="name"       column="customer_name" />
        <result property="email"      column="customer_email" />
    </association>

    <!-- 1:N nested collection -->
    <collection property="items" ofType="OrderItemDto">
        <id     property="itemId"      column="item_id" />
        <result property="productName" column="product_name" />
        <result property="quantity"    column="quantity" />
        <result property="unitPrice"   column="unit_price" />
    </collection>
</resultMap>

<select id="getOrderWithDetails" resultMap="OrderWithItemsMap">
    SELECT
        o.id          AS order_id,
        o.total,
        o.status,
        c.id          AS customer_id,
        c.name        AS customer_name,
        c.email       AS customer_email,
        oi.id         AS item_id,
        p.name        AS product_name,
        oi.quantity,
        oi.unit_price
    FROM   orders o
    JOIN   customers c    ON o.customer_id    = c.id
    JOIN   order_items oi ON o.id             = oi.order_id
    JOIN   products p     ON oi.product_id    = p.id
    WHERE  o.id = #{orderId}
</select>
```

---

## Priority Study Table

| # | Section | Priority | Why Critical |
| - | ------- | -------- | ------------ |
| 1 | SQL Fundamentals | 5/5 | Every query starts here |
| 2 | DML & MERGE | 5/5 | Daily CRUD + batch jobs |
| 3 | Joins & Set Ops | 5/5 | Real data is relational |
| 10 | MyBatis Patterns | 5/5 | Your ORM — know it cold |
| 4 | Aggregations | 4/5 | Reports & dashboards |
| 5 | Subqueries & CTEs | 4/5 | Complex business logic |
| 8 | Indexing & EXPLAIN | 4/5 | Performance matters at scale |
| 9 | Transactions | 4/5 | @Transactional understanding |
| 6 | Window Functions | 3/5 | Advanced reports & ranking |
| 7 | DB Design | 3/5 | Schema design + normalization |

> **Tip for MyBatis developers:** Master sections 1, 2, 3, and 10 first. These are the 80% of what you write daily. Add sections 4, 5, and 8 to handle reports and slow queries. Window functions (6) and transactions (9) round out senior-level SQL skill.
