# guides/ — Engineering Guidelines from Real Work

Real guidelines extracted from a production Korean fintech workspace
(payment/settlement platform). Most files are in **Korean** — use
TRANSLATION MODE to read them with the mentor, or ask for a summary
of one section at a time.

**`.en.md` companion files:** some guides have a detailed English
reference version next to them (e.g. `guide-proxy.md` +
`guide-proxy.en.md`). The Korean file is the untouched original; the
`.en.md` version translates it, adds **💡 Why** explanations, and fixes
references that pointed to the original workspace. Read the `.en.md`
for studying; keep the Korean one for reading practice and as the
authentic source.

Companions so far: `guide-proxy`, `guide-single`, `testing-rules`,
`query-quality-check`, `input-validation-backend`,
`input-validation-frontend`, `incident-antipatterns`.

How to use for learning: when a ROADMAP phase touches a topic
(e.g. Phase 6 Spring internals), read the matching guide here and
compare it with what I learned. These show how a real company does it.

## backend/ — how each project type is built

| File | Topic | Read during |
| ---- | ----- | ----------- |
| `guide-api.md` | REST API microservice (Spring Boot + Spring Cloud) | Phase 6 |
| `guide-springboot-web.md` | Spring Boot web application | Phase 6 |
| `guide-webmvc.md` | Classic Spring Web MVC | Phase 6 |
| `guide-batch.md` | Batch jobs (scheduling, chunk processing) | Phase 6-7 |
| `guide-mybatis.md` | MyBatis mappers and dynamic SQL | Phase 4, 6 |
| `guide-kafka.md` | Kafka producers/consumers | Phase 7 |
| `guide-redis.md` | Redis caching | Phase 7 |
| `guide-library.md` | Shared library design | Phase 5 |
| `guide-proxy.md` | Proxy/relay services | Phase 7 |
| `guide-single.md` | Single-module standalone apps | Phase 6 |
| `guide-file-convert.md` | File conversion services | reference |

## frontend/ — JavaScript patterns

| File | Topic | Read during |
| ---- | ----- | ----------- |
| `common.md` | Common frontend rules | JS track |
| `iife-pattern.md` | IIFE module pattern (closures in practice!) | JS track |
| `mvc-pattern.md` | Frontend MVC structure | JS track |

## checklists/ — what seniors check before shipping

| File | Topic | Read during |
| ---- | ----- | ----------- |
| `input-validation-backend.md` | Backend input validation checklist | Phase 1, 6 |
| `input-validation-frontend.md` | Frontend input validation checklist | JS track |
| `query-quality-check.md` | SQL query quality checklist | Phase 4 |
| `incident-antipatterns.md` | Real production incident anti-patterns | Phase 5-7 |

## conventions/ — team rules

| File | Topic |
| ---- | ----- |
| `base-rule.md` | Team-wide standards: secrets, git branches, Spring Boot rules, JavaDoc, DB query rules |
| `java-coding-conventions.md` | Java naming, formatting, imports, style |
| `commit-convention.md` | Commit message format (ADD / CHANGE / DELETE / REVERT) |
| `testing-rules.md` | Test types, 80% coverage target, JUnit 5 + Mockito stack |

> Note: some guides contain `{{config.*}}` placeholders — they came
> from a template system. Read around them; the engineering content
> is what matters.
