---
title: eGov Screen Development Sample Guide
description: Complete guide to building a screen from scratch using eGovFramework + Spring Boot in Korean enterprise projects
category: egov-sample
tags: [egov-sample, spring-boot, mybatis, thymeleaf, egov]
---

# eGov Screen Development Sample Guide

> This is a **developer reference sample** that shows the **complete process of building one screen from start to finish**.
> When working on real projects, copy this package and only change the domain name.

---

## Project Overview

| Item | Value |
|------|-------|
| Java | 21 |
| Spring Boot | 3.3.5 |
| eGovFramework | 5.0.0 |
| Build Tool | Gradle (multi-module) |
| Modules | `olv-root`, `olv-core`, `olv-pfom`, `olv-oper`, `olv-api` |
| Template Engine | Thymeleaf |
| DB Access | MyBatis (XML Mapper) |

---

## 0. Local Environment Setup (Eclipse IDE)

> **Important:** Do NOT import as "Existing Projects into Workspace".
> You MUST import as a **Gradle Project** or libraries won't be recognized.

### Prerequisites

1. **Install JDK 21** — confirm it's installed on your local PC
2. **IDE Version** — Eclipse 2023-12 or later, or latest STS4 (Spring Tools 4)
3. **Eclipse Settings** (Window → Preferences)
   - `Java > Installed JREs` — JDK 21 must be added and checked
   - `Java > Compiler` — set Compiler compliance level to **`21`**

### Import Steps

1. Eclipse menu → **File → Import...**
2. Select **Gradle → Existing Gradle Project** → click `Next`
3. Click `Browse...` for Project root directory → select the `olv-root` top folder → click `Next`
4. In **Import Options**:
   - **Gradle distribution** → check `Override workspace settings` → set the correct Gradle version
   - **Advanced Options** → confirm `Java home` points to your JDK 21 path
5. When all 4 sub-modules appear correctly → click **`Finish`**

### Troubleshooting

> If you see `Unsupported class file major version 65` after importing:

1. Go to **Window → Preferences → Gradle**
2. Set `Java home` to point to JDK 21 → click `Apply and Close`
3. Right-click `olv-root` → **Gradle → Refresh Gradle Project**

---

## 1. Development Order & File List

> Build from the **bottom layer up** — this prevents compile errors because upper layers depend on lower ones.

| Order | File | Location | Role |
|:-----:|------|----------|------|
| smp1 | `SmpBoardInVO.java` | `service/` | Input parameter VO (extends CmmVO) |
| smp2 | `SmpBoardOutVO.java` | `service/` | Query result VO (extends CmmVO) |
| smp3 | `SmpBoardList.html` | `templates/.../smp/` | List screen |
| smp4 | `SmpBoardRegist.html` | `templates/.../smp/` | Create/Register screen |
| smp5 | `SmpBoardUpdt.html` | `templates/.../smp/` | Edit/Detail screen |
| smp6 | `SmpBoardController.java` | `web/` | Receives HTTP request → calls Service → returns View |
| smp7 | `SmpBoardService.java` | `service/` | Business logic contract (interface) |
| smp8 | `SmpBoardServiceImpl.java` | `service/impl/` | Actual implementation of the interface |
| smp9 | `SmpBoardMapper.java` | `mapper/` | MyBatis Mapper interface (`@Mapper`) |
| smp10 | `SmpBoard_SQL.xml` | `mapper/.../smp/` | Actual SQL query definitions |

---

## 2. Request Flow — "List Query" Example (7 Steps)

When a user visits `/smpBoard/list.do` in their browser, here's how data flows through the system:

---

### STEP 1. Browser → Controller `[smp3 → smp6]`

**[smp3]** User clicks the search button in `SmpBoardList.html`:

```html
<form th:action="@{/smpBoard/list.do}" method="get">
  <select name="searchCondition">...</select>
  <input name="searchKeyword" .../>
  <button type="submit">Search</button>
</form>
```

Browser sends this request to the server:
```
GET /smpBoard/list.do?searchCondition=1&searchKeyword=title
```

**[smp6]** The matching method in `SmpBoardController` is called:

```java
@RequestMapping("/smpBoard/list.do")
public String selectList(
    @ModelAttribute("searchVO") SmpBoardInVO inVO,  // ← auto-binds parameters
    ModelMap model) throws Exception {
```

