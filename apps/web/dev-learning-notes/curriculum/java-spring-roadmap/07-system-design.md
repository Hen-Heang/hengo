# Phase 7 — System Design for Backend Engineers

**Level:** Senior → Enterprise
**Time:** Months 17–24
**Goal:** Design scalable, reliable systems from requirements. Handle the failure cases. Defend your choices in interviews at banks and tech companies.

---

## 1. How to Approach System Design

### The Framework (use in every design interview)
```
1. Clarify requirements (5 min)
   - Functional: what must the system DO?
   - Non-functional: scale, latency, availability, consistency

2. Estimate scale (2 min)
   - DAU (daily active users)
   - Read:write ratio
   - Storage needed

3. High-level design (10 min)
   - Draw major components: clients, API layer, services, databases, caches

4. Deep dive — the hard parts (15 min)
   - Pick 2-3 critical paths and go deep
   - Database schema
   - Caching strategy
   - Handling failures

5. Trade-offs and bottlenecks (5 min)
   - What breaks at 10x scale?
   - What did you sacrifice?
```

---

## 2. CAP Theorem

Every distributed system can guarantee only 2 of 3:

| Property | Meaning |
|----------|---------|
| **C**onsistency | Every read sees the most recent write |
| **A**vailability | Every request gets a response (not error) |
| **P**artition tolerance | System works even if nodes can't communicate |

Since network partitions happen in real distributed systems, you MUST have P.
So the real choice is: **CP** or **AP**.

```
CP (Consistency + Partition):
  - If nodes can't communicate: return error rather than stale data
  - Examples: HBase, Zookeeper, traditional RDBMS with synchronous replication
  - Banking: choose CP — a wrong balance is worse than "try again"

AP (Availability + Partition):
  - If nodes can't communicate: return possibly stale data (eventual consistency)
  - Examples: DynamoDB (eventually consistent reads), Cassandra, DNS
  - Use when: the data being slightly stale is acceptable
```

**Banking rule:** account balances are CP. DNS, product catalog, exchange rates can be AP.

---

## 3. Design: Payment/Transfer System

### Requirements clarification
```
Functional:
  - Transfer money between accounts
  - View transaction history
  - Support KHR and USD (Cambodia context)
  - Idempotent — retrying the same transfer must not double-charge

Non-functional:
  - 99.99% uptime (bank SLA)
  - Transfer must complete < 2 seconds (P95)
  - 10,000 transfers per day → ~0.12 TPS (small bank)
  - Large bank: 1M transfers/day → 12 TPS peak, 50 TPS spikes
```

### Architecture
```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────────┐
│Mobile/Web   │────▶│  API Gateway    │────▶│  Transfer Service    │
│             │     │  (rate limit,   │     │                      │
│             │     │   auth, route)  │     │  - Validate          │
└─────────────┘     └─────────────────┘     │  - Lock accounts     │
                                            │  - Debit/Credit      │
                    ┌─────────────────┐     │  - Write outbox      │
                    │  Notification   │◀────│                      │
                    │  Service        │     └──────────┬───────────┘
                    │  (Kafka)        │                │
                    └─────────────────┘     ┌──────────▼───────────┐
                                            │   PostgreSQL          │
                                            │   accounts table      │
                                            │   transactions table  │
                                            │   outbox table        │
                                            └──────────────────────┘
```

### Database Schema Design
```sql
-- Accounts table
CREATE TABLE accounts (
    id          BIGSERIAL PRIMARY KEY,
    account_no  VARCHAR(20) UNIQUE NOT NULL,
    customer_id BIGINT NOT NULL,
    balance     NUMERIC(15,2) NOT NULL DEFAULT 0,
    currency    CHAR(3) NOT NULL,
    version     BIGINT NOT NULL DEFAULT 0,  -- optimistic lock
    status      VARCHAR(10) NOT NULL DEFAULT 'ACTIVE'
);

-- Ledger — immutable, append-only, double-entry
CREATE TABLE ledger_entries (
    id          BIGSERIAL PRIMARY KEY,
    transfer_id VARCHAR(40) NOT NULL,   -- idempotency key
    account_id  BIGINT NOT NULL,
    type        VARCHAR(6) NOT NULL CHECK (type IN ('DEBIT', 'CREDIT')),
    amount      NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    balance_after NUMERIC(15,2) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- The golden rule of banking: every DEBIT must have a matching CREDIT
-- SUM(CREDIT) = SUM(DEBIT) always (double-entry bookkeeping)
```

