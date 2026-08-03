# Checklists — All Levels

Use these before claiming a level is complete. Be honest.
Your mentor grades these — PASS means you answered correctly WITHOUT notes.

---

## Beginner Checklist (end of Phase 1–2)

### Java Core
- [ ] Explain JDK vs JRE vs JVM in 30 seconds without notes
- [ ] Name all 8 primitive types and their sizes
- [ ] Trace Stack vs Heap for a given method call
- [ ] Explain why `double` is wrong for money. Use `BigDecimal` from String
- [ ] Write a class with proper encapsulation (private fields, controlled access)
- [ ] Explain all 4 OOP pillars with banking examples
- [ ] Write an interface and two implementations
- [ ] Explain checked vs unchecked exceptions with examples
- [ ] Always use try-with-resources for connections

### Collections
- [ ] Know when to use ArrayList vs LinkedList (and why ArrayList is almost always right)
- [ ] Explain how HashMap works internally (hashing, buckets, collisions)
- [ ] Explain why `equals()` and `hashCode()` must both be overridden
- [ ] Know what `ConcurrentHashMap` is and why it's thread-safe
- [ ] Use Streams: filter, map, collect, groupingBy

### Mini Project
- [ ] Phase 1 project compiles, all tests pass

---

## Junior Developer Checklist (end of Phase 3–4)

### SQL
- [ ] Write INNER, LEFT, FULL OUTER JOIN correctly
- [ ] Use GROUP BY and HAVING correctly
- [ ] Write a window function (ROW_NUMBER, SUM OVER PARTITION BY)
- [ ] Explain what an index is and when it helps vs hurts
- [ ] Explain ACID with a banking transfer example
- [ ] Explain all 4 isolation levels and their read problems
- [ ] Read an EXPLAIN ANALYZE output and identify missing indexes

### Spring Core
- [ ] Explain IoC and DI. Explain WHY they are useful.
- [ ] Know why constructor injection is preferred over field injection
- [ ] Know the difference between @Component, @Service, @Repository
- [ ] Know what singleton scope means and why stateful singletons are dangerous
- [ ] Explain how @Transactional works (proxy mechanism)
- [ ] Explain the self-invocation problem and how to fix it

### REST API
- [ ] Know correct HTTP status codes for: 404, 400, 401, 403, 409, 422, 500
- [ ] Write a complete REST controller with validation and exception handler
- [ ] Explain idempotency and why it matters for payments
- [ ] Use pagination with Spring Data (Pageable)

### Mini Project
- [ ] Banking REST API with full CRUD, validation, exception handling
- [ ] Tests: MockMvc for controllers, Mockito for services

---

## Mid-Level Engineer Checklist (end of Phase 5–6)

### JPA / Database
- [ ] Explain the N+1 problem and fix it with JOIN FETCH or Entity Graph
- [ ] Know LAZY vs EAGER loading. Know the default.
- [ ] Use optimistic locking (@Version) correctly
- [ ] Use pessimistic locking (SELECT FOR UPDATE) for transfers
- [ ] Write projections for performance
- [ ] Write @Modifying custom update queries

### Security
- [ ] Explain JWT: what's in it, how it's verified, why it's stateless
- [ ] Implement JWT filter and Spring Security config from memory
- [ ] Explain CSRF, CORS, and when each matters
- [ ] Know top 5 security mistakes (SQL injection, IDOR, logging passwords, mass assignment, insecure direct references)
- [ ] Use @PreAuthorize for method-level security

### Advanced Spring
- [ ] Set up Redis caching with proper TTL and eviction
- [ ] Use @Async for non-blocking notifications
- [ ] Set up @Scheduled for batch jobs
- [ ] Implement Kafka producer with outbox pattern
- [ ] Implement Kafka consumer with idempotency check

### Testing
- [ ] Write unit tests with Mockito (no Spring context)
- [ ] Write integration tests with @SpringBootTest
- [ ] Write controller tests with @WebMvcTest
- [ ] Use Testcontainers for real DB tests
- [ ] Know the testing pyramid (70/20/10)

### Monitoring
- [ ] Configure Spring Actuator health and metrics endpoints
- [ ] Add custom metrics with Micrometer Counter and Timer
- [ ] Know what P95 latency means and why it matters

---

## Senior Engineer Checklist (end of Phase 7)

### System Design
- [ ] Explain CAP theorem with concrete examples
- [ ] Design a money transfer system with failure handling
- [ ] Explain the Outbox Pattern and when to use it
- [ ] Explain the Saga Pattern (choreography vs orchestration)
- [ ] Explain Circuit Breaker and implement with Resilience4j
- [ ] Design database sharding strategy for a banking system
- [ ] Explain read replica lag and strategies to handle it
- [ ] Design rate limiting (token bucket algorithm)
- [ ] Design idempotency for a payment API end-to-end

### Concurrency
- [ ] Explain deadlock with a banking example and prevention strategy
- [ ] Use CompletableFuture for parallel operations
- [ ] Know virtual threads and when they help
- [ ] Explain the difference between optimistic and pessimistic locking and when to choose each

### Architecture
- [ ] Explain hexagonal architecture (ports and adapters)
- [ ] Know CQRS — when to separate read and write models
- [ ] Explain DDD (Domain-Driven Design) concepts: aggregate, entity, value object, bounded context
- [ ] Design for observability: logs + metrics + traces

---

## Enterprise Checklist (ongoing)

