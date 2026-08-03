# 2-Year Roadmap — Bank Backend Developer (Cambodia)

> Mentor: do not skip phases. Do not start a new phase until the
> exit test of the current phase is PASS. Update `PROGRESS.md`
> with the current phase and week.
>
> **Target market:** Korean-owned banks in Cambodia first (KB PRASAC,
> Woori, PPCBank, Shinhan). Full job map, employers, and skill gaps
> are in `curriculum/CAMBODIA-CAREER-PLAN.md` — read it alongside this.
> Because those shops run **Oracle + PL/SQL** core-banking systems,
> Oracle PL/SQL is my **primary** database target and PostgreSQL is
> the strong second. Korean is my differentiator, not a substitute for
> Java/Spring + SQL + English.

## Phase 1 — Java Core & OOP (Months 1–3)

The base for everything. No Spring until this is solid.

- Week 1–2: Variables, types, String vs StringBuilder, pass-by-value
- Week 3–4: Classes, objects, constructors, `static`, `final`
- Week 5–6: The 4 OOP pillars (encapsulation, inheritance, polymorphism, abstraction) — with banking examples (Account, SavingsAccount, etc.)
- Week 7–8: Interfaces vs abstract classes, composition vs inheritance
- Week 9–10: `equals()` / `hashCode()` / `toString()`, immutability, `BigDecimal` for money (never `double`!)
- Week 11–12: Exceptions (checked vs unchecked), try-with-resources

**Exit test:** mock interview, 5 OOP questions + build a small `Account`/`Transaction` class design from scratch on paper.

## Phase 2 — Collections & Generics (Months 4–5)

- ArrayList vs LinkedList — when and why
- HashMap internals: hashing, buckets, collisions, why equals/hashCode matter
- HashSet, TreeMap, TreeSet, ordering, Comparable vs Comparator
- Generics: `<T>`, bounded types, why raw types are dangerous
- Iteration, fail-fast, ConcurrentModificationException

**Exit test:** explain HashMap internals out loud with no notes + 3 collection-choice scenarios.

## Phase 3 — Data Structures & Algorithms (Months 6–9)

Solve by hand first. Code in plain Java. No libraries that hide the work.

- Big-O notation — analyze every solution I write
- Arrays & strings (two pointers, sliding window)
- Stacks & queues
- Linked lists (build one from scratch)
- Recursion
- Binary search
- Sorting: how merge sort and quick sort work (write them once)
- Hash tables (already know internals from Phase 2 — now use them)
- Trees: binary tree, BST, traversals (BFS/DFS)
- Practice: 2–3 easy LeetCode-style problems per week, moving to medium

**Exit test:** solve 2 easy + 1 medium problem live, explaining out loud, no hints.

## Phase 4 — SQL & Database Deep Dive (Months 10–12)

Standard SQL first, then go deep on **Oracle PL/SQL** — that is what
the Korean-owned / core-banking shops (FLEXCUBE on Oracle) want most.

- Joins: inner, left, right, full — when each one, with drawings
- GROUP BY, HAVING, subqueries, CTEs
- Indexes: B-tree, when an index helps, when it hurts, EXPLAIN
- Transactions: ACID, isolation levels, dirty/non-repeatable/phantom reads
- Locks, deadlocks — why a bank cares (double withdrawal problem)
- Normalization (1NF–3NF), when to denormalize
- **Oracle PL/SQL (primary target):** stored procedures, packages,
  cursors, triggers, exceptions, `%ROWTYPE`; why core-banking shops
  put business logic in the DB; how MyBatis maps onto PL/SQL
- **PostgreSQL (strong second):** the specifics I use at work; note
  the differences from Oracle (sequences, `RETURNING`, data types)

**Exit test:** design a small banking schema (accounts, transactions,
transfers) + write 5 queries + write one PL/SQL procedure that does a
transfer safely (lock, debit, credit, ledger row) + explain the
isolation level choice for a transfer.

> Pivot note: if my job shortlist ends up dominated by digital banks
> (ABA/Wing/CIMB) instead, swap the priority — make PostgreSQL the
> primary and treat PL/SQL as awareness-only.

## Phase 5 — Design Patterns & Clean Code (Months 13–15)

Only patterns that appear in real backend work and interviews:

- Singleton (and why Spring beans make it mostly unnecessary)
- Factory & Builder
- Strategy (e.g., different fee calculation per account type)
- Template Method, Observer
- Adapter, Decorator, Proxy (→ leads into how Spring AOP works)
- SOLID principles — one per week, applied to my real code
- Refactoring: I bring real (sanitized) code, we improve it together

**Exit test:** identify which pattern fits 5 scenarios + explain SOLID with my own banking examples.

## Phase 6 — Spring Internals & Backend Architecture (Months 16–19)

Now go deep on what I use every day:

- IoC container, bean lifecycle, dependency injection — why
- `@Transactional`: proxies, propagation, rollback rules, common traps (self-invocation!)
- MyBatis vs JPA: what each really does, N+1 problem
- REST design: status codes, idempotency (critical for payments!), versioning
- JWT & security: what is in a token, signing, expiry, refresh, common attacks
- Concurrency basics: threads, synchronized, race condition on an account balance
- **Microservices basics:** when to split a service, service-to-service
  calls, config, why banks still keep a monolithic core + satellite
  services
- **Messaging (Kafka / RabbitMQ):** event-driven flows, why a payment
  event goes on a queue, at-least-once delivery + idempotent consumers
  (KOSIGN and digital teams use RabbitMQ)
- **Docker + CI/CD basics:** containerize my Spring Boot app, a simple
  pipeline — these show up in the job ads

**Exit test:** mock interview, 7 questions mixing Spring + transactions
+ REST + JWT + one "how would you publish and consume a payment event
safely" question.

## Phase 7 — System Thinking & Business Logic (Months 20–24)

- How a money transfer really works end to end (validation, ledger, rollback)
- Idempotency keys, retry safety, exactly-once thinking
- Basic system design: load balancer, cache, queue, read replica
- Reading requirements critically: find missing cases (what if balance is negative? what if the same request comes twice?)
- **Cambodian banking context:** Bakong (NBC's payment system on
  Hyperledger Iroha) and **KHQR** (national QR standard) — how a
  KHQR payment flows end to end; core-banking vendors I'll meet
  (Temenos T24/Transact, Oracle FLEXCUBE). See `CAMBODIA-CAREER-PLAN.md`.
- **Capstone portfolio project (build it, put it on GitHub):** a
  Spring Boot payment service exposing REST APIs with a KHQR-style
  QR-payment flow (generate QR, simulate scan, confirm, ledger entry,
  idempotency key) + a Next.js front end. This is my proof of domain
  fit when I apply.
- Final months: weekly full mock interviews + CV + STAR stories from
  my fintech job + apply to the Tier-1 Korean banks (see career plan)

**Exit test:** design "transfer money between two banks via Bakong/KHQR"
on a whiteboard, handle failure cases (timeout, double-scan, partial
failure), defend choices under questioning.

## Continuous (every week, all phases)

- 1 `/mock-interview` per week
- 2–3 exercises in `exercises/`
- Every Feynman explanation saved in `notes/`
- JavaScript fundamentals: 30 min/week (closures, async, `this`) — secondary track
- Korean technical fluency: keep it sharp (TRANSLATION MODE) — it's my
  differentiator at Korean-owned banks and for HQ/SI liaison roles
- Interview English: practise saying answers out loud in simple English