### Idempotency Implementation
```java
@Transactional
public TransferResult executeTransfer(TransferRequest req, String idempotencyKey) {
    // 1. Check if already processed (using transfer_id as unique key in ledger)
    if (ledgerRepo.existsByTransferId(idempotencyKey)) {
        return ledgerRepo.findResultByTransferId(idempotencyKey);
    }

    // 2. Lock accounts in consistent order (prevent deadlock)
    List<Account> locked = accountRepo.findByIdsForUpdate(
        List.of(req.getFromId(), req.getToId()).stream().sorted().collect(toList())
    );

    // 3. Validate
    Account from = getAccount(locked, req.getFromId());
    Account to = getAccount(locked, req.getToId());
    if (from.getBalance().compareTo(req.getAmount()) < 0)
        throw new InsufficientFundsException(...);

    // 4. Update balances
    from.setBalance(from.getBalance().subtract(req.getAmount()));
    to.setBalance(to.getBalance().add(req.getAmount()));

    // 5. Write ledger (idempotency: transfer_id is unique)
    ledgerRepo.save(new LedgerEntry(idempotencyKey, from.getId(), DEBIT, req.getAmount(), from.getBalance()));
    ledgerRepo.save(new LedgerEntry(idempotencyKey, to.getId(), CREDIT, req.getAmount(), to.getBalance()));

    // 6. Write outbox for Kafka (same transaction)
    outboxRepo.save(new OutboxEvent("TRANSFER_COMPLETED", idempotencyKey, ...));

    return TransferResult.success(idempotencyKey);
}
```

---

## 4. Caching Strategies

### When to cache
- Data that is expensive to compute/fetch
- Data that doesn't change often
- Data that the same user requests repeatedly

### The 4 Strategies

**Cache-Aside (Lazy Loading) — most common**
```
Read:  Check cache → miss → query DB → put in cache → return
Write: Update DB → invalidate cache (or update)
```
```java
public ExchangeRate getRate(String from, String to) {
    String key = from + ":" + to;
    ExchangeRate cached = redis.get(key);
    if (cached != null) return cached;

    ExchangeRate rate = rateRepo.findByPair(from, to);
    redis.setex(key, 3600, rate);  // expire in 1 hour
    return rate;
}
```

**Write-Through — write to cache and DB together**
```
Write: Update cache → Update DB (synchronous)
Read:  Check cache → always hits (if recently written)
```
Good for: data that is read immediately after write. Cost: slower writes.

**Write-Behind (Write-Back) — write to cache, async to DB**
```
Write: Update cache → acknowledge → async write to DB
```
Fast writes, but risk of data loss if cache fails before DB write.

**Read-Through — cache sits in front, fetches on miss**
```
Read: Check cache → miss → cache fetches from DB → returns
Application only talks to cache
```

### Cache Invalidation — the hard problem

```java
// TTL-based: simple but stale data possible
redis.setex("balance:ACC001", 60, balance);  // stale up to 60 seconds

// Event-based: accurate but complex
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void onTransfer(TransferCompletedEvent event) {
    cacheManager.evict("balances", event.getFromAccountId());
    cacheManager.evict("balances", event.getToAccountId());
}

// Cache stampede (thundering herd) — many requests miss at same time
// Fix: probabilistic early expiry or locking
```

---

## 5. Database Scaling

### Read Replicas (most common first step)
```
Primary DB ──(replication)──▶ Replica 1
                          ──▶ Replica 2

Writes → Primary only
Reads → Replicas (or Primary for strong consistency)
```

**Replication lag:** writes on Primary take milliseconds to appear on Replica.
If you read from Replica immediately after write, you might see stale data.
Solution: read from Primary for the same request that wrote (sticky routing).

### Vertical Scaling vs Horizontal Scaling
```
Vertical: larger server (more CPU, RAM, faster disk)
  + Simple, no code changes
  - Has a limit (most powerful server costs $)
  - Single point of failure

Horizontal: more servers
  + Nearly unlimited scale
  + Fault tolerant
  - Stateless required
  - Need load balancer
  - Distributed systems complexity
```

### Sharding (database partitioning)
Splitting data across multiple database servers.

```
By account_id % 4:
  Shard 0: accounts where id % 4 = 0
  Shard 1: accounts where id % 4 = 1
  Shard 2: accounts where id % 4 = 2
  Shard 3: accounts where id % 4 = 3
```

**Problems:**
- Cross-shard transfers: must coordinate 2 DBs atomically
- Rebalancing when adding shards: expensive
- Hot spots: if one shard gets all big customers

