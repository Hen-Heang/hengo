# Phase 3 — SQL and Database Internals

**Level:** Junior → Mid
**Time:** Months 5–7
**Goal:** Write production-quality SQL. Understand how the database engine actually executes queries. Design schemas for banking systems. Know Oracle PL/SQL well enough for core banking.

---

## 1. How Databases Work (Internals)

### Why you need to understand this
Developers who write slow queries or choose wrong isolation levels cause production outages. A double-withdrawal bug or a deadlock in a payment system can cost thousands of dollars per minute.

### B-Tree Indexes
```
Table: accounts (10 million rows)
SELECT * FROM accounts WHERE account_id = 'ACC-001';

Without index: DB reads ALL 10M rows → 10+ seconds
With index: DB traverses B-tree → ~3 reads → microseconds
```

A B-tree index is a sorted, balanced tree structure stored separately from the table data. Each node has pointers to children and to the actual row.

**When indexes help:**
- `WHERE account_id = ?` (equality on indexed column)
- `WHERE balance > 10000` (range on indexed column)
- `ORDER BY account_id` (sorted traversal)
- `JOIN ON a.id = b.account_id` (both sides indexed)

**When indexes HURT:**
- Small tables (full scan is faster than B-tree traversal)
- Very high write volume (every INSERT/UPDATE/DELETE must update all indexes)
- Low-cardinality columns: `WHERE status = 'ACTIVE'` if 99% are ACTIVE — index skipped anyway

**Composite index order matters:**
```sql
CREATE INDEX idx_txn ON transactions(account_id, created_at, status);
-- This index helps:  WHERE account_id = ? AND created_at > ?
-- This index helps:  WHERE account_id = ?
-- This DOES NOT help: WHERE created_at > ? (account_id missing from left)
-- Rule: most selective column first, then the rest in query order
```

---

## 2. ACID — The Foundation of Database Reliability

Every transaction in a bank must be ACID:

| Property | What it means | Banking example |
|----------|--------------|-----------------|
| **Atomicity** | All or nothing | Transfer: debit fails → credit never happens |
| **Consistency** | Rules always hold | Balance never negative, total money conserved |
| **Isolation** | Concurrent transactions don't interfere | Two withdrawals at same time see correct balance |
| **Durability** | Committed data survives crash | After "Transfer confirmed", data is on disk |

---

## 3. Isolation Levels (critical for interviews)

### The 3 Read Problems

```
Dirty Read: 
  TX1 updates balance to 0 (not committed)
  TX2 reads balance = 0
  TX1 rolls back → balance is 1000 again
  TX2 acted on wrong data

Non-Repeatable Read:
  TX1 reads balance = 1000
  TX2 commits: balance = 500
  TX1 reads balance again = 500 (different result in same transaction)

Phantom Read:
  TX1 queries: SELECT * FROM txns WHERE amount > 10000 → 5 rows
  TX2 inserts a new row with amount > 10000
  TX1 queries again → 6 rows (phantom appeared)
```

### The 4 Isolation Levels

| Level | Dirty Read | Non-Repeatable | Phantom | Performance |
|-------|-----------|----------------|---------|-------------|
| READ UNCOMMITTED | ✅ possible | ✅ possible | ✅ possible | Fastest |
| READ COMMITTED | ✗ prevented | ✅ possible | ✅ possible | Good |
| REPEATABLE READ | ✗ prevented | ✗ prevented | ✅ possible | Slower |
| SERIALIZABLE | ✗ prevented | ✗ prevented | ✗ prevented | Slowest |

**PostgreSQL default: READ COMMITTED**
**MySQL/InnoDB default: REPEATABLE READ**
**Oracle default: READ COMMITTED**

**For banking transfers:** Use REPEATABLE READ or lock the rows explicitly.

---

## 4. Locking

### Shared Lock (S) — for reading
```sql
SELECT balance FROM accounts WHERE id = 'ACC-001' FOR SHARE;
-- Other transactions can also read (share the lock)
-- No transaction can WRITE while S lock held
```

### Exclusive Lock (X) — for writing
```sql
SELECT balance FROM accounts WHERE id = 'ACC-001' FOR UPDATE;
-- Only ONE transaction holds this lock
-- Other transactions reading/writing WAIT
```