> **What is `@ModelAttribute`?**
> It automatically maps HTTP request parameters (`name=value`) to the VO's setters.
> `name="searchKeyword"` → automatically calls `inVO.setSearchKeyword("title")`

---

### STEP 2. Controller → Service Interface `[smp6 → smp7]`

The Controller calls using the **Service interface type** — it does NOT know the implementation directly.
This is called **loose coupling**.

```java
// Inside Controller
@Autowired
private SmpBoardService smpBoardService;   // ← interface type!

// Call
List<SmpBoardOutVO> resultList = smpBoardService.selectList(inVO);
```

**[smp7]** `SmpBoardService.java` (interface):

```java
public interface SmpBoardService {
    List<SmpBoardOutVO> selectList(SmpBoardInVO inVO) throws Exception;
    int selectListTotCnt(SmpBoardInVO inVO) throws Exception;
    SmpBoardOutVO selectDetail(SmpBoardInVO inVO) throws Exception;
    void insert(SmpBoardInVO inVO) throws Exception;
    void update(SmpBoardInVO inVO) throws Exception;
    void delete(SmpBoardInVO inVO) throws Exception;
}
```

> **Why use an interface?**
> - Controller only needs to know **"what can be done"** (the contract)
> - **"How it's done"** is handled by ServiceImpl
> - You can swap implementations without changing Controller code
> - Spring automatically connects the implementation at `@Autowired` time

---

### STEP 3. Service Interface → ServiceImpl `[smp7 → smp8]`

Spring **automatically connects** the interface call to the implementation.
Developers never write `new ServiceImpl()` themselves!

```
@Service("smpBoardService")           ← ① registered in Spring with this name
public class SmpBoardServiceImpl
    implements SmpBoardService        ← ② declares it implements the interface

↓ At server startup, Spring container automatically:

injects SmpBoardServiceImpl instance
into Controller's @Autowired SmpBoardService field
```

**[smp8]** `SmpBoardServiceImpl.selectList()` runs:

```java
@Service("smpBoardService")
public class SmpBoardServiceImpl implements SmpBoardService {

    @Autowired
    private SmpBoardMapper smpBoardMapper;    // ← Mapper interface injected

    @Override
    public List<SmpBoardOutVO> selectList(SmpBoardInVO inVO) throws Exception {

        // ★ Put business logic here if needed:
        // e.g. permission checks, data transformations, multiple Mapper calls, transactions

        return smpBoardMapper.selectList(inVO);    // → calls Mapper
    }
}
```

---

### STEP 4. ServiceImpl → Mapper Interface `[smp8 → smp9]`

ServiceImpl calls the **Mapper interface**.
The Mapper interface uses `@Mapper` — **MyBatis automatically generates the implementation**.
You never write a Mapper implementation class yourself.

**[smp9]** `SmpBoardMapper.java`:

```java
@Mapper
public interface SmpBoardMapper {
    List<SmpBoardOutVO> selectList(SmpBoardInVO inVO) throws Exception;
    int selectListTotCnt(SmpBoardInVO inVO) throws Exception;
    SmpBoardOutVO selectDetail(SmpBoardInVO inVO) throws Exception;
    void insert(SmpBoardInVO inVO) throws Exception;
    void update(SmpBoardInVO inVO) throws Exception;
    void delete(SmpBoardInVO inVO) throws Exception;
}
```

> **Advantages of the Mapper interface pattern:**
> - Just declare `@Mapper` — MyBatis creates the implementation automatically
> - The SQL XML `namespace` must match the Mapper interface's **FQCN** (fully qualified class name)
> - Method names auto-match with `id` in the SQL XML
> - No need to call `SqlSession` directly (unlike old DAO pattern)

---

### STEP 5. Mapper Interface → SQL Mapper XML `[smp9 → smp10]`

MyBatis finds the query in the XML where **namespace + id matches**.

**[smp10]** `SmpBoard_SQL.xml`:

