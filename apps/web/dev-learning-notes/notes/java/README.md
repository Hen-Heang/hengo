# ☕ Java for Spring Boot Developers

> **Goal:** Every concept here is something you will use directly inside a Spring Boot project.
> Learn the *why*, not just the syntax.

---

## 📌 Table of Contents

1. [JVM & Memory Model](#1-jvm--memory-model)
2. [OOP — The 4 Pillars](#2-oop--the-4-pillars)
3. [Collections Framework](#3-collections-framework)
4. [Exception Handling](#4-exception-handling)
5. [Generics & Type Safety](#5-generics--type-safety)
6. [Functional Programming — Java 8+](#6-functional-programming--java-8)
7. [Annotations & Reflection](#7-annotations--reflection)
8. [Concurrency & Async](#8-concurrency--async)
9. [Design Patterns in Spring](#9-design-patterns-in-spring)
10. [Lombok — Reduce Boilerplate](#10-lombok--reduce-boilerplate)
11. [String Essentials](#11-string-essentials)

---

## 1. JVM & Memory Model

### JVM vs JRE vs JDK
| Term | What It Is | When You Use It |
|------|-----------|-----------------|
| **JDK** | Java Development Kit — compiler + JRE | Writing and compiling code |
| **JRE** | Java Runtime Environment — runs `.class` files | Running a compiled app |
| **JVM** | Java Virtual Machine — executes bytecode | Invisible; runs inside JRE |

### Stack vs Heap — Why It Matters
```
STACK (per thread)          HEAP (shared)
─────────────────           ──────────────────────────────
main() frame                @Service UserService bean     ← Singleton — lives forever
  id = 42                   @RequestScope RequestData     ← Created per HTTP request
  user → ───────────────────► User { id=42, name="Kim" }
```

- **Stack** → method calls, local variables, references. Fast, auto-freed when method returns.
- **Heap** → all objects (`new User()`). Managed by the Garbage Collector (GC).
- **String Pool** → a special heap area. `"hello" == "hello"` is `true`; `new String("hello") == new String("hello")` is `false`.

```java
// Primitives live on the stack
int id = 42;          // stack — value directly stored
long price = 1000L;

// Objects live on the heap; reference lives on the stack
String name = "Kim";            // reference on stack → String object in String Pool
User user = new User(42, "Kim"); // reference on stack → User object on Heap
```

### Autoboxing — Primitives ↔ Wrapper Classes
```java
// Java auto-converts primitives to their wrapper objects
int     → Integer
long    → Long
boolean → Boolean
double  → Double

List<Integer> ids = new ArrayList<>();
ids.add(1);   // autoboxing: int → Integer
int first = ids.get(0);  // unboxing: Integer → int

// ⚠️ Trap: null unboxing throws NullPointerException
Integer value = null;
int x = value;  // NullPointerException!
```

---

## 2. OOP — The 4 Pillars

### Encapsulation — Hide the data
```java
// BAD — public fields, anyone can modify
public class User {
    public Long id;
    public String password;  // exposed!
}

// GOOD — private fields, controlled access
public class User {
    private Long id;
    private String hashedPassword;

    public Long getId() { return id; }
    // No setter for password — force use of changePassword()
    public void changePassword(String raw) {
        this.hashedPassword = BCrypt.hash(raw);
    }
}
```

### Inheritance — Reuse & Extend
```java
// BaseEntity holds audit fields — extend in every entity
@MappedSuperclass
public abstract class BaseEntity {
    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;
}

@Entity
public class User extends BaseEntity {   // inherits createdAt, updatedAt
    @Id
    private Long id;
    private String username;
}
```

### Polymorphism — Code to the Interface
```java
// Define the contract
public interface NotificationService {
    void send(String to, String message);
}

// Two implementations — Spring will inject the right one
@Service("emailNotification")
public class EmailNotificationService implements NotificationService {
    public void send(String to, String message) { /* send email */ }
}

@Service("smsNotification")
public class SmsNotificationService implements NotificationService {
    public void send(String to, String message) { /* send SMS */ }
}

// The caller does NOT know which implementation it has
@Service
public class OrderService {
    private final NotificationService notificationService;

    // Spring injects the correct one based on @Qualifier or @Primary
    public OrderService(@Qualifier("emailNotification") NotificationService svc) {
        this.notificationService = svc;
    }
}
```

### Abstraction — Abstract Classes vs Interfaces
```java
// Abstract class: partial implementation, share code across subclasses
public abstract class BaseMapper<T> {
    protected abstract String getTableName();

    public String buildSelectQuery() {
        return "SELECT * FROM " + getTableName();  // reused by all subclasses
    }
}

// Interface: pure contract, multiple implementations allowed
public interface Searchable {
    List<?> search(String keyword);
}

// A class can implement many interfaces but extend only one class
public class UserMapper extends BaseMapper<User> implements Searchable {
    protected String getTableName() { return "users"; }
    public List<User> search(String keyword) { /* ... */ }
}
```

---

## 3. Collections Framework

### Choosing the Right Collection
| Collection | Use When | Notes |
|-----------|---------|-------|
| `ArrayList` | Read-heavy, index access | Default choice for lists |
| `LinkedList` | Many inserts/deletes in middle | Rare in Spring code |
| `HashMap` | Fast key-value lookup | Most common Map |
| `LinkedHashMap` | Need insertion order | Config maps, ordered JSON |
| `TreeMap` | Need sorted keys | Reports, ordered output |
| `HashSet` | Uniqueness check, no order | JPA One-to-Many |
| `LinkedHashSet` | Unique + preserve order | Dedup while keeping order |
| `ArrayDeque` | Stack or Queue operations | Replaces `Stack` class |

### ArrayList — Most Common
```java
List<UserResponse> users = new ArrayList<>();
users.add(new UserResponse(1L, "Kim"));
users.add(new UserResponse(2L, "Lee"));

// Access
users.get(0);           // O(1) — direct index access
users.size();           // 2
users.contains(user);   // O(n) — linear scan
users.remove(0);        // remove by index

// Sort
users.sort(Comparator.comparing(UserResponse::getUsername));

// Immutable list (Java 9+) — cannot add/remove
List<String> roles = List.of("ADMIN", "USER", "VIEWER");
```

### HashMap — Key-Value Store
```java
Map<Long, UserResponse> userCache = new HashMap<>();
userCache.put(1L, user1);
userCache.put(2L, user2);

userCache.get(1L);                  // O(1) lookup
userCache.containsKey(99L);         // false
userCache.getOrDefault(99L, null);  // safe get

// Iterate
for (Map.Entry<Long, UserResponse> entry : userCache.entrySet()) {
    System.out.println(entry.getKey() + " → " + entry.getValue().getUsername());
}

// Merge / compute
userCache.putIfAbsent(3L, newUser);
userCache.computeIfAbsent(4L, id -> fetchFromDb(id));

// Group by — very common in service layer
Map<String, List<User>> byDepartment = users.stream()
    .collect(Collectors.groupingBy(User::getDepartment));
```

### HashSet — Unique Elements
```java
// JPA: use Set for @OneToMany to avoid duplicate join rows
@OneToMany(mappedBy = "user")
private Set<Order> orders = new HashSet<>();  // NOT List<Order>

// Dedup a list
List<String> withDupes = List.of("A", "B", "A", "C");
Set<String> unique = new HashSet<>(withDupes);   // {A, B, C}
List<String> deduped = new ArrayList<>(unique);
```

---

## 4. Exception Handling

### Checked vs Unchecked
```java
// Checked — compiler forces you to handle it (IOException, SQLException)
try {
    Files.readString(Path.of("config.txt"));
} catch (IOException e) {
    throw new RuntimeException("Config read failed", e);  // wrap and re-throw
}

// Unchecked — RuntimeException, NO forced handling
// Spring prefers unchecked so service methods stay clean
public User findById(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new UserNotFoundException(id));  // unchecked, no try-catch needed
}
```

### Custom Exceptions — The Spring Pattern
```java
// 1. Define your exception
public class UserNotFoundException extends RuntimeException {
    private final Long userId;

    public UserNotFoundException(Long userId) {
        super("User not found with id: " + userId);
        this.userId = userId;
    }

    public Long getUserId() { return userId; }
}

public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException(String email) {
        super("Email already registered: " + email);
    }
}
```

### Global Error Handler — @ControllerAdvice
```java
// 2. One class handles ALL exceptions for the whole app
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Handle specific exception → return proper HTTP status
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(UserNotFoundException ex) {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(404, ex.getMessage()));
    }

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ErrorResponse> handleDuplicate(DuplicateEmailException ex) {
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(new ErrorResponse(409, ex.getMessage()));
    }

    // Catch-all for unexpected errors
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAll(Exception ex) {
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse(500, "Internal server error"));
    }
}

// 3. Error response DTO
public record ErrorResponse(int status, String message) {}
```

### try-with-resources — Auto-close DB Connections
```java
// Without try-with-resources — manual close, easy to forget
Connection conn = dataSource.getConnection();
try {
    // use connection
} finally {
    conn.close();  // must not forget!
}

// With try-with-resources — auto-closes anything implementing AutoCloseable
try (Connection conn = dataSource.getConnection();
     PreparedStatement ps = conn.prepareStatement(sql)) {
    ps.executeQuery();
}  // conn and ps are automatically closed here, even if exception is thrown
```

---

## 5. Generics & Type Safety

### Why Generics?
```java
// Without generics — runtime ClassCastException danger
List list = new ArrayList();
list.add("hello");
list.add(42);          // compiles! 😱
String s = (String) list.get(1);  // ClassCastException at runtime

// With generics — compile-time safety
List<String> strings = new ArrayList<>();
strings.add("hello");
// strings.add(42);   // compile error — caught immediately
String s = strings.get(0);  // no cast needed
```

### Generic Classes & Methods
```java
// Generic class — T is a placeholder for any type
public class ApiResponse<T> {
    private int status;
    private String message;
    private T data;          // T becomes the actual type when used

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, "OK", data);
    }
    public static <T> ApiResponse<T> error(int status, String msg) {
        return new ApiResponse<>(status, msg, null);
    }
}

// Usage — T is replaced by the actual type
ApiResponse<UserResponse> response = ApiResponse.success(user);
ApiResponse<List<OrderDTO>> orders = ApiResponse.success(orderList);
```

### Bounded Type Parameters
```java
// <T extends Number> — T must be a Number or its subclass
public <T extends Number> double sum(List<T> numbers) {
    return numbers.stream().mapToDouble(Number::doubleValue).sum();
}

sum(List.of(1, 2, 3));         // Integer extends Number ✓
sum(List.of(1.5, 2.5));        // Double extends Number ✓
// sum(List.of("a", "b"));     // compile error ✓
```

### Spring Patterns with Generics
```java
// JpaRepository<Entity, PrimaryKeyType> — generic CRUD for free
public interface UserRepository extends JpaRepository<User, Long> {
    // Spring generates: findById, findAll, save, delete, etc.
    Optional<User> findByEmail(String email);
}

// ResponseEntity<T> — type-safe HTTP response
@GetMapping("/{id}")
public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
    UserResponse user = userService.findById(id);
    return ResponseEntity.ok(user);  // 200 OK with body
}

@PostMapping
public ResponseEntity<UserResponse> create(@RequestBody CreateUserRequest req) {
    UserResponse created = userService.create(req);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);  // 201 Created
}

// Optional<T> — never return null from repository
public UserResponse findById(Long id) {
    return userRepository.findById(id)              // returns Optional<User>
        .map(user -> new UserResponse(user))        // transform if present
        .orElseThrow(() -> new UserNotFoundException(id));  // throw if empty
}
```

---

## 6. Functional Programming — Java 8+

### Functional Interfaces
```java
// Java provides these built-in functional interfaces
Predicate<User>        test(User u) → boolean    // filter
Function<User, String> apply(User u) → String    // transform/map
Supplier<User>         get() → User              // create/provide
Consumer<User>         accept(User u) → void     // process/side-effect
```

### Lambdas — Short Anonymous Functions
```java
// Before Java 8 — verbose anonymous class
Comparator<User> comp = new Comparator<User>() {
    @Override
    public int compare(User a, User b) {
        return a.getUsername().compareTo(b.getUsername());
    }
};

// Java 8 lambda — same thing in 1 line
Comparator<User> comp = (a, b) -> a.getUsername().compareTo(b.getUsername());

// Method reference — even shorter when the lambda just delegates
Comparator<User> comp = Comparator.comparing(User::getUsername);

// Examples
list.forEach(user -> System.out.println(user.getUsername()));
list.forEach(System.out::println);               // method reference
list.removeIf(user -> !user.isActive());
```

### Stream API — The Core Operations
```java
List<User> users = userRepository.findAll();

// --- INTERMEDIATE operations (lazy, return Stream) ---

.filter(user -> user.isActive())                  // keep matching
.map(user -> new UserDTO(user))                   // transform each element
.map(User::getEmail)                              // method ref shorthand
.sorted(Comparator.comparing(User::getUsername))  // sort
.distinct()                                       // remove duplicates
.limit(10)                                        // take first 10
.skip(5)                                          // skip first 5
.peek(u -> log.info("Processing: {}", u.getId())) // debug/side-effect

// --- TERMINAL operations (trigger execution, return result) ---

.collect(Collectors.toList())                     // → List
.collect(Collectors.toSet())                      // → Set
.collect(Collectors.joining(", "))                // → "Kim, Lee, Park"
.toList()                                         // → immutable List (Java 16+)
.count()                                          // → long
.findFirst()                                      // → Optional<T>
.anyMatch(u -> "ADMIN".equals(u.getRole()))       // → boolean
.allMatch(User::isActive)                         // → boolean
.min(Comparator.comparing(User::getCreatedAt))    // → Optional<T>
.reduce(0, (sum, u) -> sum + u.getPoints(), Integer::sum)
```

### Real Service Layer Examples
```java
@Service
public class UserService {

    // Convert entity list to DTO list
    public List<UserResponse> getAll() {
        return userRepository.findAll()
            .stream()
            .map(UserResponse::new)    // constructor ref: new UserResponse(user)
            .toList();
    }

    // Filter active users with ADMIN role
    public List<UserResponse> getAdmins() {
        return userRepository.findAll().stream()
            .filter(User::isActive)
            .filter(u -> "ADMIN".equals(u.getRole()))
            .map(UserResponse::new)
            .toList();
    }

    // Group users by department
    public Map<String, List<UserResponse>> getByDepartment() {
        return userRepository.findAll().stream()
            .map(UserResponse::new)
            .collect(Collectors.groupingBy(UserResponse::getDepartment));
    }

    // Get emails as comma-separated string
    public String getAllEmails() {
        return userRepository.findAll().stream()
            .map(User::getEmail)
            .collect(Collectors.joining(", "));
    }

    // flatMap — flatten nested collections
    public List<String> getAllPermissions() {
        return userRepository.findAll().stream()
            .flatMap(user -> user.getRoles().stream())    // Stream<List<Role>> → Stream<Role>
            .flatMap(role -> role.getPermissions().stream())
            .distinct()
            .toList();
    }
}
```

### Optional — Null Safety
```java
// DON'T return null — use Optional
public Optional<User> findByEmail(String email) {
    return userRepository.findByEmail(email);  // Spring Data returns Optional
}

// Caller handles it explicitly — no silent NullPointerException
Optional<User> opt = userService.findByEmail("kim@test.com");

opt.isPresent()                           // check if value exists
opt.isEmpty()                             // check if empty (Java 11+)
opt.get()                                 // ⚠️ throws if empty — avoid
opt.orElse(defaultUser)                   // return default if empty
opt.orElseGet(() -> fetchFromCache())     // lazy default — only called if empty
opt.orElseThrow(() -> new NotFoundException("kim@test.com"))  // throw custom exception
opt.map(User::getUsername)                // transform value if present → Optional<String>
opt.filter(u -> u.isActive())            // filter → empty Optional if condition false
opt.ifPresent(user -> sendEmail(user))   // side-effect only if present
opt.ifPresentOrElse(
    user -> log.info("Found: {}", user.getId()),
    () -> log.warn("User not found")
);
```

---

## 7. Annotations & Reflection

### How Spring Reads Your Annotations
Spring uses **Java Reflection** at startup to:
1. Scan classpath for classes annotated with `@Component`, `@Service`, etc.
2. Create an instance (bean) of each and store it in the `ApplicationContext`.
3. Find `@Autowired` fields/constructors and inject the right bean.
4. Wrap `@Transactional` methods in a Proxy that manages the transaction.

```java
// What Spring does internally (simplified)
for (Class<?> clazz : getScannedClasses()) {
    if (clazz.isAnnotationPresent(Service.class)) {
        Object bean = clazz.getDeclaredConstructor().newInstance();
        applicationContext.registerBean(bean);
    }
}
```

### Custom Annotation — Real Use Case
```java
// 1. Define the annotation
@Retention(RetentionPolicy.RUNTIME)   // visible at runtime — required for reflection
@Target(ElementType.METHOD)           // only valid on methods
public @interface RequiresRole {
    String value();                   // attribute: @RequiresRole("ADMIN")
}

// 2. Use it
@RestController
public class AdminController {
    @GetMapping("/admin/users")
    @RequiresRole("ADMIN")
    public List<UserResponse> getAllUsers() { /* ... */ }
}

// 3. Read it via AOP (Spring reads @RequiresRole and enforces it)
@Aspect
@Component
public class RoleCheckAspect {
    @Before("@annotation(requiresRole)")
    public void checkRole(JoinPoint jp, RequiresRole requiresRole) {
        String requiredRole = requiresRole.value();
        // check if current user has the role, throw 403 if not
        if (!currentUser.hasRole(requiredRole)) {
            throw new AccessDeniedException("Role required: " + requiredRole);
        }
    }
}
```

### The @Transactional Self-Invocation Bug
```java
@Service
public class OrderService {

    // ❌ BROKEN — calling transactional method from within the same class
    public void processOrder(Long id) {
        this.createInvoice(id);   // bypasses the Proxy → no transaction!
    }

    @Transactional
    public void createInvoice(Long id) {
        // DB operations here — NOT wrapped in transaction because
        // the Proxy is only used for external calls
    }
}

// ✅ FIX 1 — inject self (ugly but works)
@Service
public class OrderService {
    @Autowired
    private OrderService self;  // Spring injects the Proxy, not 'this'

    public void processOrder(Long id) {
        self.createInvoice(id);  // goes through Proxy → transaction works
    }
}

// ✅ FIX 2 — extract to a separate service (cleaner)
@Service
public class InvoiceService {
    @Transactional
    public void createInvoice(Long id) { /* ... */ }
}
```

---

## 8. Concurrency & Async

### @Async — Run in Background Thread
```java
// 1. Enable async in your config
@SpringBootApplication
@EnableAsync
public class Application { }

// 2. Mark method as async — runs on a separate thread pool
@Service
public class EmailService {

    @Async
    public void sendWelcomeEmail(String to) {
        // This runs in a background thread — the caller is not blocked
        emailSender.send(new Email(to, "Welcome!", template));
    }

    // Return a future if caller needs the result
    @Async
    public CompletableFuture<Boolean> sendAndConfirm(String to) {
        emailSender.send(new Email(to, "Welcome!", template));
        return CompletableFuture.completedFuture(true);
    }
}

// 3. Caller returns immediately — email sends in background
@PostMapping("/register")
public ResponseEntity<UserResponse> register(@RequestBody CreateUserRequest req) {
    UserResponse user = userService.create(req);
    emailService.sendWelcomeEmail(user.getEmail());  // non-blocking!
    return ResponseEntity.status(201).body(user);
}
```

### CompletableFuture — Parallel Calls
```java
@Service
public class DashboardService {

    // Call 3 external APIs in parallel — saves time
    public DashboardData getDashboard(Long userId) {
        CompletableFuture<UserProfile> profileFuture =
            CompletableFuture.supplyAsync(() -> profileApi.get(userId));

        CompletableFuture<List<Order>> ordersFuture =
            CompletableFuture.supplyAsync(() -> orderApi.getByUser(userId));

        CompletableFuture<List<Notification>> notifFuture =
            CompletableFuture.supplyAsync(() -> notifApi.getByUser(userId));

        // Wait for all 3 to complete
        CompletableFuture.allOf(profileFuture, ordersFuture, notifFuture).join();

        return new DashboardData(
            profileFuture.join(),   // get result (already done)
            ordersFuture.join(),
            notifFuture.join()
        );
    }
}
```

### Virtual Threads — Java 21 + Spring Boot 3.2
```java
# application.properties
spring.threads.virtual.enabled=true   # that's it — Tomcat uses virtual threads

# What this means:
# - Each HTTP request gets a lightweight virtual thread (not a platform thread)
# - You can have millions of concurrent requests
# - Blocking I/O (DB queries, HTTP calls) no longer blocks a platform thread
# - No need to change your code — just enable the flag
```

---

## 9. Design Patterns in Spring

### Strategy Pattern — Swappable Implementations
```java
// Define the strategy interface
public interface PaymentProcessor {
    PaymentResult process(PaymentRequest req);
}

// Multiple strategies
@Service("kakaoPay")
public class KakaoPayProcessor implements PaymentProcessor { /* ... */ }

@Service("naverPay")
public class NaverPayProcessor implements PaymentProcessor { /* ... */ }

@Service("creditCard")
public class CreditCardProcessor implements PaymentProcessor { /* ... */ }

// Spring injects ALL implementations into a Map — key = bean name
@Service
public class PaymentService {
    private final Map<String, PaymentProcessor> processors;

    public PaymentService(Map<String, PaymentProcessor> processors) {
        this.processors = processors;  // {"kakaoPay": ..., "naverPay": ..., "creditCard": ...}
    }

    public PaymentResult pay(String method, PaymentRequest req) {
        PaymentProcessor processor = processors.get(method);
        if (processor == null) throw new IllegalArgumentException("Unknown method: " + method);
        return processor.process(req);
    }
}
```

### Builder Pattern — Complex Objects
```java
// Lombok @Builder — zero boilerplate
@Builder
@Getter
public class EmailMessage {
    private String to;
    private String from;
    private String subject;
    private String body;
    private List<String> cc;
    private boolean html;
}

// Usage — readable, no constructor parameter confusion
EmailMessage email = EmailMessage.builder()
    .to("kim@test.com")
    .subject("Order Confirmed")
    .body(template)
    .html(true)
    .build();
```

### Observer Pattern — Spring Events
```java
// 1. Define the event
public class UserRegisteredEvent {
    private final User user;
    public UserRegisteredEvent(User user) { this.user = user; }
    public User getUser() { return user; }
}

// 2. Publish from service
@Service
public class UserService {
    private final ApplicationEventPublisher eventPublisher;

    public User register(CreateUserRequest req) {
        User user = userRepository.save(new User(req));
        eventPublisher.publishEvent(new UserRegisteredEvent(user));  // fire and forget
        return user;
    }
}

// 3. Multiple listeners — each does its own thing (decoupled)
@Component
public class EmailListener {
    @EventListener
    public void onUserRegistered(UserRegisteredEvent event) {
        emailService.sendWelcome(event.getUser().getEmail());
    }
}

@Component
public class AuditListener {
    @EventListener
    public void onUserRegistered(UserRegisteredEvent event) {
        auditLog.record("USER_REGISTERED", event.getUser().getId());
    }
}
```

### Template Method — JdbcTemplate
```java
// Spring's JdbcTemplate IS the Template Method pattern:
// the "template" handles connection open/close/exception,
// you only provide the SQL and mapping.

@Repository
public class UserRepository {
    private final JdbcTemplate jdbc;

    public List<User> findActive() {
        return jdbc.query(
            "SELECT * FROM users WHERE is_active = true",
            (rs, rowNum) -> new User(
                rs.getLong("id"),
                rs.getString("username"),
                rs.getString("email")
            )
        );
    }

    public Optional<User> findByEmail(String email) {
        return jdbc.query(
            "SELECT * FROM users WHERE email = ?",
            (rs, rowNum) -> new User(rs.getLong("id"), rs.getString("username"), email),
            email
        ).stream().findFirst();
    }
}
```

---

## 10. Lombok — Reduce Boilerplate

```java
// Without Lombok — 50+ lines for a simple class
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String role;

    public UserResponse() {}
    public UserResponse(Long id, String username, String email, String role) { /* ... */ }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    // ... 30 more lines
}

// With Lombok — 8 lines
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@EqualsAndHashCode(of = "id")  // equals/hashCode based on id only
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String role;
}
```

### Common Lombok Annotations
| Annotation | What It Generates |
|-----------|------------------|
| `@Getter` / `@Setter` | getters and/or setters for all fields |
| `@NoArgsConstructor` | `public UserResponse() {}` |
| `@AllArgsConstructor` | constructor with all fields |
| `@RequiredArgsConstructor` | constructor for `final` fields — **use for DI** |
| `@Builder` | `UserResponse.builder().id(1L).build()` |
| `@ToString` | `UserResponse(id=1, username=Kim, ...)` |
| `@EqualsAndHashCode` | `equals()` and `hashCode()` |
| `@Data` | `@Getter + @Setter + @ToString + @EqualsAndHashCode + @RequiredArgsConstructor` |
| `@Value` | Immutable version of `@Data` — all fields `final` |
| `@Slf4j` | `private static final Logger log = LoggerFactory.getLogger(...)` |

```java
// @RequiredArgsConstructor replaces @Autowired boilerplate
@Service
@RequiredArgsConstructor   // generates constructor for all final fields
public class UserService {
    private final UserRepository userRepository;   // injected via constructor
    private final EmailService emailService;        // injected via constructor

    // No need to write the constructor manually
}

// Equivalent to:
@Service
public class UserService {
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Autowired
    public UserService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }
}
```

---

## 11. String Essentials

```java
String s = "  Hello World  ";

s.trim();                      // "Hello World" — remove edge spaces
s.toLowerCase();               // "  hello world  "
s.toUpperCase();               // "  HELLO WORLD  "
s.contains("World");           // true
s.replace("World", "Java");    // "  Hello Java  "
```

Strings are **immutable** — every method above returns a NEW string;
the original never changes. When building a string in a loop, use
`StringBuilder` instead of `+`:

```java
// ❌ Creates a new String object every iteration — O(n²)
String result = "";
for (String name : names) result += name + ",";

// ✅ One mutable buffer — O(n)
StringBuilder sb = new StringBuilder();
for (String name : names) sb.append(name).append(",");
String result = sb.toString();
```

---

## 🗺️ Learning Priority for Spring Boot Developers

| Priority | Topic | Reason |
|----------|-------|--------|
| ⚡ Critical | OOP + Interfaces | Spring DI is 100% interface-based |
| ⚡ Critical | Exceptions + @ExceptionHandler | Every project needs error handling |
| ⚡ Critical | Stream API + Optional | Service layer uses these daily |
| ⚡ Critical | Generics | `Repository<T>`, `ResponseEntity<T>`, `Optional<T>` |
| 🔧 Important | Annotations + Reflection | Understand why `@Transactional` can break |
| 🔧 Important | Design Patterns | Strategy, Builder, Observer used constantly |
| 🔧 Important | Lombok | Removes 80% of boilerplate in enterprise code |
| 📈 Advanced | @Async + CompletableFuture | Background jobs, parallel API calls |
| 📈 Advanced | Virtual Threads | High-throughput Spring Boot 3.2+ apps |
| 📈 Advanced | Collections deep dive | HashMap internals, ConcurrentHashMap |
