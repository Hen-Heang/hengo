# Phase 5 — Spring Data JPA + Spring Security

**Level:** Mid
**Time:** Months 10–14
**Goal:** Write production JPA code without N+1 problems. Implement JWT auth correctly. Understand security pitfalls banks care about.

---

## 1. Spring Data JPA and Hibernate

### Entity Mapping

```java
@Entity
@Table(name = "accounts",
       indexes = {
           @Index(name = "idx_accounts_number", columnList = "account_number"),
           @Index(name = "idx_accounts_customer", columnList = "customer_id, status")
       })
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // DB auto-increment
    private Long id;

    @Column(name = "account_number", nullable = false, unique = true, length = 20)
    private String accountNumber;

    @ManyToOne(fetch = FetchType.LAZY)   // LAZY — don't load customer unless accessed
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Enumerated(EnumType.STRING)         // store "SAVINGS" not ordinal 0 (fragile)
    @Column(nullable = false)
    private AccountType type;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @Version                             // optimistic locking
    private Long version;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, orphanRemoval = true,
               fetch = FetchType.LAZY)
    private List<Transaction> transactions = new ArrayList<>();
}
```

### Repository Layer

```java
public interface AccountRepository extends JpaRepository<Account, Long> {

    // Spring Data generates: SELECT * FROM accounts WHERE account_number = ?
    Optional<Account> findByAccountNumber(String accountNumber);

    // Returns accounts matching status, ordered
    List<Account> findByStatusOrderByCreatedAtDesc(AccountStatus status);

    // Custom JPQL (when method name gets too long)
    @Query("SELECT a FROM Account a WHERE a.balance > :minBalance AND a.type = :type")
    List<Account> findHighValueAccounts(@Param("minBalance") BigDecimal minBalance,
                                        @Param("type") AccountType type);

    // Projection — return only what you need (performance!)
    @Query("SELECT a.accountNumber AS accountNumber, a.balance AS balance " +
           "FROM Account a WHERE a.customer.id = :customerId")
    List<AccountSummary> findSummaryByCustomerId(@Param("customerId") Long customerId);

    // Native SQL (for complex queries that JPQL can't express)
    @Query(value = """
        SELECT a.*, SUM(t.amount) AS monthly_volume
        FROM accounts a
        LEFT JOIN transactions t ON t.account_id = a.id
          AND t.created_at >= CURRENT_DATE - INTERVAL '30 days'
        WHERE a.status = 'ACTIVE'
        GROUP BY a.id
        HAVING SUM(t.amount) > :threshold
        """, nativeQuery = true)
    List<Object[]> findHighVolumeAccounts(@Param("threshold") BigDecimal threshold);

    // Locking for concurrent operations
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.id = :id")
    Optional<Account> findByIdForUpdate(@Param("id") Long id);

    // Pagination
    Page<Account> findByCustomerId(Long customerId, Pageable pageable);

    // Exists check (cheaper than findBy)
    boolean existsByAccountNumber(String accountNumber);

    // Count
    long countByStatus(AccountStatus status);

    // Custom update — use @Modifying for DML
    @Modifying
    @Query("UPDATE Account a SET a.balance = a.balance + :amount WHERE a.id = :id AND a.balance + :amount >= 0")
    int updateBalance(@Param("id") Long id, @Param("amount") BigDecimal amount);
}
```

### Interface Projections (return less data)

```java
// Projection interface — Hibernate fetches only these columns
public interface AccountSummary {
    String getAccountNumber();
    BigDecimal getBalance();
    String getOwnerName();  // from joined customer

    // Computed field
    @Value("#{target.accountNumber + ' (' + target.balance + ')'}")
    String getDisplayLabel();
}
```

---

## 2. The N+1 Problem (most common JPA performance bug)

### What it is
```java
// EXAMPLE — N+1 problem
List<Account> accounts = accountRepository.findAll();  // 1 query: SELECT all accounts

for (Account a : accounts) {
    System.out.println(a.getCustomer().getName());
    // Each call to getCustomer() fires a new query: SELECT * FROM customers WHERE id = ?
    // 100 accounts = 101 queries! (1 for accounts + N for each customer)
}
```

### How to fix: JOIN FETCH

