# Ultimate Java Spring Backend Engineer Roadmap

> **How to use this with your personal plan:**
> `curriculum/ROADMAP.md` is your mentor's weekly schedule (read it first).
> This folder is your technical reference — every topic explained deeply.
> When your mentor assigns a topic, open the matching file here.

---

## Roadmap Overview

| File | Phase | Time | Level |
|------|-------|------|-------|
| [01-java-foundations.md](./01-java-foundations.md) | Java Core | Months 1–3 | Beginner |
| [02-java-advanced.md](./02-java-advanced.md) | Java Advanced | Months 3–5 | Junior |
| [03-database.md](./03-database.md) | SQL & Databases | Months 5–7 | Junior |
| [04-spring-core.md](./04-spring-core.md) | Spring Core & Boot | Months 7–10 | Junior→Mid |
| [05-spring-data-security.md](./05-spring-data-security.md) | JPA + Security + REST | Months 10–14 | Mid |
| [06-advanced-spring.md](./06-advanced-spring.md) | Advanced Spring | Months 14–17 | Mid→Senior |
| [07-microservices-cloud.md](./07-microservices-cloud.md) | Microservices + Cloud | Months 17–20 | Senior |
| [08-system-design.md](./08-system-design.md) | System Design | Months 20–24 | Senior→Enterprise |
| [09-checklists.md](./09-checklists.md) | All Checklists | — | All levels |

---

## Learning Philosophy (from Senior Engineers)

> "Master the fundamentals so deeply that the advanced stuff feels obvious." — Kent Beck

**Rule 1 — Depth before breadth.**
One topic truly understood beats five topics memorized. You will be interviewed on depth, not lists.

**Rule 2 — Always know WHY.**
Every annotation, every design choice has a reason. Cargo-culting (`@Transactional` everywhere, `@Autowired` without thinking) is what fails interviews.

**Rule 3 — Learn from real systems.**
Netflix, Uber, Shopify all publish engineering blogs. Real companies have solved your problems before. Read their post-mortems.

**Rule 4 — Write, break, fix.**
The best way to understand Spring's transaction proxy is to break it with self-invocation. The best way to understand GC is to write code that leaks.

---

## Books (ranked by importance for your goal)

### Must-Read
1. **Effective Java** — Joshua Bloch — the bible of Java professional practice
2. **Clean Code** — Robert Martin — how professionals write code that lasts
3. **Spring in Action** (6th ed.) — Craig Walls — the canonical Spring book
4. **Database Internals** — Alex Petrov — understand what the DB actually does

### Strong Second
5. **Java Concurrency in Practice** — Goetz — multithreading done right
6. **Designing Data-Intensive Applications** — Kleppmann — system design bible
7. **Microservices Patterns** — Chris Richardson — real patterns, not just theory
8. **The Pragmatic Programmer** — Hunt & Thomas — how to grow as an engineer

### Reference
9. **Pro JPA 2** — Mike Keith — deep JPA/Hibernate internals
10. **Spring Security in Action** — Spilca — the only Spring Security book you need

---

## Key Resources (always check these first)

- **Spring Docs:** https://docs.spring.io/spring-framework/docs/current/reference/html/
- **Spring Boot Docs:** https://docs.spring.io/spring-boot/docs/current/reference/html/
- **Oracle Java Docs:** https://docs.oracle.com/en/java/javase/21/
- **Baeldung:** https://www.baeldung.com — best practical Spring tutorials
- **Spring Guides:** https://spring.io/guides — small, focused how-tos
- **InfoQ Java:** https://www.infoq.com/java/ — senior-level talks
- **ByteByteGo:** https://bytebytego.com — system design visuals

---

## GitHub Repos (read real production-quality code)

```
spring-petclinic          — canonical Spring Boot reference app
spring-boot-microservices — Chris Richardson's patterns implemented
realworld (gothinkster)   — full CRUD apps in many frameworks
mall (macrozheng)         — real e-commerce Spring Boot backend
piggymetrics              — Spring Cloud microservices demo (Netflix OSS)
```

---

## Community

- **r/java** and **r/SpringBoot** on Reddit — practical questions
- **Stack Overflow** — [spring] and [java] tags, read top-voted answers
- **Gitter: spring-projects/spring-boot** — ask the maintainers
- **Spring One conference talks (YouTube)** — free, from the people who built it

---

*Last updated: 2026-06-26 | Roadmap version 2.0*
