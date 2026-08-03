# Phase 4 — Spring Core and Spring Boot

**Level:** Junior → Mid
**Time:** Months 7–10
**Goal:** Understand what Spring is actually doing. Build production-quality REST APIs. Know how to configure Spring correctly — not just copy-paste annotations.

---

## 1. What Spring Is (and Why You Need It)

Without Spring, building a bank API requires you to:
- Manually create and wire every object (AccountService needs AccountRepository needs DataSource...)
- Manage the lifecycle of connections, transactions, caches
- Write HTTP server code, request parsing, JSON serialization
- Handle cross-cutting concerns (logging, security) in every method

Spring is a framework that handles all of this through a central container (the IoC container / ApplicationContext).

---

## 2. IoC — Inversion of Control

### The problem IoC solves
```java
// WITHOUT IoC — tightly coupled, hard to test
public class PaymentService {
    private AccountRepository repo = new AccountRepositoryImpl(
        new DataSource("jdbc:postgresql://...", "user", "pass")
    );  // PaymentService CREATES its own dependencies
    // To test PaymentService, you NEED a real database
}

// WITH IoC — loose coupling, easy to test
public class PaymentService {
    private final AccountRepository repo;  // dependency is GIVEN to us

    public PaymentService(AccountRepository repo) {
        this.repo = repo;  // constructor injection
    }
    // To test, pass a mock AccountRepository — no database needed!
}
```

**Inversion of Control:** instead of YOU creating your dependencies, you let the CONTAINER create them and give them to you.

### Dependency Injection (DI)
DI is how IoC is implemented. Spring creates objects and injects them via:

```java
// 1. Constructor injection (PREFERRED — immutable, testable, explicit)
@Service
public class TransferService {
    private final AccountRepository accountRepo;
    private final TransactionRepository txnRepo;

    // Spring sees this constructor and injects the parameters
    public TransferService(AccountRepository accountRepo,
                           TransactionRepository txnRepo) {
        this.accountRepo = accountRepo;
        this.txnRepo = txnRepo;
    }
}

// 2. Field injection (easy but BAD — can't test without Spring, allows null)
@Service
public class TransferService {
    @Autowired
    private AccountRepository accountRepo;  // Spring sets this via reflection
    // To test, you can't set this without Spring or a special trick
}

// 3. Setter injection (rarely used — allows partial construction)
@Service
public class TransferService {
    private AccountRepository accountRepo;

    @Autowired
    public void setAccountRepo(AccountRepository accountRepo) {
        this.accountRepo = accountRepo;
    }
}
```

**Rule: Always use constructor injection in production code.**

---

## 3. The ApplicationContext (Spring Container)

```
ApplicationContext
  - Reads @Configuration classes and component scan
  - Creates all beans
  - Injects dependencies
  - Manages bean lifecycle
  - Provides beans when requested

Startup:
1. Scan for @Component, @Service, @Repository, @Controller, @Configuration
2. Create BeanDefinitions (blueprint for each bean)
3. Instantiate beans in dependency order
4. Inject dependencies
5. Call @PostConstruct methods
6. Application is ready to serve requests
```

---

## 4. Bean Annotations

| Annotation | What it is | Use for |
|-----------|-----------|---------|
| `@Component` | Generic Spring-managed component | Utility classes |
| `@Service` | Business logic layer | Services, use cases |
| `@Repository` | Data access layer | DAO, JPA repositories |
| `@Controller` | MVC controller | Web layer |
| `@RestController` | Controller + @ResponseBody | REST APIs |
| `@Configuration` | Config class with bean definitions | Manual beans |

```java
@Configuration
public class PaymentConfig {

    @Bean  // Spring manages this object
    public PaymentProcessor visaProcessor() {
        return new VisaProcessor(visaApiKey, visaEndpoint);
    }

    @Bean
    @ConditionalOnProperty("payment.bakong.enabled")  // only if property is true
    public PaymentProcessor bakongProcessor() {
        return new BakongProcessor(bakongApiKey);
    }
}
```

### Bean Scope

| Scope | Lifecycle | Use for |
|-------|-----------|---------|
| `singleton` (default) | One per ApplicationContext | Stateless services |
| `prototype` | New instance every time | Stateful beans |
| `request` | One per HTTP request | Web request context |
| `session` | One per HTTP session | User session data |

```java
@Service
@Scope("singleton")  // default — don't write this unless you need to be explicit
public class AccountService {
    // This class MUST be stateless — singleton is shared across all requests!
    // NEVER store request data in fields of a singleton bean
}
```