```java
// Solution 1: JPQL JOIN FETCH
@Query("SELECT a FROM Account a JOIN FETCH a.customer WHERE a.status = 'ACTIVE'")
List<Account> findAllWithCustomer();
// Result: 1 query with JOIN — no lazy loading needed

// Solution 2: Entity Graph
@EntityGraph(attributePaths = {"customer", "transactions"})
List<Account> findByStatus(AccountStatus status);

// Solution 3: DTO projection (best performance — no entity loading at all)
@Query("SELECT new com.bank.dto.AccountDto(a.id, a.accountNumber, c.name) " +
       "FROM Account a JOIN a.customer c WHERE a.status = :status")
List<AccountDto> findAccountDtos(@Param("status") AccountStatus status);
```

### Hibernate `show-sql` (for development only)
```yaml
spring:
  jpa:
    show-sql: true                          # see SQL in logs
    properties:
      hibernate:
        format_sql: true                    # pretty-print
        generate_statistics: true           # count queries per request
```

**Check statistics in tests:**
```java
@Test
void findAccounts_shouldNotHaveNPlusOne() {
    // Use Hypersistence Optimizer or count queries manually
    // With Statistics enabled, check the query count before and after
}
```

---

## 3. Transactions in Spring

### @Transactional — how it really works

```java
// Your class
@Service
public class TransferService {
    @Transactional
    public void transfer(String fromId, String toId, BigDecimal amount) {
        Account from = accountRepo.findByIdForUpdate(fromId).orElseThrow();
        Account to = accountRepo.findByIdForUpdate(toId).orElseThrow();
        from.setBalance(from.getBalance().subtract(amount));
        to.setBalance(to.getBalance().add(amount));
        // Hibernate detects changes to managed entities and flushes to DB
        // Spring commits on successful return, rolls back on RuntimeException
    }
}

// What Spring actually creates (CGLIB proxy)
// TransferService$$SpringCGLIB$$0 extends TransferService {
//     void transfer(...) {
//         TransactionStatus tx = transactionManager.getTransaction(...);
//         try {
//             super.transfer(...);     // your code
//             transactionManager.commit(tx);
//         } catch (RuntimeException e) {
//             transactionManager.rollback(tx);
//             throw e;
//         }
//     }
// }
```

### The Self-Invocation Bug
```java
@Service
public class AccountService {

    @Transactional
    public void updateBalance(Long id, BigDecimal amount) { /* ... */ }

    // THIS DOES NOT START A NEW TRANSACTION:
    public void batchUpdate(List<Long> ids, BigDecimal amount) {
        for (Long id : ids) {
            this.updateBalance(id, amount);  // calls this.updateBalance, not proxy.updateBalance
        }
        // @Transactional is on the proxy — calling via 'this' bypasses the proxy!
    }
}

// FIX: inject self, or extract to another bean
@Service
@RequiredArgsConstructor
public class AccountService {
    private final AccountService self;  // Spring injects the proxy!

    public void batchUpdate(List<Long> ids, BigDecimal amount) {
        for (Long id : ids) {
            self.updateBalance(id, amount);  // now goes through proxy
        }
    }
}
```

### Propagation Levels

| Propagation | Behavior |
|-------------|----------|
| `REQUIRED` (default) | Join existing TX, or create new |
| `REQUIRES_NEW` | Always create new TX (suspends existing) |
| `MANDATORY` | Must have TX — throws if none |
| `SUPPORTS` | Join TX if exists, run without if none |
| `NOT_SUPPORTED` | Run without TX (suspends existing) |
| `NEVER` | Must not have TX — throws if one exists |

```java
// Real use case: REQUIRES_NEW for audit logging
// We want to save the audit record even if the main transaction rolls back

@Service
public class AuditService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String userId, String details) {
        auditRepo.save(new AuditRecord(action, userId, details, Instant.now()));
        // This commits even if the calling transaction rolls back
    }
}
```

### Optimistic vs Pessimistic Locking