```xml
<!-- namespace = Mapper interface FQCN -->
<mapper namespace="egovframework.com.smp.mapper.SmpBoardMapper">

  <!-- id = Mapper method name -->
  <select id="selectList"
    parameterType="egovframework.com.smp.service.SmpBoardInVO"
    resultMap="smpBoard">

    SELECT board_sn, board_title, use_yn, ...
      FROM co_smp_board_m
     WHERE 1=1
    <if test="searchKeyword != null and searchKeyword != ''">
      <if test="searchCondition == '1'">
        AND board_title LIKE '%' || #{searchKeyword} || '%'
      </if>
    </if>
     ORDER BY board_sn DESC
     LIMIT #{recordCountPerPage} OFFSET #{firstIndex}

  </select>
</mapper>
```

> **How mapping works:**
> - `namespace` → matches the Mapper interface's FQCN
> - `id="selectList"` → matches the `selectList()` method in the Mapper interface
> - `#{searchKeyword}` → calls `inVO.getSearchKeyword()` to bind the value
> - `#{firstIndex}` → calls `inVO.getFirstIndex()` to bind the value
> - `resultMap` → converts DB columns (snake_case) to VO fields (camelCase)
>   - `board_title` → `boardTitle`
>   - `data_reg_dt` → `dataRegDt`

---

### STEP 6. DB → Return Result (reverse direction) `[smp10 → smp6]`

DB results travel back **in reverse order**:

```
DB Result (ResultSet)
    │
    ▼  resultMap converts column → OutVO field
[smp10]  List<SmpBoardOutVO>  (created automatically by MyBatis)
    │
    ▼  Mapper interface returns via MyBatis auto-generated impl
[smp9]
    │
    ▼  ServiceImpl returns it (process/transform here if needed)
[smp8]   return smpBoardMapper.selectList(inVO);
    │
    ▼  Controller adds it to Model
[smp6]   model.addAttribute("resultList", resultList);
         model.addAttribute("paginationInfo", paginationInfo);
         return "egovframework/com/smp/SmpBoardList";
                 └─ Thymeleaf renders the HTML at this path
```

---

### STEP 7. Controller → HTML Render `[smp6 → smp3]`

The string returned by Controller → **Thymeleaf template path**
Data stored in Model → accessed in HTML via **`${variableName}`**

**[smp3]** `SmpBoardList.html` displays results:

```html
<tr th:each="item, stat : ${resultList}">
  <td th:text="${...row number calculation...}">1</td>
  <td>
    <a th:href="@{/smpBoard/detail.do(boardSn=${item.boardSn})}"
       th:text="${item.boardTitle}">Title</a>
  </td>
  <td th:text="${item.dataRegDt}">2026-01-01</td>
</tr>
```

→ The finished HTML is displayed in the browser.

---

## 3. Full Flow at a Glance

```
Browser     Controller    Service(I/F)   ServiceImpl    Mapper(I/F)    SQL XML       DB
   │             │              │              │              │             │           │
   │  GET req    │              │              │              │             │           │
   │────────────→│              │              │              │             │           │
   │             │ selectList() │              │              │             │           │
   │             │─────────────→│              │              │             │           │
   │             │              │ (Spring auto │              │             │           │
   │             │              │  connects)   │              │             │           │
   │             │              │─────────────→│              │             │           │
   │             │              │              │ selectList() │             │           │
   │             │              │              │─────────────→│             │           │
   │             │              │              │              │  SQL query  │           │
   │             │              │              │              │────────────→│           │
   │             │              │              │              │             │  SELECT   │
   │             │              │              │              │             │──────────→│
   │             │              │              │              │             │           │
   │             │              │              │              │             │ ResultSet │
   │             │              │              │              │  List<VO>   │←──────────│
   │             │              │              │  List<VO>    │←────────────│           │
   │             │              │  List<VO>    │←─────────────│             │           │
   │             │  List<VO>    │←─────────────│              │             │           │
   │             │←─────────────│              │              │             │           │
   │    HTML     │              │              │              │             │           │
   │←────────────│              │              │              │             │           │
```

---

## 4. Dependency Injection (DI) — What Spring Auto-Connects

| Declared here (annotation) | Injected into (`@Autowired`) |
|----------------------------|-----------------------------|
| `@Service("smpBoardService")` on SmpBoardServiceImpl | Controller's `SmpBoardService` field (interface type) |
| `@Mapper` on SmpBoardMapper | ServiceImpl's `SmpBoardMapper` field (MyBatis auto-creates the impl) |
| `@Controller` on SmpBoardController | Spring MVC auto-registers URL mappings |

