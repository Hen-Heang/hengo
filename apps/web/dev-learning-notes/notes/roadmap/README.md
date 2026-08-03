---
title: Korea Adaptation Roadmap
description: Practical study and practice roadmap for a Cambodia full-stack developer adapting to Korean SaaS and eGov-style stacks.
category: roadmap
tags:
  - roadmap
  - korea
  - spring
  - mybatis
  - jsp
  - sql
---

# Korea Adaptation Roadmap

[<- Back to root](../README.md)

## Purpose

This roadmap is for a developer who already has practical experience with:

- Next.js
- TypeScript
- PostgreSQL
- Spring Boot + JPA
- Full-stack delivery

But now needs to adapt to the stack often seen in Korea:

- Spring MVC / Spring Boot
- MyBatis XML
- SQL-first backend development
- JSP + JSTL
- jQuery + AJAX
- Bootstrap / older CSS patterns
- Oracle-style SQL and legacy enterprise conventions
- eGovFrame-style structure and naming

The goal is not just to learn syntax. The goal is to become productive in a real Korean company with old and mixed stacks.

---

## Your Starting Position

You are not starting from zero.

Your current strengths already help:

- You understand request-response flow
- You know frontend and backend integration
- You know database design and CRUD
- You know Spring service/controller architecture
- You know how production apps are built

What is different in Korea is mostly:

- more manual SQL
- more XML
- more server-side rendering
- more legacy naming conventions
- more enterprise process and maintenance work

So this is not a beginner-to-developer roadmap.
This is a **modern full-stack developer to Korean enterprise developer roadmap**.

---

## What You Must Understand First

Before going deep into tools, lock these fundamentals:

### 1. Java Core

You do not need advanced computer science first.
You need strong working Java.

Main content:

- class, object, constructor
- interface and implementation
- inheritance
- exception handling
- collections: `List`, `Map`, `Set`
- stream and lambda basics
- `LocalDateTime`
- DTO vs VO vs entity/model

Minimum practice:

- create 3 DTO classes
- create service interface + implementation
- convert list data using stream
- write custom exception for not found case

### 2. SQL Fundamentals

In Korean enterprise, SQL strength matters more than ORM magic.

Main content:

- `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- `WHERE`, `LIKE`, `IN`, `BETWEEN`
- `ORDER BY`, `LIMIT`, `OFFSET`
- `JOIN`
- `GROUP BY`, `HAVING`
- aggregate functions
- subquery basics
- pagination thinking

Minimum practice:

- write 20 simple queries by hand
- write 5 join queries
- write pagination query for page 1, 2, 3
- write count query for dashboard cards

### 3. Spring Request Flow

You must clearly understand:

```text
Browser -> Controller -> Service -> Mapper/DAO -> DB -> View or JSON
```

Main content:

- `@Controller` vs `@RestController`
- `@GetMapping`, `@PostMapping`
- `@RequestParam`, `@PathVariable`, `@RequestBody`
- model binding
- redirect flow
- service responsibility
- transaction responsibility

Minimum practice:

- build one REST CRUD flow
- build one MVC page flow
- compare both side by side

---

## Skill Gap: What Changes From Your Old Stack

| Your strong stack | Korea work stack | What you need to adapt |
| --- | --- | --- |
| Next.js pages/components | JSP views | Server-rendered HTML thinking |
| TypeScript types | Java DTO/VO classes | More explicit class mapping |
| JPA repository | MyBatis XML mapper | Manual query writing |
| PostgreSQL only | PostgreSQL + Oracle style | SQL dialect awareness |
| Fetch / React state | jQuery AJAX + DOM update | Manual DOM control |
| Modern UI flow | Form post + `.do` style | Old enterprise patterns |

The hardest change is usually not Java.
It is changing from auto-generated data access to explicit SQL and XML-driven development.

---

## Full Roadmap

## Phase 0. Reset the Foundation

Target: stop feeling weak in fundamentals.

Study:

- Java syntax and OOP basics
- SQL CRUD basics
- HTTP request/response basics
- HTML form basics

Practice tasks:

- write a Java `User` class with getters/setters
- create a service interface and implementation
- write 10 SQL queries on `users`
- build a plain HTML form and submit flow

Exit criteria:

- you can explain MVC flow without guessing
- you can write CRUD SQL without looking up every line
- you can read Java class and mapper signatures comfortably

Recommended duration:

- 2 weeks

---

## Phase 1. Spring MVC + SQL Thinking

Target: be comfortable with controller/service/mapper layering.

Study:

- Spring bean basics
- controller annotations
- service layer
- transaction basics
- response wrapper pattern

Practice tasks:

- create `UserController`
- create `UserService` and `UserServiceImpl`
- return one list endpoint and one detail endpoint
- add create/update/delete endpoints
- add validation checks manually

Exit criteria:

- you can build CRUD without JPA
- you know where business logic belongs
- you can explain why controller should stay thin

Recommended duration:

- 2 weeks

---

## Phase 2. MyBatis Core

Target: replace JPA habits with SQL + XML confidence.

Study:

- mapper interface
- XML namespace and query id
- `resultType` vs `resultMap`
- parameter binding with `#{}` and `${}` difference
- insert/update/delete/select flow
- logging generated SQL