```java
// Optimistic — @Version field, no DB lock, detects conflict at commit
@Entity
public class Account {
    @Version
    private Long version;  // Hibernate auto-manages this
}

// How it works:
// TX1: read account (version=1), update balance
// TX2: read account (version=1), update balance
// TX1: UPDATE accounts SET balance=? WHERE id=? AND version=1 → success → version becomes 2
// TX2: UPDATE accounts SET balance=? WHERE id=? AND version=1 → 0 rows updated!
//      → Hibernate throws OptimisticLockException → @Transactional rolls back

// Use optimistic when: reads >> writes, conflicts are rare

// Pessimistic — DB-level lock, others wait
@Lock(LockModeType.PESSIMISTIC_WRITE)
Optional<Account> findByIdForUpdate(Long id);
// SELECT ... FOR UPDATE → row locked until TX commits
// Use pessimistic when: balance operations, high contention, conflicts expected
```

---

## 4. Spring Security — JWT Authentication

### The Authentication Flow
```
Client sends: POST /api/v1/auth/login { username, password }
Server:
  1. Load UserDetails from DB
  2. Verify password with BCryptPasswordEncoder
  3. Generate JWT token (signed with server secret key)
  4. Return { token, expiresAt }

Client stores token, sends on every request:
  Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...

Server validates:
  1. JwtFilter intercepts request
  2. Extract token from Authorization header
  3. Validate signature (was it signed by us?)
  4. Check expiry
  5. Load user details
  6. Set Authentication in SecurityContext
  7. Request proceeds to controller
```

### JWT Structure
```
eyJhbGciOiJIUzI1NiJ9          ← Header (base64): {"alg":"HS256"}
.
eyJzdWIiOiJBQ0MwMDEiLCJyb2xlIjoiQURNSU4ifQ  ← Payload (base64): {"sub":"ACC001","role":"ADMIN","iat":...,"exp":...}
.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  ← Signature (HMAC-SHA256 of header.payload with secret)
```

**JWT is signed, not encrypted.** The payload is readable by anyone — NEVER put sensitive data (password, full account number) in a JWT.

### Implementation

```java
// JWT utility
@Component
public class JwtTokenProvider {

    @Value("${security.jwt.secret}")
    private String jwtSecret;

    @Value("${security.jwt.expiration-ms}")
    private long jwtExpirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(UserDetails user) {
        return Jwts.builder()
            .subject(user.getUsername())
            .claim("roles", user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority).collect(Collectors.toList()))
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
            .signWith(getSigningKey())
            .compact();
    }

    public Claims validateAndExtract(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
        // Throws JwtException if invalid/expired — catch this!
    }
}

// JWT Filter
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtProvider;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        try {
            Claims claims = jwtProvider.validateAndExtract(token);
            String username = claims.getSubject();

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (JwtException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            // Don't set authentication — Spring Security will return 401
        }

        filterChain.doFilter(request, response);
    }
}

// Security Configuration
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // enables @PreAuthorize, @PostAuthorize
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)     // REST APIs use JWT — no session/CSRF needed
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()     // public endpoints
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);  // cost factor 12 = slower = harder to brute force
    }
}
```

### Method-Level Security
```java
@Service
public class AccountService {

    // Only the account owner or an ADMIN can view this account
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.userId")
    public AccountResponse getAccount(Long accountId, Long userId) { ... }

    // Only ADMIN can close accounts
    @PreAuthorize("hasRole('ADMIN')")
    public void closeAccount(Long accountId) { ... }

    // Only return records belonging to current user (post-filter)
    @PostFilter("filterObject.customerId == authentication.principal.userId")
    public List<Account> getMyAccounts() { ... }
}
```

---

## 5. CORS, CSRF, and Common Security Mistakes

### CORS (Cross-Origin Resource Sharing)
```java
@Configuration
public class CorsConfig {
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("https://app.mybank.com")); // NOT "*" in production
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setMaxAge(3600L);  // cache preflight for 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
```

### CSRF — Why JWT APIs disable it
CSRF exploits session cookies — a malicious site tricks your browser into sending your session cookie. JWT in Authorization header is NOT automatically sent by browsers — so CSRF does not apply to JWT APIs.

**But:** if you store JWT in a cookie (bad practice), you need CSRF protection.

### Security Mistakes (top ones for bank APIs)