**Common mistake — stateful singleton (data leak between requests):**
```java
@Service
public class ReportService {
    private String currentUser;  // WRONG! Shared across all threads

    public Report generateReport(String userId) {
        this.currentUser = userId;  // Thread 1 sets to "HEANG"
        // Thread 2 sets to "OTHER" — now Thread 1 generates report for "OTHER"!
    }
}
```

### Bean Lifecycle
```
1. BeanDefinition read
2. Constructor called
3. Dependencies injected (@Autowired fields, setters)
4. @PostConstruct called (initialize, validate config)
5. Bean is ready
6. ... (application runs) ...
7. @PreDestroy called (close connections, cleanup)
8. Bean destroyed
```

```java
@Service
@RequiredArgsConstructor
public class CacheService {
    private final RedisTemplate<String, Object> redis;
    private final Map<String, Object> localCache = new ConcurrentHashMap<>();

    @PostConstruct
    public void warmUp() {
        // Pre-load frequently accessed exchange rates from DB/Redis
        log.info("Warming up exchange rate cache...");
        loadExchangeRates();
    }

    @PreDestroy
    public void cleanup() {
        log.info("Flushing local cache before shutdown");
        localCache.clear();
    }
}
```

---

## 5. Spring Boot — Auto-Configuration

Spring Boot's value: **zero configuration for common setups.**

```yaml
# application.yml — Spring Boot reads this
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/bankdb
    username: app_user
    password: ${DB_PASSWORD}  # from environment variable — never hardcode

  jpa:
    hibernate:
      ddl-auto: validate    # production: validate schema, never auto-create
    show-sql: false         # production: off (performance + security)

  jackson:
    default-property-inclusion: non_null
    serialization:
      write-dates-as-timestamps: false  # ISO-8601 dates in JSON
```

**How auto-configuration works:**
```
Spring Boot scans META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
For each AutoConfiguration class:
  - Checks @ConditionalOnClass (is this library on classpath?)
  - Checks @ConditionalOnMissingBean (did the user define their own?)
  - If conditions pass: creates default bean

Example: HikariCP
  @ConditionalOnClass(HikariDataSource.class)  → HikariCP is on classpath
  @ConditionalOnMissingBean(DataSource.class)  → user didn't define their own DataSource
  → Spring Boot creates default HikariCP DataSource
```

### Profiles
```yaml
# application.yml — base config
spring:
  profiles:
    active: dev  # default profile

---
# application-dev.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb  # in-memory DB for development
  jpa:
    hibernate.ddl-auto: create-drop

---
# application-prod.yml
spring:
  datasource:
    url: jdbc:postgresql://prod-db.internal:5432/bankdb
  jpa:
    hibernate.ddl-auto: validate
```

```bash
# Run with prod profile
java -jar bank-api.jar --spring.profiles.active=prod
SPRING_PROFILES_ACTIVE=prod java -jar bank-api.jar  # environment variable
```

### Configuration Properties (type-safe config)
```java
// Instead of @Value("${payment.visa.api-key}") everywhere
@ConfigurationProperties(prefix = "payment.visa")
@Component
@Validated
public class VisaConfig {

    @NotBlank
    private String apiKey;

    @NotBlank
    private String endpoint;

    @Min(1) @Max(60)
    private int timeoutSeconds = 30;

    // getters and setters (or use Lombok @Data)
}

// application.yml
// payment:
//   visa:
//     api-key: ${VISA_API_KEY}
//     endpoint: https://api.visa.com/v2
//     timeout-seconds: 15
```

---

## 6. Spring MVC — REST API

### Request Flow
```
HTTP Request
    ↓
DispatcherServlet (Front Controller — Spring's entry point)
    ↓
HandlerMapping (finds which @RequestMapping matches)
    ↓
HandlerAdapter (calls the controller method)
    ↓
@RestController method
    ↓
HttpMessageConverter (converts return value to JSON)
    ↓
HTTP Response
```

### Controller Structure