- [ ] Set up CI/CD pipeline (GitHub Actions: test → build → Docker push → deploy)
- [ ] Configure Kubernetes deployment with health checks and rolling updates
- [ ] Set up distributed tracing with OpenTelemetry
- [ ] Design API versioning strategy
- [ ] Know OAuth2 flows (authorization code, client credentials)
- [ ] Design multi-tenant data isolation
- [ ] Know Oracle FLEXCUBE integration patterns (for core banking)
- [ ] Design event sourcing for audit trail

---

## Interview Checklist

### Before the interview
- [ ] Review your PROGRESS.md weak spots
- [ ] Practice 5 OOP questions out loud
- [ ] Practice explaining @Transactional without notes
- [ ] Draw the JWT flow on paper
- [ ] Practice one system design (payment transfer)
- [ ] Review your Phase 1 mini project — be ready to explain any line

### Common Java Interview Questions
```
1. What is the difference between == and equals()?
2. Why override hashCode when you override equals?
3. Explain HashMap internal workings
4. What is the difference between ArrayList and LinkedList?
5. Explain immutability. Why is String immutable?
6. What is autoboxing? What are its risks?
7. What is the difference between interface and abstract class?
8. Explain checked vs unchecked exceptions
9. What is the difference between throw and throws?
10. What happens if you throw an exception in a finally block?
```

### Common Spring Interview Questions
```
1. Explain Spring IoC and DI
2. What is the difference between @Component and @Bean?
3. What bean scopes exist? What is the default?
4. How does @Transactional work? (proxy mechanism)
5. What is the self-invocation problem in @Transactional?
6. Explain Propagation.REQUIRES_NEW and when to use it
7. What is the N+1 problem and how do you fix it?
8. How does JWT authentication work in Spring Security?
9. What is CSRF? When does it apply?
10. What is the difference between JPQL and native SQL?
```

### Common SQL Interview Questions
```
1. Explain ACID properties
2. What is the difference between INNER JOIN and LEFT JOIN?
3. What is GROUP BY vs HAVING?
4. What is a database index? When does it NOT help?
5. What is a B-tree index?
6. Explain isolation levels and read problems
7. What is a deadlock? How does the database resolve it?
8. What is EXPLAIN/EXPLAIN ANALYZE?
9. What is a CTE? How is it different from a subquery?
10. Write SQL: find the nth highest salary [standard interview trap]
```

---

## Project Checklist (portfolio for job applications)

### Project 1 — Banking Domain Model (Phase 1)
- [ ] Account, Customer, Transaction classes with proper encapsulation
- [ ] BigDecimal for all money — not double
- [ ] Custom exceptions (InsufficientFundsException, AccountNotFoundException)
- [ ] JUnit 5 tests covering: happy path, edge cases, error cases
- [ ] README explaining the design decisions

### Project 2 — Banking REST API (Phase 4)
- [ ] Spring Boot + PostgreSQL
- [ ] Authentication with JWT
- [ ] All CRUD endpoints with validation
- [ ] Global exception handler returning proper status codes
- [ ] Idempotency on all write operations
- [ ] Swagger/OpenAPI documentation
- [ ] Docker Compose for local development
- [ ] 80%+ test coverage

### Project 3 — KHQR Payment Service (Phase 7 — Capstone)
- [ ] Spring Boot backend
- [ ] Next.js frontend
- [ ] QR generation (KHQR standard format)
- [ ] Transfer flow: generate QR → scan → confirm → ledger
- [ ] Double-entry ledger (every DEBIT has matching CREDIT)
- [ ] Idempotency key on all payment operations
- [ ] Kafka for event-driven notifications
- [ ] Redis caching for exchange rates
- [ ] Prometheus + Grafana monitoring
- [ ] Docker Compose (all services)
- [ ] GitHub Actions CI/CD pipeline
- [ ] Deployed (Railway, Render, or EC2)
- [ ] README: architecture diagram + design decisions

---

## Books (ranked by priority for your goal)

| Priority | Book | Why |
|----------|------|-----|
| 🔴 Must | Effective Java (Bloch) | The rules senior Java engineers follow |
| 🔴 Must | Clean Code (Martin) | How to write maintainable code |
| 🔴 Must | Spring in Action 6th (Walls) | Canonical Spring reference |
| 🔴 Must | Designing Data-Intensive Applications (Kleppmann) | System design bible |
| 🟡 High | Java Concurrency in Practice (Goetz) | Multithreading correctly |
| 🟡 High | Spring Security in Action (Spilca) | Complete security reference |
| 🟡 High | Microservices Patterns (Richardson) | Production microservice patterns |
| 🟢 Good | Database Internals (Petrov) | Understand the DB engine |
| 🟢 Good | The Pragmatic Programmer (Hunt/Thomas) | Engineering career growth |
| 🟢 Good | System Design Interview (Alex Xu) | Interview preparation |

---

## Courses

| Course | Platform | When |
|--------|----------|------|
| Java Masterclass (Tim Buchalka) | Udemy | Phase 1-2 (Java basics) |
| Spring Boot + JPA (Chad Darby) | Udemy | Phase 4 |
| Spring Security Zero to Master (Eazy Bytes) | Udemy | Phase 5 |
| System Design (ByteByteGo) | Online | Phase 7 |

---

## Communities

- **r/java** — Java questions, stay current
- **r/SpringBoot** — Spring-specific
- **r/cscareerquestions** — interviews, career advice
- **Baeldung Weekly** newsletter — Spring updates
- **This Week in Java** newsletter — Java ecosystem
- **Devtalk Cambodia** — local tech community

---

*Updated: 2026-06-26 | Version 2.0 | Built for Heang — Cambodia bank backend goal*