```java
// 1. Returning internal exception details to client
return ResponseEntity.status(500).body(ex.getMessage());
// FIX: return generic "internal error" to client, log details server-side

// 2. Logging sensitive data
log.info("User {} logged in with password {}", username, password);
// FIX: never log passwords, tokens, full card numbers, national IDs

// 3. SQL injection (with JDBC, not JPA)
String sql = "SELECT * FROM accounts WHERE id = " + accountId;  // DANGEROUS
// FIX: always use parameterized queries
jdbcTemplate.queryForObject("SELECT * FROM accounts WHERE id = ?", ..., accountId);

// 4. Mass assignment (exposing entity directly as request body)
@PutMapping("/accounts/{id}")
public Account update(@RequestBody Account account) { ... }  // client can set ANY field
// FIX: use a DTO with only the fields you allow to be updated

// 5. Insecure Direct Object Reference (IDOR)
@GetMapping("/accounts/{id}")
public Account get(@PathVariable Long id) {
    return repo.findById(id).orElseThrow();  // can anyone see any account?
}
// FIX: verify the account belongs to the authenticated user
```

---

## 6. Caching with Redis

```java
// Spring Cache abstraction
@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))     // expire after 10 min
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new GenericJackson2JsonRedisSerializer()));
        return RedisCacheManager.builder(factory).cacheDefaults(config).build();
    }
}

@Service
public class ExchangeRateService {

    // Cache result — key is the combination of from+to currency
    @Cacheable(value = "exchangeRates", key = "#from + ':' + #to")
    public BigDecimal getRate(String from, String to) {
        return externalFxApi.getRate(from, to);  // expensive external call, now cached
    }

    // Invalidate cache when rate is updated
    @CacheEvict(value = "exchangeRates", key = "#from + ':' + #to")
    public void updateRate(String from, String to, BigDecimal newRate) {
        rateRepository.save(new ExchangeRate(from, to, newRate));
    }
}
```

---

## 7. Async and Scheduling

```java
@Configuration
@EnableAsync
@EnableScheduling
public class AsyncConfig {
    @Bean
    public TaskExecutor asyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("async-bank-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        return executor;
    }
}

@Service
public class NotificationService {

    @Async  // runs in a separate thread
    public CompletableFuture<Void> sendTransactionAlert(String userId, BigDecimal amount) {
        emailService.sendTransactionEmail(userId, amount);
        return CompletableFuture.completedFuture(null);
    }
}

@Component
public class ScheduledJobs {

    @Scheduled(cron = "0 0 2 * * *")  // run at 2 AM every day
    public void calculateDailyInterest() {
        accountService.applyInterestToAllSavingsAccounts();
    }

    @Scheduled(fixedDelay = 60_000)  // run 60 seconds after previous run completes
    public void processFailedTransactions() {
        retryService.retryFailedTransactions();
    }
}
```

---

## 8. Interview Questions — Phase 5

**JPA:**
1. What is the N+1 problem? How do you fix it?
2. What is the difference between LAZY and EAGER loading? Which is the default?
3. What is optimistic locking? What is pessimistic locking? When to use each?
4. Why should you not use CascadeType.ALL without thinking?
5. What does @Version do?
6. What is a Projection? Why is it more performant than returning entities?
7. What is the difference between JPQL and native SQL? When do you use each?

**Transactions:**
1. What does @Transactional actually do in Spring?
2. What is the self-invocation problem? How do you fix it?
3. What is Propagation.REQUIRES_NEW used for?
4. When does @Transactional roll back? When does it NOT roll back?

**Security:**
1. How does JWT authentication work? What is in the token?
2. Why is JWT "stateless"? What are the implications?
3. What is CSRF? Why do JWT APIs not need CSRF protection?
4. What is IDOR? Give an example.
5. Why should you never log passwords or tokens?
6. What is BCrypt? Why cost factor matters?

---

## References

- Spring Data JPA Docs: https://docs.spring.io/spring-data/jpa/reference/
- Hibernate ORM Docs: https://hibernate.org/orm/documentation/
- Baeldung JPA: https://www.baeldung.com/the-persistence-layer-with-spring-data-jpa
- Spring Security Docs: https://docs.spring.io/spring-security/reference/
- Spring Security in Action (Spilca) — the best Spring Security book
- JWT.io — JWT debugger and documentation
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Baeldung N+1: https://www.baeldung.com/hibernate-common-performance-problems-in-logs