```java
@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
@Slf4j
public class AccountController {

    private final AccountService accountService;

    @GetMapping("/{id}")
    public ResponseEntity<AccountResponse> getAccount(@PathVariable String id) {
        AccountResponse account = accountService.findById(id);
        return ResponseEntity.ok(account);
    }

    @GetMapping
    public ResponseEntity<PagedResponse<AccountResponse>> listAccounts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(accountService.findAll(page, size, status));
    }

    @PostMapping
    public ResponseEntity<AccountResponse> createAccount(
            @Valid @RequestBody CreateAccountRequest request) {
        AccountResponse created = accountService.create(request);
        URI location = URI.create("/api/v1/accounts/" + created.getId());
        return ResponseEntity.created(location).body(created);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<AccountResponse> updateAccount(
            @PathVariable String id,
            @Valid @RequestBody UpdateAccountRequest request) {
        return ResponseEntity.ok(accountService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable String id) {
        accountService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### Request/Response DTOs

```java
// Request — what client sends
@Data
@NoArgsConstructor
public class CreateAccountRequest {

    @NotBlank(message = "Customer ID is required")
    private String customerId;

    @NotNull(message = "Account type is required")
    @Pattern(regexp = "SAVINGS|CHECKING|FIXED", message = "Invalid account type")
    private String type;

    @NotNull
    @DecimalMin(value = "0.00", message = "Initial deposit cannot be negative")
    private BigDecimal initialDeposit;

    @NotBlank
    @Size(min = 3, max = 3, message = "Currency must be 3 letters (e.g. USD, KHR)")
    private String currency;
}

// Response — what you send back (never expose entity directly!)
@Data
@Builder
public class AccountResponse {
    private String id;
    private String accountNumber;
    private String type;
    private BigDecimal balance;
    private String currency;
    private String status;
    private String ownerName;
    private LocalDateTime createdAt;
    // NOT including: customerId foreign key, internal DB fields
}
```

### Validation

```java
// Spring picks up @Valid and runs Bean Validation (Hibernate Validator)
// Custom validator
@Constraint(validatedBy = ValidCurrencyValidator.class)
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidCurrency {
    String message() default "Invalid currency code";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class ValidCurrencyValidator implements ConstraintValidator<ValidCurrency, String> {
    private static final Set<String> SUPPORTED = Set.of("USD", "KHR", "THB", "VND");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value != null && SUPPORTED.contains(value.toUpperCase());
    }
}
```

### Global Exception Handling

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(AccountNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(AccountNotFoundException ex) {
        log.warn("Account not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse.of("ACCOUNT_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(InsufficientFundsException.class)
    public ResponseEntity<ErrorResponse> handleInsufficient(InsufficientFundsException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
            .body(ErrorResponse.of("INSUFFICIENT_FUNDS", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
            .collect(Collectors.toList());
        return ResponseEntity.badRequest()
            .body(ErrorResponse.of("VALIDATION_FAILED", String.join("; ", errors)));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        log.error("Unexpected error", ex);  // log full stack trace
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse.of("INTERNAL_ERROR", "An unexpected error occurred"));
        // NEVER expose exception details to the client in production
    }
}

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorResponse {
    private String code;
    private String message;
    private Instant timestamp = Instant.now();

    public static ErrorResponse of(String code, String message) {
        ErrorResponse r = new ErrorResponse();
        r.code = code;
        r.message = message;
        return r;
    }
}
```

---

## 7. REST API Best Practices

### HTTP Status Codes (use them correctly)

| Status | When to use |
|--------|------------|
| `200 OK` | Successful GET, PUT, PATCH |
| `201 Created` | Successful POST that created a resource |
| `204 No Content` | Successful DELETE |
| `400 Bad Request` | Validation failed, malformed request |
| `401 Unauthorized` | No valid token |
| `403 Forbidden` | Token valid but insufficient permission |
| `404 Not Found` | Resource doesn't exist |
| `409 Conflict` | Duplicate resource, state conflict |
| `422 Unprocessable Entity` | Semantically invalid (correct format, wrong business rule) |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Server bug |

### Idempotency (critical for payments)
```java
// POST /api/v1/transfers — must be idempotent
// If the client sends the same request twice (timeout + retry), only ONE transfer happens

@PostMapping("/transfers")
public ResponseEntity<TransferResponse> transfer(
        @RequestHeader("Idempotency-Key") String idempotencyKey,  // client-generated UUID
        @Valid @RequestBody TransferRequest request) {

    // Check if this key was already processed
    Optional<TransferResponse> cached = idempotencyStore.get(idempotencyKey);
    if (cached.isPresent()) {
        return ResponseEntity.ok(cached.get());  // return same result as before
    }

    // Process
    TransferResponse result = transferService.execute(request);

    // Store result for future duplicate requests
    idempotencyStore.put(idempotencyKey, result, Duration.ofHours(24));

    return ResponseEntity.status(HttpStatus.CREATED).body(result);
}
```