Practice tasks:

- map `users` table with `UserMapper.java` and `UserMapper.xml`
- implement `selectAll`, `selectById`, `insert`, `update`, `delete`
- test mapper methods
- fix one mapping issue intentionally, then debug it

Exit criteria:

- you can connect Java object fields to SQL columns correctly
- you stop expecting ORM behavior automatically
- you can debug null or mapping mismatch issues

Recommended duration:

- 2 to 3 weeks

---

## Phase 3. Dynamic SQL and Real Search

Target: handle realistic enterprise search and batch logic.

Study:

- `<if>`
- `<where>`
- `<set>`
- `<choose>`
- `<foreach>`
- reusable SQL fragments

Practice tasks:

- search by username, email, status
- sort by field and order
- filter by multiple IDs
- batch insert users
- batch update status
- dynamic partial update

Exit criteria:

- you can build search screens without string-concatenating SQL badly
- you understand how the final SQL is generated
- you can design request DTOs for search conditions

Recommended duration:

- 2 weeks

---

## Phase 4. JSP + JSTL + Form Flow

Target: stop thinking only in React and become comfortable with JSP.

Study:

- JSP page structure
- JSTL core tags
- `c:forEach`, `c:if`, `c:choose`
- `c:out`
- form submit and redirect
- rendering model data

Practice tasks:

- build user list JSP
- build insert form JSP
- build detail page JSP
- render list with `c:forEach`
- render safe text with `c:out`
- submit form to controller and redirect to list

Exit criteria:

- you can read and modify JSP pages without frustration
- you understand how backend data reaches the view
- you know when page reload is normal

Recommended duration:

- 2 weeks

---

## Phase 5. jQuery + AJAX + Bootstrap

Target: become fast in Korean SaaS maintenance work.

Study:

- jQuery selector basics
- event binding
- `$.ajax()`
- modal handling
- simple DOM update
- Bootstrap layout and form classes

Practice tasks:

- open modal for detail
- submit create form by AJAX
- update one row in table without full reload
- delete item with confirm dialog
- show success/error alert

Exit criteria:

- you can maintain old jQuery screens without overengineering
- you can mix server render + AJAX where needed
- you can debug UI behavior from browser devtools

Recommended duration:

- 1 to 2 weeks

---

## Phase 6. Enterprise Patterns in Korea

Target: understand how Korean legacy projects are really structured.

Study:

- `.do` URL style
- VO / DefaultVO naming
- DAO naming conventions
- eGovFrame package structure
- `globals.properties`
- old XML config concepts
- Oracle pagination patterns
- soft delete patterns

Practice tasks:

- build board module with `.do` endpoints
- create `BoardVO`, `BoardService`, `BoardDAO`
- implement title search
- implement soft delete with `use_yn`
- implement list/detail/insert/update flow

Exit criteria:

- you can read Korean enterprise source structure and not get lost
- you understand naming and file layout expectations
- you can explain the difference between modern REST style and legacy MVC style

Recommended duration:

- 2 to 3 weeks

---

## Phase 7. Database Reality: Oracle Mindset

Target: prepare for systems that are not clean PostgreSQL-only projects.

Study:

- `ROWNUM` pagination
- sequence usage
- `NVL`, `DECODE`, `CASE`
- join-heavy reporting queries
- date formatting functions

Practice tasks:

- rewrite 5 PostgreSQL queries into Oracle style
- build one paginated list query with Oracle `ROWNUM`
- write insert using sequence
- compare `COALESCE` vs `NVL`

Exit criteria:

- you are not blocked when project SQL is Oracle-flavored
- you can read legacy SQL faster

Recommended duration:

- 1 week

---

## Phase 8. Production Readiness

Target: be useful on a real team.

Study:

- logging
- error handling
- file upload basics
- Excel download basics
- deployment flow
- WAR packaging and Tomcat basics
- SVN basics if needed

Practice tasks:

- add global exception handling
- add file upload to board
- export list to Excel
- package application
- document run steps

Exit criteria:

- you can work beyond CRUD
- you can deliver features that appear in real internal business tools

Recommended duration:

- 2 weeks

---

## Suggested 12-Week Plan

### Weeks 1-2

- Java core
- SQL basics
- Spring MVC request flow

### Weeks 3-4

- MyBatis CRUD
- mapper tests
- service/controller layering

### Weeks 5-6

- Dynamic SQL
- search, filter, sort, pagination

### Weeks 7-8