> **Developers never write `new`!**
> The Spring container creates all beans and connects them at server startup.

---

## 5. File Location Rules

### Java Source

```
olv-oper/src/main/java/egovframework/com/{domain}/
├── web/
│   └── {Domain}Controller.java       @Controller
├── mapper/
│   └── {Domain}Mapper.java           @Mapper (interface)
├── service/
│   ├── {Domain}InVO.java             extends CmmVO (input parameters)
│   ├── {Domain}OutVO.java            extends CmmVO (query results)
│   └── {Domain}Service.java          interface
└── service/impl/
    └── {Domain}ServiceImpl.java      @Service
```

### HTML Templates

```
olv-oper/src/main/resources/templates/egovframework/com/{domain}/
├── {Domain}List.html         List screen
├── {Domain}Regist.html       Create screen
└── {Domain}Updt.html         Edit/Detail screen
```

### SQL Mapper

```
olv-oper/src/main/resources/egovframework/mapper/com/{domain}/
└── {Domain}_SQL.xml
    namespace = Mapper interface FQCN
    (e.g. egovframework.com.smp.mapper.SmpBoardMapper)
```

---

## 6. New Screen Checklist

> Build in this order — **bottom-up** — to avoid compile errors at each step.

- [ ] **1. Check DDL** — understand the table, sequence, and PK structure
- [ ] **2. Write InVO** — extend `CmmVO`, map input params (search conditions / form fields) → see `[smp1]`
- [ ] **3. Write OutVO** — extend `CmmVO`, map query results → see `[smp2]`
- [ ] **4. Write SQL Mapper XML** — set namespace (Mapper FQCN), resultMap, CRUD queries → see `[smp10]`
- [ ] **5. Write Mapper Interface** — `@Mapper`, declare CRUD methods → see `[smp9]`
- [ ] **6. Write Service Interface** — declare CRUD methods → see `[smp7]`
- [ ] **7. Write ServiceImpl** — `@Service`, call Mapper → see `[smp8]`
- [ ] **8. Write Controller** — `@Controller`, URL mapping, call Service → see `[smp6]`
- [ ] **9. Write HTML screens** — List / Create / Edit → see `[smp3~5]`
- [ ] **10. Compile & run server test**

---

## 7. Sample Table DDL (PostgreSQL)

```sql
CREATE SEQUENCE seq_co_smp_board_m START WITH 1 INCREMENT BY 1;

CREATE TABLE co_smp_board_m (
    board_sn       BIGINT         NOT NULL DEFAULT nextval('seq_co_smp_board_m'),
    board_title    VARCHAR(200)   NOT NULL,
    board_cn       TEXT,
    use_yn         CHAR(1)        DEFAULT 'Y',
    data_reg_id    VARCHAR(20),
    data_reg_dt    TIMESTAMP      DEFAULT NOW(),
    data_chg_id    VARCHAR(20),
    data_chg_dt    TIMESTAMP,
    CONSTRAINT pk_co_smp_board_m PRIMARY KEY (board_sn)
);
```

> **Column naming convention:**
> - `board_sn` → serial number (primary key, auto-incremented by sequence)
> - `use_yn` → active flag (`Y` = active, `N` = inactive)
> - `data_reg_id` / `data_reg_dt` → created by / created at
> - `data_chg_id` / `data_chg_dt` → updated by / updated at

---

## 8. Key Concepts Summary

| Concept | What it means |
|---------|--------------|
| **`@ModelAttribute`** | Auto-maps HTTP request params to a VO object |
| **Service Interface** | Contract — defines *what* can be done, not *how* |
| **ServiceImpl** | Implementation — the actual business logic |
| **`@Mapper`** | MyBatis generates the DB implementation automatically |
| **namespace** | Links SQL XML to the Mapper interface (must match FQCN exactly) |
| **resultMap** | Converts DB column names (snake_case) to Java field names (camelCase) |
| **`#{param}`** | MyBatis placeholder — calls the getter on the VO automatically |
| **Loose coupling** | Controller doesn't know *which* ServiceImpl runs — Spring decides |
| **DI (Dependency Injection)** | Spring creates and connects objects — no `new` needed |
| **FQCN** | Fully Qualified Class Name — full package path + class name |
