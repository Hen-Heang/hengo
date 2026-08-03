# ?? JSP and JSTL Notes

[<- Back to root](../README.md)

## ?? Purpose

JSP renders HTML on the server, and JSTL keeps templates clean by replacing scriptlets with tags.

## ?? Page Setup

```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
```

## ?? Core JSTL Tags (`c:`)

### Output (`<c:out>`)

```jsp
<c:out value="${user.username}"/>
```

### Conditional (`<c:if>`)

```jsp
<c:if test="${user.status == 'ACTIVE'}">
  <span class="badge-active">Active</span>
</c:if>
```

### Branching (`<c:choose>`)

```jsp
<c:choose>
  <c:when test="${user.status == 'ACTIVE'}">Active</c:when>
  <c:when test="${user.status == 'INACTIVE'}">Inactive</c:when>
  <c:otherwise>Unknown</c:otherwise>
</c:choose>
```

### Loop (`<c:forEach>`)

```jsp
<c:forEach var="user" items="${users}" varStatus="s">
  <tr>
    <td>${s.count}</td>
    <td><c:out value="${user.username}"/></td>
    <td><c:out value="${user.email}"/></td>
  </tr>
</c:forEach>
```

### URL (`<c:url>`) and Redirect (`<c:redirect>`)

```jsp
<a href="<c:url value='/users/${user.id}'/>">View</a>
<c:redirect url="/login"/>
```

## ?? Expression Language (EL)

```jsp
${user.username}
${empty users}
${not empty users}
${user.status == 'ACTIVE' ? 'Yes' : 'No'}
```

## ?? Formatting (`fmt:`)

```jsp
<fmt:formatDate value="${user.createdAt}" pattern="yyyy-MM-dd HH:mm"/>
<fmt:formatNumber value="${amount}" pattern="#,###"/>
```

## ?? Controller to JSP Data Flow

```java
@Controller
public class ViewController {

  @GetMapping("/user-list")
  public String userList(Model model) {
    List<UserResponse> users = userService.getAll();
    model.addAttribute("users", users);
    model.addAttribute("total", users.size());
    return "user-list";
  }
}
```

```jsp
<p>Total users: ${total}</p>
<c:forEach var="user" items="${users}">
  <p><c:out value="${user.username}"/></p>
</c:forEach>
```

## ?? Common Mistakes

| Mistake | Better approach |
| --- | --- |
| Printing user input with raw `${...}` | Use `<c:out>` for escaping |
| Missing `taglib` directives | Declare required JSTL tags at top |
| Wrong charset | Always use UTF-8 in page directive |
| Too much logic in JSP | Keep business logic in service/controller |

## ? Quick Practice Rules

- Prefer JSTL + EL over Java scriptlets.
- Keep JSP focused on display only.
- Escape user-generated content with `<c:out>`.
- Keep date/number format consistent with `fmt` tags.