- JSP + JSTL
- form post flow
- jQuery + AJAX basics

### Weeks 9-10

- board project in Korean enterprise style
- `.do` endpoints
- soft delete
- dashboard/list/detail flow

### Weeks 11-12

- Oracle patterns
- deployment
- file upload / Excel
- project cleanup and documentation

---

## Daily Study Structure

Keep the routine simple and repeatable.

### Weekday Plan

#### 1. Learn - 60 minutes

- read one concept
- summarize it in your own words
- write 3 small examples

#### 2. Practice - 90 minutes

- build one small task
- run it
- break it
- fix it

#### 3. Review - 30 minutes

- write what confused you
- write what you solved
- note one follow-up topic

### Weekend Plan

- review the whole week
- rebuild one feature from scratch
- write one short note page
- clean up naming and folder structure

---

## Main Content You Must Know

If you feel weak in fundamentals, use this as your non-negotiable list.

### Backend Core

- Java class and interface
- exception handling
- collection usage
- DTO / VO / model separation
- controller, service, mapper responsibility
- transaction basics

### SQL Core

- CRUD
- join
- grouping
- pagination
- search condition design
- count query

### MyBatis Core

- mapper interface
- XML query mapping
- `resultMap`
- dynamic SQL tags
- logging and debugging

### Web Core

- HTML form
- query string and path variable
- request body vs form submit
- JSP rendering
- JSTL loops and conditions
- jQuery AJAX flow

### Enterprise Core

- old naming conventions
- `.do` URLs
- Oracle habits
- soft delete
- maintenance mindset
- reading legacy code safely

---

## Small Task Plan You Can Follow

This is the most important part.
Do not only study. Finish small visible tasks.

### Track 1. Java and SQL Warm-up

1. Create `User`, `UserRequest`, `UserResponse`.
2. Write 10 SQL queries for `users`.
3. Add 3 join queries with `orders`.
4. Write one custom exception.
5. Convert one list with stream.

### Track 2. Spring MVC CRUD

1. Create list endpoint.
2. Create detail endpoint.
3. Create insert endpoint.
4. Create update endpoint.
5. Create delete endpoint.
6. Add response wrapper.

### Track 3. MyBatis CRUD

1. Create mapper interface.
2. Create mapper XML.
3. Map `selectAll`.
4. Map `selectById`.
5. Map `insert`.
6. Map `update`.
7. Map `delete`.
8. Add mapper test.

### Track 4. Dynamic SQL

1. Add keyword search.
2. Add status filter.
3. Add date range filter.
4. Add `IN` filter.
5. Add dynamic sorting.
6. Add pagination.

### Track 5. JSP and jQuery

1. Render list page.
2. Render detail page.
3. Add create form.
4. Submit by form post.
5. Submit by AJAX.
6. Add modal view.
7. Add delete confirm.

### Track 6. Korea-style Board Project

1. Create `BoardVO`.
2. Create `BoardMapper.xml`.
3. Create `BoardDAO`.
4. Create `BoardService`.
5. Create `BoardMvcController`.
6. Add `/board/list.do`.
7. Add `/board/detail.do`.
8. Add `/board/insert.do`.
9. Add `/board/update.do`.
10. Add `/board/delete.do`.
11. Add title search.
12. Add soft delete.

### Track 7. Production Practice

1. Add logging.
2. Add validation messages.
3. Add exception handling.
4. Add file upload.
5. Add Excel export.
6. Write run guide.
7. Package app and run it.

---

## How to Catch Up Efficiently

### Rule 1

Do not jump between too many topics.
Stay in one phase until you can build something small without copying.

### Rule 2

Do not study only theory.
Every topic must end with a working page, API, SQL file, or mapper.

### Rule 3

Do not compare the old stack with modern stack in a negative way all the time.
Treat it as a different operating environment.

### Rule 4

When you see old code, first ask:

- what is the request flow?
- where is SQL defined?
- what object carries data?
- what is controller doing?
- what is service doing?

### Rule 5

Measure progress by output:

- number of working queries
- number of working mapper methods
- number of working JSP pages
- number of completed small tasks

---

## Best Practice Project Sequence

Build in this order:

1. User CRUD REST
2. User CRUD MVC
3. Search + pagination
4. Board module
5. File upload
6. Dashboard statistics
7. Excel export

Why this order:

- first learn simple CRUD
- then learn MVC rendering
- then learn search and query complexity
- then learn real enterprise module shape
- then learn business utility features

---

## Final Goal

After finishing this roadmap, you should be able to:

- read Korean enterprise Spring/MyBatis code comfortably
- write and debug MyBatis XML without fear
- maintain JSP + jQuery screens
- adapt to PostgreSQL or Oracle style SQL
- build typical internal SaaS modules in Korea
- communicate more confidently in Korean enterprise development environments

---

## Last Updated

2026-03-11
