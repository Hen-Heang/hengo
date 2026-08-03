# 🌱 Spring Boot Mastery Notes

## 🎯 Purpose
Core Spring Boot patterns for modern enterprise backend development, covering the full flow from IoC to Server-Side Rendering.

---

## 🧠 1. IoC and DI Essentials
Spring's "Inversion of Control" container manages your objects (Beans).

| Annotation | Meaning |
| --- | --- |
| `@Component` | Generic bean |
| `@Service` | Service-layer bean (Business Logic) |
| `@Repository` | Persistence-layer bean (Data Access) |
| `@RestController` | JSON API controller |
| `@Configuration` | Bean configuration class |
| `@Bean` | Registers method return as bean |

```java
@Service
public class UserServiceImpl implements UserService {
    private final UserMapper userMapper;

    // Prefer Constructor Injection for testability
    public UserServiceImpl(UserMapper userMapper) {
        this.userMapper = userMapper;
    }
}
```

---

## 🍃 2. Thymeleaf: Server-Side Rendering
Thymeleaf is the modern successor to JSP, used for rendering HTML on the server.

### Basic Syntax
*   **`th:text`**: Render data safely (escapes HTML).
*   **`th:each`**: Loop over collections.
*   **`th:if`**: Conditional rendering.

```html
<!-- Example: Rendering a list of notes -->
<tr th:each="note : ${notes}">
    <td th:text="${note.title}">Default Title</td>
    <td th:if="${note.isPublic}">Public</td>
</tr>
```

### Advanced Patterns
*   **Fragments**: Reusable UI components (Headers, Footers).
*   **Layout Dialect**: Creating a base template that other pages extend.
*   **Security Integration**: `sec:authorize="hasRole('ADMIN')"` to hide/show UI based on permissions.

---

## 🌐 3. Web MVC & REST API
Handling HTTP requests and building robust endpoints.

```java
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @GetMapping("/{id}")
    public ApiResponse<UserResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(userService.findById(id));
    }

    @PostMapping
    public ApiResponse<Void> create(@RequestBody @Valid UserRequest req) {
        userService.save(req);
        return ApiResponse.success(null);
    }
}
```

---

## 🔄 4. Persistence: JPA & MyBatis
Choose the right tool for the job.

*   **Spring Data JPA**: Best for modern, object-oriented data management. Handles SQL generation automatically.
*   **MyBatis**: Best for complex, legacy, or highly-tuned SQL. Uses XML mappers.

```java
@Transactional
public void updateStatus(Long id, String status) {
    // Logic here is wrapped in a single database transaction
    userMapper.updateStatus(id, status);
}
```

---

## 🏗️ 5. Recommended Layer Structure
Keep your code clean and organized.

```text
Controller (Web) -> Service (Business) -> Mapper/Repository (Data) -> Database
```

| Layer | Role |
| --- | --- |
| `controller/` | Handles HTTP request/response |
| `service/` | Business logic and transaction boundary |
| `mapper/` | SQL mapping via MyBatis / Repository via JPA |
| `dto/` | Request/response schema (Data Transfer Objects) |
| `model/` | Table-aligned domain objects |

---

## ✅ Best Practices for Senior Devs
1.  **Always use Constructor Injection.**
2.  **Keep Controllers thin** (logic belongs in the Service layer).
3.  **Use DTOs** instead of exposing your Database Models directly to the API.
4.  **Handle Exceptions globally** using `@RestControllerAdvice`.
5.  **Write Integration Tests** using `@SpringBootTest` to ensure your layers connect correctly.
