# ??? Practice Projects

[<- Back to root](../README.md)

## ?? Purpose

Reference project setup and realistic practice roadmap for enterprise-style backend development.

## ?? Reference Project: `spring-mybatis-test`

A User Management example using Spring Boot + MyBatis + JSP/JSTL + jQuery + PostgreSQL.

## ?? Stack

| Layer | Technology |
| --- | --- |
| Language | Java 17 |
| Framework | Spring Boot 3.x |
| SQL Mapper | MyBatis 3.x |
| View | JSP + JSTL (Jakarta tags) |
| Frontend | jQuery 3.7.x |
| Database | PostgreSQL |
| Build | Maven |

## ??? Recommended Structure

```text
spring-mybatis-test/
  src/main/java/com/example/app/
    common/
    config/
    controller/
    dto/
    mapper/
    model/
    service/
  src/main/resources/
    application.properties
    mapper/
  src/main/webapp/
    css/
    js/
    WEB-INF/views/
  pom.xml
```

## ??? Database Setup Example

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## ?? Minimal Configuration

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/postgres
spring.datasource.username=postgres
spring.datasource.password=your_password
mybatis.mapper-locations=classpath:mapper/**/*.xml
```

## ?? Run

```bash
./mvnw spring-boot:run
# Windows
mvnw.cmd spring-boot:run
```

## ?? Pages and APIs

| URL | Description |
| --- | --- |
| `http://localhost:8080/` | Create user page |
| `http://localhost:8080/user-list` | User list page |

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/users` | Get all users |
| `GET` | `/users/{id}` | Get one user |
| `POST` | `/users` | Create user |
| `PUT` | `/users/{id}` | Update user |
| `DELETE` | `/users/{id}` | Delete user |

## ?? Practice Project Ideas

1. Board/BBS System
- Post CRUD
- Pagination and search
- Comment/reply flow
- File attachment

2. Employee Management
- Employee and department CRUD
- Role-based access
- Filter/search by department and status
- Excel export

3. Order Management
- Product catalog and order flow
- Order status tracking
- Date-range reporting
- Aggregation dashboards

## ? Skills Checklist

### Junior

- [ ] Build CRUD with MyBatis XML mapper
- [ ] Render JSP pages with JSTL loops/conditions
- [ ] Handle AJAX CRUD with jQuery
- [ ] Implement pagination (`LIMIT/OFFSET`)

### Mid

- [ ] Build complex join queries
- [ ] Add Spring Security login/roles
- [ ] Apply `@Transactional` correctly
- [ ] Implement global exception handling

### Senior

- [ ] Review and optimize slow SQL (`EXPLAIN`, indexes)
- [ ] Define architecture and coding standards
- [ ] Build CI/CD and deployment automation
- [ ] Plan migration from JSP to API-first frontend

## ?? Study Resources

| Resource | Link |
| --- | --- |
| Spring Boot Docs | https://docs.spring.io/spring-boot |
| MyBatis Docs | https://mybatis.org/mybatis-3 |
| PostgreSQL Docs | https://www.postgresql.org/docs |
| jQuery API | https://api.jquery.com |
| eGovFrame | https://www.egovframe.go.kr |

## ?? Daily Routine (Simple)

1. Learn one concept (docs or tutorial).
2. Build one small feature.
3. Refactor and write short notes.
4. Commit progress.