### Versioning
```java
// URL versioning (most common, easiest for clients)
@RequestMapping("/api/v1/accounts")
@RequestMapping("/api/v2/accounts")

// Header versioning (cleaner URLs, harder to test in browser)
@GetMapping(headers = "API-Version=1")
@GetMapping(headers = "API-Version=2")
```

---

## 8. AOP — Aspect-Oriented Programming

### Why it exists
Logging, auditing, timing, security checks appear in EVERY service method. AOP lets you write this once and apply it everywhere.

```java
// Without AOP — repeated in every method
public TransferResult transfer(String from, String to, BigDecimal amount) {
    log.info("Transfer started: from={}, amount={}", from, amount);
    long start = System.currentTimeMillis();
    try {
        // actual logic...
        log.info("Transfer completed in {}ms", System.currentTimeMillis() - start);
        return result;
    } catch (Exception e) {
        log.error("Transfer failed", e);
        throw e;
    }
}

// With AOP — define once, apply everywhere
@Aspect
@Component
@Slf4j
public class PerformanceAspect {

    @Around("@annotation(Monitored) || execution(* com.bank.service.*.*(..))")
    public Object measureTime(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.nanoTime();
        String method = pjp.getSignature().toShortString();
        try {
            Object result = pjp.proceed();  // call the actual method
            log.info("{} completed in {}ms", method, (System.nanoTime() - start) / 1_000_000);
            return result;
        } catch (Exception e) {
            log.error("{} failed after {}ms", method, (System.nanoTime() - start) / 1_000_000, e);
            throw e;
        }
    }
}

// AOP pointcut types:
// @Before — runs before the method
// @After — runs after (always, even if exception)
// @AfterReturning — runs after successful return
// @AfterThrowing — runs after exception
// @Around — wraps the method (most powerful — can skip the call!)
```

**How @Transactional uses AOP:** Spring creates a proxy around your @Service class. The proxy opens a transaction before the method, commits on success, or rolls back on exception. This is why self-invocation breaks @Transactional.

---

## 9. Mini Project — Phase 4

**Build a complete banking REST API with Spring Boot:**

```
POST   /api/v1/customers              — create customer
GET    /api/v1/customers/{id}         — get customer
POST   /api/v1/accounts              — open account (validated)
GET    /api/v1/accounts/{id}         — get account with balance
GET    /api/v1/accounts?customerId=X  — list accounts with pagination
POST   /api/v1/accounts/{id}/deposit  — deposit (idempotency key required)
POST   /api/v1/accounts/{id}/withdraw — withdraw (idempotency key required)
POST   /api/v1/transfers              — transfer (idempotency key required)
GET    /api/v1/accounts/{id}/transactions  — transaction history with filter/sort
```

Requirements:
- All money in BigDecimal
- Proper HTTP status codes for all error cases
- @Valid on all request bodies
- Global exception handler
- Idempotency on all write operations
- @Transactional on transfer (all-or-nothing)
- Unit tests: MockMvc for controllers, Mockito for services
- Integration test: one end-to-end transfer test with H2

---

## 10. Interview Questions — Phase 4

1. What is the difference between IoC and DI? How does Spring implement them?
2. Why is constructor injection preferred over field injection?
3. What is the difference between @Component, @Service, @Repository, @Controller?
4. What happens if you have two beans of the same type — how does Spring choose?
5. What is @Autowired? Does Spring always require it?
6. What is singleton scope? What is a common mistake with stateful singletons?
7. What is Spring Boot auto-configuration? How does @ConditionalOnMissingBean work?
8. What is @Transactional? How does it work internally (proxy mechanism)?
9. Why does @Transactional break when you call another @Transactional method on the same class?
10. What is AOP? What problem does it solve?
11. What HTTP status code do you return for: resource not found / validation failure / payment declined?
12. What is idempotency? Why is it critical for payment APIs?

---

## References

- Spring Framework Docs: https://docs.spring.io/spring-framework/docs/current/reference/html/
- Spring Boot Docs: https://docs.spring.io/spring-boot/docs/current/reference/html/
- Baeldung Spring: https://www.baeldung.com/spring-tutorial
- Spring in Action (Walls) — Ch 1-8
- Martin Fowler on DI: https://martinfowler.com/articles/injection.html
- REST API Design Rulebook (Masse) — REST best practices
- GitHub: spring-petclinic (canonical Spring Boot reference)