### Transfer — Correct Locking
```sql
BEGIN;
-- Lock both accounts in consistent order (prevents deadlock)
SELECT * FROM accounts
  WHERE id IN ('ACC-001', 'ACC-002')
  ORDER BY id  -- consistent order prevents deadlock
  FOR UPDATE;

-- Now safe to read-modify-write
UPDATE accounts SET balance = balance - 500 WHERE id = 'ACC-001';
UPDATE accounts SET balance = balance + 500 WHERE id = 'ACC-002';

-- Insert audit record
INSERT INTO transaction_log(from_id, to_id, amount, ts)
  VALUES ('ACC-001', 'ACC-002', 500, NOW());

COMMIT;
```

### Deadlock Example
```
TX1: LOCK accounts(ACC-001) → waiting for accounts(ACC-002)
TX2: LOCK accounts(ACC-002) → waiting for accounts(ACC-001)
→ Deadlock — database kills one, which rolls back and retries
```

---

## 5. SQL — Core Patterns for Banking

### Joins
```sql
-- INNER JOIN — only rows matching on both sides
SELECT a.id, a.balance, t.amount, t.type
FROM accounts a
INNER JOIN transactions t ON t.account_id = a.id
WHERE a.owner = 'HEANG';

-- LEFT JOIN — all accounts, transactions or NULL if none
SELECT a.id, COALESCE(SUM(t.amount), 0) AS total_spent
FROM accounts a
LEFT JOIN transactions t ON t.account_id = a.id AND t.type = 'DEBIT'
GROUP BY a.id;

-- Self-join — compare rows in same table
SELECT a1.id AS from_id, a2.id AS to_id, t.amount
FROM transactions t
JOIN accounts a1 ON t.from_account_id = a1.id
JOIN accounts a2 ON t.to_account_id = a2.id;
```

### Aggregates and Window Functions
```sql
-- Regular aggregate — collapses rows
SELECT account_id, SUM(amount) AS total, COUNT(*) AS count
FROM transactions
WHERE type = 'DEBIT'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY account_id
HAVING SUM(amount) > 100000  -- filter AFTER grouping
ORDER BY total DESC
LIMIT 10;

-- Window function — keeps all rows, adds aggregate alongside
SELECT
    id,
    account_id,
    amount,
    SUM(amount) OVER (PARTITION BY account_id ORDER BY created_at) AS running_balance,
    ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY created_at DESC) AS rn
FROM transactions;

-- Get latest transaction per account
SELECT * FROM (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY created_at DESC) AS rn
    FROM transactions
) t
WHERE rn = 1;
```

### CTEs (Common Table Expressions)
```sql
-- Break complex queries into readable steps
WITH daily_totals AS (
    SELECT
        account_id,
        DATE_TRUNC('day', created_at) AS day,
        SUM(amount) AS daily_amount
    FROM transactions
    WHERE type = 'DEBIT'
    GROUP BY account_id, DATE_TRUNC('day', created_at)
),
high_days AS (
    SELECT account_id, day, daily_amount
    FROM daily_totals
    WHERE daily_amount > 50000  -- suspicious large daily spend
)
SELECT a.owner, a.id, h.day, h.daily_amount
FROM high_days h
JOIN accounts a ON a.id = h.account_id
ORDER BY h.daily_amount DESC;
```

### EXPLAIN ANALYZE — read execution plans

```sql
EXPLAIN ANALYZE
SELECT a.id, SUM(t.amount)
FROM accounts a
JOIN transactions t ON t.account_id = a.id
WHERE a.branch_id = 5
GROUP BY a.id;

-- Look for:
-- Seq Scan on transactions → no index used → ADD INDEX
-- Hash Join vs Nested Loop → depends on table sizes
-- actual rows vs estimated rows → bad estimate → run ANALYZE to update stats
-- actual time=X → where the bottleneck is
```

---

## 6. Schema Design — Banking

### Normalization Rules

**1NF:** No repeating groups. Each column holds one value.
```sql
-- WRONG (multiple phone numbers in one column)
customer(id, name, phones="010-1234,010-5678")

-- RIGHT (separate table)
customer(id, name)
customer_phone(customer_id, phone, type)
```

**2NF:** No partial dependency on composite key.
**3NF:** No transitive dependency (non-key column depends only on key).

### Practical Banking Schema

