# Java & Spring Concepts Used in This Project

A reference guide for Java and Spring features actively used in this codebase.

---

## Java Language Features

### OOP (Object-Oriented Programming)
- **Interfaces** — all MyBatis mappers and Spring services use interfaces
- **Inheritance** — `BusinessException extends RuntimeException`
- **Implements** — services implement interfaces for loose coupling

### Annotations
| Category | Examples |
|---|---|
| Lombok | `@Builder`, `@Getter`, `@Setter`, `@Slf4j`, `@RequiredArgsConstructor`, `@AllArgsConstructor` |
| Spring | `@Service`, `@RestController`, `@Transactional`, `@Value`, `@Async`, `@Scheduled` |
| Spring Web | `@GetMapping`, `@PostMapping`, `@RequestBody`, `@PathVariable`, `@RequestParam` |
| MyBatis | `@Mapper`, `@Param` |
| Jackson | `@JsonInclude`, `@JsonProperty` |

### Generics
```java
// Generic API wrapper
public class ApiResponse<T> { ... }

// Generic AI result
public record StructuredAiResult<T>(T value, OpenAiResult meta) { ... }

// Generic method
private <T> List<T> parseList(String json, Class<T> type) { ... }
```

### Collections
- `List`, `Map`, `Set`, `ArrayList` used throughout services and DTOs

### Stream API
```java
// Standard transformation pattern
list.stream()
    .filter(x -> x.isActive())
    .map(UserResponse::of)
    .toList();

// Chaining
stream.flatMap(...).findFirst().orElseThrow();
```

### Optional
```java
userMapper.findById(id)
    .orElseThrow(() -> new BusinessException(Code.NOT_FOUND));

optional.ifPresent(user -> doSomething(user));
optional.orElseGet(() -> defaultValue);
```

### Exception Handling
- Custom exception: `BusinessException extends RuntimeException`
- Global handler: `GlobalExceptionHandler` with `@ExceptionHandler` per exception type
- `try/catch` for JSON parsing and AI streaming errors

### Functional Interfaces & Lambdas
```java
// Consumer used as callback
Consumer<String> onToken = token -> sseEmitter.send(token);

// Lambda in stream
list.stream().map(item -> item.getName()).toList();
```

### Builder Pattern (via Lombok)
```java
User user = User.builder()
    .email(email)
    .name(name)
    .build();
```

### Records (Java 16+)
```java
// Lightweight DTO
public record ApiStatus(int code, String message) {}

// Private inner record in a service
private record ChatTurn(Message userMessage, String prompt, String modelUsed) {}
```

### Text Blocks (Java 15+)
```java
String prompt = """
    You are a Korean language tutor.
    User level: %s
    Respond in: %s
    """.formatted(level, language);
```

### Async / Multithreading
```java
// Fire-and-forget background task
CompletableFuture.runAsync(() -> {
    openAiService.generateStream(prompt, model, token -> emitter.send(token));
});
```
- `AsyncConfig.java` configures a `ThreadPoolTaskExecutor` (2 core / 5 max threads)
- `@EnableAsync` enables Spring's async support

---

## Spring Concepts

### Dependency Injection
- `@Autowired` or constructor injection (preferred with `@RequiredArgsConstructor`)
- Spring manages all `@Service`, `@Repository`, `@Component`, `@Controller` beans

### Request Handling
```java
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @PostMapping
    public ResponseEntity<ApiResponse<ChatResponse>> chat(@RequestBody ChatRequest req) { ... }
}
```

### Transaction Management
- `@Transactional` on service methods ensures DB operations roll back on error

### Configuration
- `@Configuration` + `@Bean` for custom beans (e.g. thread pool, OpenAI client)
- `@Value("${property.key}")` to inject values from `application.yaml`

### Exception Handling
```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<?>> handle(BusinessException ex) { ... }
}
```

---

## Learning Priority Order

1. **Annotations** — Spring runs entirely on them; learn the common ones first
2. **OOP** — interfaces, inheritance, implements
3. **Generics** — needed to read `ApiResponse<T>`, `List<T>`, etc.
4. **Collections** — `List`, `Map`, everyday use
5. **Stream API + Optional** — used in almost every service method
6. **Exception handling** — `BusinessException` + `GlobalExceptionHandler` pattern
7. **Builder pattern** — Lombok `@Builder` is everywhere
8. **Async + CompletableFuture** — for AI streaming and background tasks
9. **Records + Text blocks** — Java 16/15+ features used for DTOs and prompts

---

## Not Used in This Project
- Sealed classes
- Pattern matching switch
- Virtual threads (Java 21)
