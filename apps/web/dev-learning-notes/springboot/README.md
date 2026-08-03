# Spring Boot Mastery Notes

## 🍃 Thymeleaf: Server-Side Rendering
Thymeleaf is a modern server-side Java template engine for both web and standalone environments. It is the natural successor to JSP and is highly integrated with Spring Boot.

### 1. Basic Syntax (The Core)
*   **`th:text`**: Replaces the text content of an element.
    ```html
    <p th:text="${user.name}">Default Name</p>
    ```
*   **`th:value`**: Sets the value attribute (useful for forms).
    ```html
    <input type="text" th:value="${user.email}" />
    ```
*   **`th:each`**: Iterates over a collection (List, Map).
    ```html
    <tr th:each="note : ${notes}">
        <td th:text="${note.title}">Title</td>
    </tr>
    ```
*   **`th:if` / `th:unless`**: Conditional rendering.
    ```html
    <div th:if="${user.isAdmin}">Admin Panel</div>
    ```

### 2. Intermediate Patterns (Real Projects)
*   **Object Selection (`th:object` & `*{}**)`: Shorthand for working with a specific object.
    ```html
    <form th:object="${member}">
        <input type="text" th:field="*{name}" />
    </form>
    ```
*   **URL Handling (`@{...}`)**: Handling context paths and parameters safely.
    ```html
    <a th:href="@{/notes/view(id=${note.id})}">View Note</a>
    ```
*   **Literal Substitution**: Clean string concatenation.
    ```html
    <span th:text="|Welcome, ${user.name}!|"></span>
    ```

### 3. Advanced Enterprise Usage
*   **Fragments (`th:fragment`)**: Reusable UI components (Navbar, Footer).
    ```html
    <!-- footer.html -->
    <footer th:fragment="copy"> &copy; 2026 dev-notes </footer>
    
    <!-- main.html -->
    <div th:replace="~{footer :: copy}"></div>
    ```
*   **Layout Dialect**: Building a decorator pattern where pages "plug into" a common layout.
*   **Spring Security Integration**: Showing/Hiding elements based on roles.
    ```html
    <div sec:authorize="hasRole('ADMIN')">Only visible to Admins</div>
    ```
*   **Inlining**: Using Java variables directly in JavaScript or CSS.
    ```javascript
    const userId = [[${user.id}]];
    ```

---

## 🚀 Common Spring Boot Roadmap
*   **Core**: IoC, DI, Bean Lifecycle.
*   **MVC**: Controllers, ViewResolvers, Form Handling.
*   **Thymeleaf**: SSR, Template Fragments, Layouts.
*   **Data**: Spring Data JPA, MyBatis (SQL Mapping).
*   **Security**: Authentication, Authorization, JWT.
*   **Advanced**: Microservices, Cloud, Performance Tuning.
