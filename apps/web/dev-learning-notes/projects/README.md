# Spring MyBatis Test Project

[<- Back to root](../README.md)

> 한국 기업 프로젝트 표준 스택으로 배우는 웹 개발
> Learning Web Development with Korean Enterprise Standard Stack

![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.0-green)
![MyBatis](https://img.shields.io/badge/MyBatis-4.0.0-blue)
![jQuery](https://img.shields.io/badge/jQuery-3.7.1-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue)

---

## Table of Contents

- [About Project](#about-project)
- [Updates](#updates)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Features](#features)
- [API Endpoints](#api-endpoints)
- [SQL Fundamentals Reference](#sql-fundamentals-reference)
- [MyBatis Dynamic SQL Reference](#mybatis-dynamic-sql-reference)
- [Learning Roadmap](#learning-roadmap)
- [Study Resources](#study-resources)
- [eGovFrame Reference](#egovframe-reference)
- [Working in Korea](#working-in-korea)

---

## About Project

This project is a **Spring Boot + MyBatis practice project** built around a Korean enterprise standard stack.

It currently includes:

- **User Management System**: REST API + JSP/jQuery screens
- **Board MVC Module**: traditional `.do` style board flow for Korean enterprise practice

Main technologies:

- **Spring Boot**: backend framework
- **MyBatis**: SQL mapper
- **JSP**: view template
- **jQuery AJAX**: frontend interaction
- **PostgreSQL**: database

This stack is common in:

- Korean government projects (`전자정부 표준프레임워크`)
- Large SI projects (`삼성SDS`, `LG CNS`, `SK C&C`)
- Financial systems (banking, insurance)

---

## Updates

### 2026-03-11

- Expanded this file from a short summary into a full project guide
- Replaced outdated stack/version notes with current project information
- Updated document dates where needed and kept existing valid sections

### 2026-03-10

- Fixed `ClassCastException` by changing board mapper/result types from `Board` to `BoardVO`
- Fixed `detail.jsp` date display for `LocalDateTime`
- Added dashboard back button and fixed dashboard URL
- Updated `BoardMvcControllerTest` to standalone `MockMvc`
- Updated `BoardMapperTest` to `@SpringBootTest` + `@Transactional`

### 2026-03-09

- Added Board MVC module with `.do` URL style
- Implemented `BoardMapper`, `BoardDAO`, `BoardService`, `BoardServiceImpl`, `BoardMvcController`
- Added board JSP pages and board-related tests
- Removed duplicate REST-style board controller

### IDE Note

- Set `JAVA_HOME` to the JDK root directory, not the `bin` folder
- Example: `C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot`

---

## Tech Stack

### Backend

| Technology | Version | Description |
| --- | --- | --- |
| Java | 17 | Programming language |
| Spring Boot | 4.0.0 | Web framework |
| MyBatis | 4.0.0 | SQL mapper |
| PostgreSQL | Latest | Database |
| Lombok | Latest | Boilerplate reduction |

### Frontend

| Technology | Version | Description |
| --- | --- | --- |
| JSP | 3.0 | View template |
| JSTL | Jakarta | JSP tag library |
| jQuery | 3.7.1 | JavaScript library |
| CSS3 | - | Styling |

---

## Project Structure

```text
spring-mybatis-test/
├── src/main/java/com/heang/springmybatistest/
│   ├── common/ApiResponse.java
│   ├── config/CorsConfig.java
│   ├── controller/BoardMvcController.java
│   ├── controller/UserController.java
│   ├── controller/ViewController.java
│   ├── dao/BoardDAO.java
│   ├── dto/UserRequest.java
│   ├── dto/UserUpdateRequest.java
│   ├── dto/UserResponse.java
│   ├── mapper/BoardMapper.java
│   ├── mapper/UserMapper.java
│   ├── model/Board.java
│   ├── model/Users.java
│   ├── service/BoardService.java
│   ├── service/BoardServiceImpl.java
│   ├── service/UserService.java
│   ├── service/UserServiceImpl.java
│   └── vo/BoardVO.java
├── src/main/resources/
│   ├── application.properties
│   └── mapper/
│       ├── BoardMapper.xml
│       └── UserMapper.xml
├── src/main/webapp/
│   ├── css/style.css
│   ├── js/user-api.js
│   ├── js/common.js
│   └── WEB-INF/views/
│       ├── board/list.jsp
│       ├── board/detail.jsp
│       ├── board/insertForm.jsp
│       ├── users.jsp
│       └── user-list.jsp
├── src/test/java/com/heang/springmybatistest/
│   ├── controller/BoardMvcControllerTest.java
│   ├── mapper/BoardMapperTest.java
│   └── service/BoardServiceTest.java
└── pom.xml
```

---

## Getting Started

### Prerequisites

- Java 17 or higher
- Maven
- PostgreSQL

### Database Setup

```sql
CREATE DATABASE postgres;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Configuration

Edit `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/postgres
spring.datasource.username=postgres
spring.datasource.password=your_password
```

### Run Application

```bash
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run
```

### JVM Native Access

If you see a restricted native access warning from tooling such as `cool-request-agent.jar`, this project enables the required flag for Maven runs via `.mvn/jvm.config`.

For non-Maven runs:

```bash
java --enable-native-access=ALL-UNNAMED -jar target/spring-mybatis-test-0.0.1-SNAPSHOT.jar
```

### Access Application

- **Create User Page**: `http://localhost:8080/`
- **User List Page**: `http://localhost:8080/user-list`
- **Dashboard**: `http://localhost:8080/dashboard`
- **Board List**: `http://localhost:8080/board/list.do`
- **Swagger API Docs**: `http://localhost:8080/swagger-ui.html`

---

## Features

### User Management

| Feature | Description | URL |
| --- | --- | --- |
| Create User | Add new user | `GET /` |
| View All Users | List with statistics | `GET /user-list` |
| View User | User detail modal | Click "View" button |
| Edit User | Update user info | Click "Edit" button |
| Delete User | Remove user | Click "Delete" button |

### Board MVC Practice

| Feature | Description | URL |
| --- | --- | --- |
| Board List | Show active board posts | `GET /board/list.do` |
| Board Detail | Show one board post | `GET /board/detail.do?boardSn={id}` |
| Board Insert | Save a new board post | `POST /board/insert.do` |
| Board Update | Update title/content | `POST /board/update.do` |
| Board Delete | Soft delete with `use_yn = 'N'` | `POST /board/delete.do` |

### UI Features

- Responsive design
- Modal dialogs
- Form validation
- Status badges
- Statistics cards
- AJAX without full page reload
- Traditional JSP MVC board flow

---

## API Endpoints

### User APIs

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/users` | Get all users |
| `GET` | `/users/{id}` | Get user by ID |
| `POST` | `/users` | Create new user |
| `PUT` | `/users/{id}` | Update user |
| `DELETE` | `/users/{id}` | Delete user |

### Request and Response Examples

```http
POST /users
Content-Type: application/json

{
  "username": "john",
  "email": "john@example.com",
  "status": "active"
}
```

```json
{
  "resultCd": "M0000",
  "resultMsg": "User created successfully",
  "data": null
}
```

```http
GET /users
```

```json
{
  "resultCd": "M0000",
  "resultMsg": "Success",
  "data": [
    {
      "id": 1,
      "username": "john",
      "email": "john@example.com",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00"
    }
  ]
}
```

---

## SQL Fundamentals Reference

> Master SQL basics first. Dynamic SQL becomes much easier after that.

### Statement Types

| Type | Purpose | Example |
| --- | --- | --- |
| `SELECT` | Read data | `SELECT * FROM users` |
| `INSERT` | Create data | `INSERT INTO users VALUES (...)` |
| `UPDATE` | Modify data | `UPDATE users SET name = 'new'` |
| `DELETE` | Remove data | `DELETE FROM users WHERE id = 1` |

### Core Patterns

```sql
SELECT columns
FROM table
WHERE condition
ORDER BY column
LIMIT number OFFSET number;
```

```sql
SELECT * FROM users WHERE status = 'ACTIVE';
SELECT * FROM users WHERE username LIKE '%john%';
SELECT * FROM users WHERE id IN (1, 2, 3);
SELECT * FROM users WHERE age BETWEEN 18 AND 30;
SELECT * FROM users ORDER BY created_at DESC;
SELECT * FROM users LIMIT 10 OFFSET 20;
```

```sql
INSERT INTO users (username, email, status)
VALUES ('john', 'john@test.com', 'ACTIVE');

UPDATE users
SET status = 'INACTIVE'
WHERE id = 1;

DELETE FROM users
WHERE id = 1;
```

### JOIN, Aggregate, Grouping

```sql
SELECT u.username, o.amount
FROM users u
JOIN orders o ON u.id = o.user_id;

SELECT status, COUNT(*) AS count
FROM users
GROUP BY status
HAVING COUNT(*) > 10;
```

### Execution Order

1. `FROM / JOIN`
2. `WHERE`
3. `GROUP BY`
4. `HAVING`
5. `SELECT`
6. `ORDER BY`
7. `LIMIT / OFFSET`

---

## MyBatis Dynamic SQL Reference

### Overview

| Tag | Purpose | Typical Use |
| --- | --- | --- |
| `<if>` | Conditional SQL | Optional filters |
| `<choose>` | Switch logic | Mutually exclusive conditions |
| `<where>` | Smart `WHERE` | Clean prefix handling |
| `<set>` | Smart `SET` | Partial updates |
| `<foreach>` | Loop | `IN` clause, batch operations |
| `<trim>` | Custom cleanup | Prefix/suffix control |
| `<sql>` + `<include>` | Reuse | Shared fragments |
| `<bind>` | Derived variable | `LIKE` pattern |

### `<if>` and `<where>`

```xml
<select id="searchUsers" resultMap="UserMap">
    SELECT * FROM users
    <where>
        <if test="username != null and username != ''">
            AND username = #{username}
        </if>
        <if test="email != null and email != ''">
            AND email = #{email}
        </if>
        <if test="status != null">
            AND status = #{status}
        </if>
    </where>
</select>
```

### `<choose>`

```xml
ORDER BY
<choose>
    <when test="sortBy == 'username'">username</when>
    <when test="sortBy == 'email'">email</when>
    <otherwise>id</otherwise>
</choose>
<choose>
    <when test="sortOrder == 'ASC'">ASC</when>
    <otherwise>DESC</otherwise>
</choose>
```

### `<foreach>`

```xml
<select id="findByIds" resultMap="UserMap">
    SELECT * FROM users
    WHERE id IN
    <foreach collection="ids" item="id" open="(" close=")" separator=",">
        #{id}
    </foreach>
</select>
```

```xml
<insert id="batchInsert">
    INSERT INTO users (username, email, status)
    VALUES
    <foreach collection="users" item="user" separator=",">
        (#{user.username}, #{user.email}, #{user.status})
    </foreach>
</insert>
```

### `<set>` and `<trim>`

```xml
<update id="dynamicUpdate">
    UPDATE users
    <set>
        <if test="username != null and username != ''">
            username = #{username},
        </if>
        <if test="email != null and email != ''">
            email = #{email},
        </if>
        <if test="status != null">
            status = #{status},
        </if>
    </set>
    WHERE id = #{id}
</update>
```

```xml
<trim prefix="WHERE" prefixOverrides="AND |OR ">
    <if test="username != null">
        AND username = #{username}
    </if>
</trim>
```

### `<sql>`, `<include>`, `<bind>`

```xml
<sql id="userColumns">
    id, username, email, status, created_at
</sql>

<select id="findAll" resultMap="UserMap">
    SELECT <include refid="userColumns"/>
    FROM users
</select>

<select id="searchByKeyword" resultMap="UserMap">
    <bind name="pattern" value="'%' + keyword + '%'"/>
    SELECT * FROM users
    WHERE username LIKE #{pattern}
</select>
```

### XML Escape Characters

| Character | Escape |
| --- | --- |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `&` | `&amp;` |

### SQL Logging

```properties
logging.level.com.heang.springmybatistest.mapper=DEBUG
mybatis.configuration.log-impl=org.apache.ibatis.logging.stdout.StdOutImpl
```

### Practice Checklist

- [ ] Test `<if>` with different filter combinations
- [ ] Test `<choose>` sorting options
- [ ] Test `<foreach>` for `IN` clauses
- [ ] Test batch insert/update/delete
- [ ] Test partial update with `<set>`
- [ ] Test advanced search with pagination
- [ ] Enable SQL logging and read generated SQL

---

## Learning Roadmap

### Why This Stack?

| Reason | Explanation |
| --- | --- |
| Government standard | eGovFrame is Spring-based |
| SI companies | Standardized on Spring + MyBatis |
| Developer pool | Many Korean developers trained on it |
| Stability | Proven over many years |
| Oracle fit | MyBatis works well with Oracle-heavy environments |

### Stack Evolution

```text
1990s: Servlets + JSP
2000s: Struts + JSP + JDBC
2005+: Spring + MyBatis + JSP + jQuery
2015+: Spring Boot + JPA slowly increasing
```

### Phase 1: Fundamentals

- Java OOP, collections, exceptions, streams, lambdas
- SQL CRUD, joins, grouping, pagination
- Basic Spring MVC flow

### Phase 2: Deep Dive

- Spring IoC/DI, MVC, REST, transaction management
- MyBatis `resultMap` and Dynamic SQL
- JSP/JSTL rendering
- jQuery AJAX CRUD flow

### Phase 3: Enterprise Patterns

- Board system with pagination and search
- Employee management with auth and Excel
- Order management with reporting and aggregation

### Skills Checklist

#### Junior

- [ ] CRUD with MyBatis XML mapper
- [ ] JSP + JSTL rendering
- [ ] jQuery AJAX CRUD
- [ ] Pagination and search

#### Mid

- [ ] Complex join queries
- [ ] Spring Security
- [ ] Transaction management
- [ ] Exception handling
- [ ] File upload/download

#### Senior

- [ ] Performance optimization
- [ ] Code review
- [ ] Architecture decisions
- [ ] Migration planning

---

## Study Resources

### Korean Resources

| Type | Resource | Link |
| --- | --- | --- |
| Framework | 전자정부 표준프레임워크 | https://www.egovframe.go.kr |
| Courses | 인프런 | https://www.inflearn.com |
| Community | OKKY | https://okky.kr |
| Blogs | Velog / Tistory | Search `mybatis`, `egovframe`, `스프링` |

### English Resources

| Type | Resource | Link |
| --- | --- | --- |
| Spring | Baeldung | https://www.baeldung.com |
| MyBatis | Official Docs | https://mybatis.org/mybatis-3 |
| MyBatis Spring | Official Docs | https://mybatis.org/spring |
| jQuery | API Docs | https://api.jquery.com |
| Oracle | Live SQL | https://livesql.oracle.com |

### Recommended Order

```text
Week 1  -> MyBatis XML + Dynamic SQL
Week 2  -> Oracle SQL basics
Week 3  -> eGovFrame structure
Week 4  -> JSP + JSTL
Week 5  -> SVN basics
Week 6+ -> Read real eGovFrame source
```

---

## eGovFrame Reference

### Simple Homepage Backend

The official eGovFrame simple homepage backend shows the newer government direction:

```text
Old style:
Spring Boot -> JSP -> Browser

New style:
Spring Boot API -> JSON -> React -> Browser
```

Key environment:

| Item | Version |
| --- | --- |
| JDK | 17 |
| Jakarta EE | 10 |
| Servlet | 6.0 |
| Spring Framework | 6.2.x |
| Spring Boot | 3.x |

Swagger references:

- `http://localhost:8080/swagger-ui/index.html`
- `http://localhost:8080/swagger-ui.html`

### Common Concepts

- XML config is gradually replaced by Java `@Configuration`
- Old style returns JSP views, new style returns JSON APIs
- `EgovAbstractDAO` is a very common DAO base pattern
- `ComDefaultVO` often carries pagination and search fields
- `globals.properties` is a central configuration file in eGovFrame projects

### Typical eGovFrame Folder Shape

```text
src/main/java/egovframework/com/
  cmm/
  cop/bbs/
  uat/

src/main/resources/egovframework/mapper/
src/main/webapp/WEB-INF/config/egovframework/spring/
```

### Common Components

Reusable modules commonly include:

- Login and authentication
- Board/community modules
- Role and permission management
- System management
- Utility helpers

Supported databases often include Oracle, MySQL, MariaDB, PostgreSQL, Altibase, Tibero, CUBRID, and Goldilocks.

---

## Working in Korea

### Tech You Will See Often

| Tech | Why It Appears |
| --- | --- |
| `eGovFrame` | Government standard |
| `MyBatis XML` | Direct SQL control |
| `JSP + JSTL` | Legacy and enterprise maintenance |
| `Oracle DB` | Very common in enterprise |
| `Maven` | Standard build tool |
| `SVN` | Still used in some companies |

### Code Patterns You Should Know

```java
public class BoardDAO extends EgovAbstractDAO {
    public List<BoardVO> selectBoardList(BoardVO vo) {
        return selectList("BoardMapper.selectBoardList", vo);
    }
}
```

Method prefixes are usually:

```text
selectXxx
insertXxx
updateXxx
deleteXxx
```

### Oracle Patterns You Will Meet

```sql
SELECT * FROM (
    SELECT ROWNUM AS rnum, A.*
    FROM (SELECT * FROM TB_BOARD_M ORDER BY REG_DT DESC) A
    WHERE ROWNUM <= 20
)
WHERE rnum >= 11;

SELECT NVL(board_cn, '-') FROM TB_BOARD_M;
```

### Deployment Pattern

Many Korean enterprise projects still package and deploy as WAR to Tomcat:

```bash
mvn clean package
```

### Practical Advice

- Understand legacy code before changing it
- Ask before large refactors
- Keep SQL and mapper comments clear
- Learn Oracle pagination and sequence usage
- Be comfortable reading old XML config and MyBatis mapper files

---

## License

This project is for learning purposes.

## Author

Created for learning Korean enterprise web development stack.

*Last Updated: 2026-03-11*