```sql
CREATE TABLE customers (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    id_number   VARCHAR(20)  UNIQUE NOT NULL,  -- national ID
    email       VARCHAR(200) UNIQUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE accounts (
    id              BIGSERIAL PRIMARY KEY,
    account_number  VARCHAR(20)  UNIQUE NOT NULL,
    customer_id     BIGINT REFERENCES customers(id),
    type            VARCHAR(20)  NOT NULL CHECK (type IN ('SAVINGS','CHECKING','FIXED')),
    balance         NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    currency        CHAR(3) NOT NULL DEFAULT 'USD',
    status          VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transactions (
    id              BIGSERIAL PRIMARY KEY,
    ref_number      VARCHAR(40) UNIQUE NOT NULL,  -- idempotency key
    account_id      BIGINT REFERENCES accounts(id),
    type            VARCHAR(10) NOT NULL CHECK (type IN ('CREDIT','DEBIT','TRANSFER')),
    amount          NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    balance_after   NUMERIC(15,2) NOT NULL,        -- snapshot for audit
    description     VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100) NOT NULL           -- which user/system made this
);

CREATE INDEX idx_txn_account_time ON transactions(account_id, created_at DESC);
CREATE INDEX idx_txn_ref ON transactions(ref_number);
```

---

## 7. Oracle PL/SQL (Primary Target)

### Why banks use PL/SQL
Core banking systems (Temenos T24, Oracle FLEXCUBE) run on Oracle. Business logic for transfers, interest calculation, and statement generation is stored in Oracle packages. You will read and write PL/SQL at Korean-owned banks in Cambodia.

### Basic Structure
```sql
-- Anonymous block (for testing/scripts)
DECLARE
    v_balance   NUMBER;
    v_acc_id    VARCHAR2(20) := 'ACC001';
BEGIN
    SELECT balance INTO v_balance
    FROM accounts
    WHERE account_id = v_acc_id;

    IF v_balance < 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Balance cannot be negative');
    END IF;

    DBMS_OUTPUT.PUT_LINE('Balance: ' || v_balance);
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('Account not found: ' || v_acc_id);
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
/
```

### Stored Procedure — Transfer Money
```sql
CREATE OR REPLACE PROCEDURE transfer_money(
    p_from_id   IN  VARCHAR2,
    p_to_id     IN  VARCHAR2,
    p_amount    IN  NUMBER,
    p_ref_num   IN  VARCHAR2,
    p_status    OUT VARCHAR2
) AS
    v_from_balance  NUMBER;
    v_to_exists     NUMBER;
BEGIN
    -- Lock both rows in consistent order
    SELECT balance INTO v_from_balance
    FROM accounts
    WHERE account_id = p_from_id
    FOR UPDATE;

    SELECT COUNT(*) INTO v_to_exists
    FROM accounts
    WHERE account_id = p_to_id
    FOR UPDATE;

    -- Validate
    IF v_from_balance < p_amount THEN
        ROLLBACK;
        p_status := 'INSUFFICIENT_FUNDS';
        RETURN;
    END IF;

    IF v_to_exists = 0 THEN
        ROLLBACK;
        p_status := 'TARGET_NOT_FOUND';
        RETURN;
    END IF;

    -- Execute transfer
    UPDATE accounts SET balance = balance - p_amount
    WHERE account_id = p_from_id;

    UPDATE accounts SET balance = balance + p_amount
    WHERE account_id = p_to_id;

    -- Audit log
    INSERT INTO transaction_log(ref_num, from_id, to_id, amount, txn_date)
    VALUES (p_ref_num, p_from_id, p_to_id, p_amount, SYSDATE);

    COMMIT;
    p_status := 'SUCCESS';

EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        ROLLBACK;
        p_status := 'DUPLICATE_TRANSACTION';
    WHEN OTHERS THEN
        ROLLBACK;
        p_status := 'ERROR: ' || SQLERRM;
        -- In production: also log to error table
END transfer_money;
/
```

### Packages (how real PL/SQL is organized)
```sql
-- Package specification (public interface)
CREATE OR REPLACE PACKAGE account_pkg AS
    PROCEDURE transfer(p_from IN VARCHAR2, p_to IN VARCHAR2, p_amount IN NUMBER);
    FUNCTION get_balance(p_account_id IN VARCHAR2) RETURN NUMBER;
    FUNCTION calculate_interest(p_account_id IN VARCHAR2) RETURN NUMBER;
END account_pkg;
/

-- Package body (implementation)
CREATE OR REPLACE PACKAGE BODY account_pkg AS
    -- Private constant
    c_min_balance CONSTANT NUMBER := 0;

    FUNCTION get_balance(p_account_id IN VARCHAR2) RETURN NUMBER AS
        v_balance NUMBER;
    BEGIN
        SELECT balance INTO v_balance
        FROM accounts WHERE account_id = p_account_id;
        RETURN v_balance;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20002, 'Account not found: ' || p_account_id);
    END get_balance;

    PROCEDURE transfer(...) AS
    BEGIN ... END;

    FUNCTION calculate_interest(...) AS
    BEGIN ... END;
END account_pkg;
/
```