**Consistent hashing:** limits rebalancing when adding nodes (used by DynamoDB, Cassandra).

---

## 6. Rate Limiting

### Why banks need it
- Prevent brute-force on PIN
- Prevent API abuse
- Protect downstream services

### Token Bucket Algorithm
```
Capacity: 100 tokens (burst capacity)
Rate: 10 tokens/second (sustained rate)

On request:
  - If tokens >= 1: consume 1 token, allow request
  - If tokens < 1: reject (429 Too Many Requests)
  
Tokens refill at 10/second up to capacity of 100
```

### Implementation with Redis
```java
@Service
public class RateLimiter {
    private static final String KEY_PREFIX = "rate_limit:";

    public boolean isAllowed(String userId, int maxPerMinute) {
        String key = KEY_PREFIX + userId;
        Long count = redisTemplate.execute(new SessionCallback<>() {
            public Long execute(RedisOperations ops) {
                ops.multi();
                ops.opsForValue().increment(key);
                ops.expire(key, Duration.ofMinutes(1));
                List<Object> results = ops.exec();
                return (Long) results.get(0);
            }
        });
        return count != null && count <= maxPerMinute;
    }
}
```

---

## 7. Design Patterns for Backend Systems

### Saga Pattern — distributed transactions
When a transaction spans multiple services:
```
Transfer via KHQR (Bakong):
  1. Lock funds in source bank
  2. Send to Bakong gateway
  3. Receive confirmation
  4. Credit destination bank

If step 2 fails: compensate by unlocking funds (step 1 reversed)
If step 3 fails: retry (idempotent), or compensate
```

Two approaches:
- **Choreography:** each service listens for events and reacts (Kafka)
- **Orchestration:** one service (orchestrator) coordinates steps (workflow engine)

### Circuit Breaker (Resilience4j)
```java
@CircuitBreaker(name = "bakongGateway", fallbackMethod = "fallback")
public BakongResponse sendToBakong(BakongRequest req) {
    return bakongClient.send(req);  // external call — might fail
}

public BakongResponse fallback(BakongRequest req, Exception ex) {
    log.warn("Bakong gateway unavailable, queuing for retry");
    retryQueue.add(req);
    return BakongResponse.queued(req.getTransferId());
}

// Circuit states:
// CLOSED (normal): requests pass through
// OPEN (failing): requests fail immediately (no calls to Bakong)
// HALF-OPEN (recovery): let some requests through to test if Bakong is back
```

---

## 8. Designing for Cambodia Banking Context

### Bakong KHQR Flow
```
Customer scans QR code
        ↓
Mobile app sends: POST /api/v1/khqr/pay
  { qrData, amount, currency, pin }
        ↓
Your bank service:
  1. Validate QR (NBC's KHQR standard format)
  2. Decode: { recipientBank, recipientAccount, amount }
  3. Check balance
  4. Call Bakong API (NBC's interbank platform)
  5. Wait for confirmation
  6. Update ledger
  7. Push notification to customer
        ↓
Response: { status: "SUCCESS", transactionId, reference }
```

**Idempotency key:** device generates UUID before sending. On timeout+retry, server returns same result.

**Timeout handling:** Bakong call took too long → status = "PENDING" → background job polls Bakong → eventually updates status.

---

## 9. Interview Questions — Phase 7 (System Design)

1. Design a URL shortener (warm-up for any SD interview)
2. Design a money transfer system for a bank. Handle: duplicate requests, network timeouts, partial failures.
3. Design a real-time fraud detection system.
4. How would you handle 100x traffic spike on a Black Friday sale?
5. What is the CAP theorem? Give a real example for each CP and AP.
6. When should you use a message queue? When is direct API call better?
7. What is the Saga pattern? What is the difference between choreography and orchestration?
8. You need to read a balance that MUST be current. But you have read replicas. What do you do?
9. Design the database schema for a double-entry ledger system.
10. Your service calls an external API that sometimes times out. How do you make your service resilient?

---

## References

- Designing Data-Intensive Applications (Kleppmann) — the system design bible
- System Design Interview Vol 1+2 (Alex Xu) — practical patterns
- ByteByteGo: https://bytebytego.com — visual system design
- Microservices Patterns (Richardson) — Saga, Outbox, Circuit Breaker
- Martin Fowler on Saga: https://martinfowler.com/articles/patterns-of-distributed-systems/
- Bakong Developer Docs: https://bakong.nbc.gov.kh (NBC's KHQR API)
- Resilience4j Docs: https://resilience4j.readme.io/docs