### Cursors
```sql
-- Explicit cursor — for processing row by row
DECLARE
    CURSOR c_accounts IS
        SELECT account_id, balance
        FROM accounts
        WHERE type = 'SAVINGS'
        AND balance > 10000;
    v_acc c_accounts%ROWTYPE;
BEGIN
    OPEN c_accounts;
    LOOP
        FETCH c_accounts INTO v_acc;
        EXIT WHEN c_accounts%NOTFOUND;
        -- Apply interest
        UPDATE accounts SET balance = v_acc.balance * 1.02
        WHERE account_id = v_acc.account_id;
    END LOOP;
    CLOSE c_accounts;
    COMMIT;
END;
/

-- Cursor FOR loop (simpler, auto-closes)
BEGIN
    FOR rec IN (SELECT account_id, balance FROM accounts WHERE type = 'SAVINGS') LOOP
        UPDATE accounts SET balance = rec.balance * 1.02
        WHERE account_id = rec.account_id;
    END LOOP;
    COMMIT;
END;
/
```

---

## 8. Connection Pooling — HikariCP

### Why it exists
Opening a database connection is slow (~100ms). If your API opens a new connection per request at 1000 req/s, the DB is overwhelmed. A pool keeps connections open and reuses them.

```yaml
# application.yml — Spring Boot + HikariCP (default pool)
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/bankdb
    username: ${DB_USER}
    password: ${DB_PASS}
    hikari:
      maximum-pool-size: 20        # max connections to DB
      minimum-idle: 5              # keep 5 ready even when idle
      connection-timeout: 30000    # wait 30s for a connection before throwing
      idle-timeout: 600000         # close idle connections after 10 min
      max-lifetime: 1800000        # replace connections after 30 min (prevents stale)
      leak-detection-threshold: 60000  # warn if connection held > 60s (connection leak!)
```

**Rule of thumb for pool size:**
- Formula: `pool size = (number of CPU cores × 2) + effective_spindle_count`
- For a 4-core server with SSD: start with 10, tune from metrics
- Never set pool size to 100+. This hurts DB performance (too many concurrent queries)

---

## 9. Interview Questions — Phase 3

**SQL:**
1. What is the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN?
2. What is the difference between WHERE and HAVING?
3. What is a window function? Give an example of where you'd use ROW_NUMBER().
4. What is a CTE? When is it better than a subquery?
5. Write SQL to find accounts with no transactions in the last 90 days.

**Indexes:**
1. What is a B-tree index? What operations does it support?
2. When does an index NOT help? (Give 3 examples)
3. Why does the order of columns in a composite index matter?
4. What is an index scan vs a sequential scan?

**ACID and Isolation:**
1. Explain ACID with a banking example.
2. What is a dirty read? Give an example.
3. What isolation level prevents phantom reads? What is the cost?
4. What is a deadlock? How do databases detect and resolve them?

**PL/SQL:**
1. What is the difference between a stored procedure and a function in Oracle?
2. What is a package? Why do banks organize code in packages?
3. What does `%ROWTYPE` mean?
4. What happens if you don't handle `WHEN OTHERS` in a PL/SQL exception?

---

## 10. Mini Project — Phase 3

**Design and query a complete banking database:**

1. Schema: customers, accounts, transactions, branches, exchange_rates
2. Write 10 SQL queries:
   - Monthly statement for one account
   - Top 5 customers by transaction volume
   - Find accounts with balance > average balance
   - Find all transactions above limit (AML-style query)
   - Running balance using window functions
   - Exchange rate conversion report
3. Create indexes, then EXPLAIN ANALYZE each query
4. Write one PL/SQL procedure: `calculate_monthly_interest(p_month IN VARCHAR2)`
5. Write one PL/SQL function: `get_exchange_rate(p_from CHAR, p_to CHAR) RETURN NUMBER`

---

## References

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Oracle PL/SQL Guide: https://docs.oracle.com/en/database/oracle/oracle-database/19/lnpls/
- Use The Index Luke (indexes explained): https://use-the-index-luke.com/
- Baeldung JPA: https://www.baeldung.com/the-persistence-layer-with-spring-data-jpa
- Database Internals (Petrov) — Part I: Storage Engines
- Designing Data-Intensive Applications (Kleppmann) — Ch 2: Data Models and Query Languages
