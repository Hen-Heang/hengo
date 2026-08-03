# Phase 6 — Advanced Spring: Kafka, Docker, Testing, Monitoring

**Level:** Mid → Senior
**Time:** Months 14–17
**Goal:** Build event-driven systems. Containerize services. Write production-grade tests. Set up monitoring for production.

---

## 1. Kafka — Event-Driven Architecture

### Why companies use it
- Decouples services — payment service doesn't wait for notification service
- Handles traffic spikes — events buffered in Kafka, consumers process at their own rate
- Replay — reprocess past events if a bug is found
- Audit trail — every event is immutable, stored for configurable retention

Netflix: 700 billion events/day through Kafka
Uber: real-time driver tracking, surge pricing via Kafka
Cambodian digital banks (ABA, Wing): transaction events, fraud detection

### Key Concepts
```
Topic: a category of messages (e.g., "payments", "account-events")
Partition: a topic is split into N partitions (parallelism)
Offset: position of a message in a partition (monotonically increasing)
Consumer Group: N consumers sharing work on a topic
  - Each partition is consumed by exactly ONE consumer in the group
  - Adding consumers = more parallel consumption (up to number of partitions)
Producer: writes messages to a topic
Broker: a Kafka server
```

### Producer — Publish Payment Events

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventPublisher {

    private final KafkaTemplate<String, PaymentEvent> kafkaTemplate;

    public void publishTransferCompleted(Transfer transfer) {
        PaymentEvent event = PaymentEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .eventType("TRANSFER_COMPLETED")
            .fromAccountId(transfer.getFromAccountId())
            .toAccountId(transfer.getToAccountId())
            .amount(transfer.getAmount())
            .currency(transfer.getCurrency())
            .timestamp(Instant.now())
            .build();

        // Key = fromAccountId ensures all events for one account go to same partition (ordered!)
        kafkaTemplate.send("payment-events", transfer.getFromAccountId(), event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Failed to publish payment event for transfer {}", transfer.getId(), ex);
                    // In production: save to outbox table for retry
                } else {
                    log.info("Published TRANSFER_COMPLETED: offset={}, partition={}",
                        result.getRecordMetadata().offset(),
                        result.getRecordMetadata().partition());
                }
            });
    }
}
```

### Consumer — Process Events

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventConsumer {

    private final NotificationService notificationService;
    private final FraudDetectionService fraudService;
    private final ProcessedEventRepository processedEventRepo;

    @KafkaListener(
        topics = "payment-events",
        groupId = "notification-service",
        containerFactory = "paymentEventListenerFactory"
    )
    public void onPaymentEvent(
            ConsumerRecord<String, PaymentEvent> record,
            Acknowledgment acknowledgment) {
        PaymentEvent event = record.value();
        log.info("Received event: type={}, eventId={}", event.getEventType(), event.getEventId());

        // IDEMPOTENCY — check if we already processed this event
        if (processedEventRepo.existsByEventId(event.getEventId())) {
            log.warn("Duplicate event {}, skipping", event.getEventId());
            acknowledgment.acknowledge();  // commit offset — don't reprocess
            return;
        }

        try {
            switch (event.getEventType()) {
                case "TRANSFER_COMPLETED" -> {
                    notificationService.sendAlert(event);
                    fraudService.analyze(event);
                }
                case "ACCOUNT_CLOSED" -> notificationService.sendClosureNotification(event);
                default -> log.warn("Unknown event type: {}", event.getEventType());
            }

            processedEventRepo.markProcessed(event.getEventId());
            acknowledgment.acknowledge();  // only ack after successful processing

        } catch (RetryableException e) {
            log.warn("Retryable error for event {}, will retry", event.getEventId(), e);
            // Don't acknowledge — Kafka will redeliver
        } catch (Exception e) {
            log.error("Permanent error for event {}, sending to DLT", event.getEventId(), e);
            // Send to Dead Letter Topic for manual inspection
            acknowledgment.acknowledge();  // ack to avoid infinite retry
        }
    }
}
```

### The Outbox Pattern (guaranteed delivery)

Problem: you commit the database transaction but Kafka publish fails. The transfer happened but no notification was sent.

```java
// WRONG — two operations, no atomicity
@Transactional
public void transfer(...) {
    accountRepo.debit(fromId, amount);
    accountRepo.credit(toId, amount);
    kafkaPublisher.publish(event);  // if Kafka is down, event is lost, DB is committed
}

// RIGHT — Transactional Outbox Pattern
@Transactional
public void transfer(...) {
    accountRepo.debit(fromId, amount);
    accountRepo.credit(toId, amount);
    outboxRepo.save(new OutboxEvent("payment-events", serialize(event)));
    // Single DB transaction — either all committed or all rolled back
}

// Separate poller — reads outbox and publishes to Kafka
@Scheduled(fixedDelay = 1000)
@Transactional
public void pollOutbox() {
    List<OutboxEvent> pending = outboxRepo.findUnpublished();
    for (OutboxEvent e : pending) {
        kafkaPublisher.publish(e.getTopic(), e.getPayload());
        e.setPublished(true);
    }
}
```

---

## 2. Docker — Containerizing Your Spring App

### Why containers
"Works on my machine" — Docker makes your app run the same everywhere (dev laptop, CI, production server).

### Dockerfile for Spring Boot

```dockerfile
# Multi-stage build — smaller final image
FROM eclipse-temurin:21-jre-alpine AS builder
WORKDIR /app
COPY target/bank-api.jar app.jar
RUN java -Djarmode=layertools -jar app.jar extract

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy layers in order of change frequency (least changed first)
COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./

# Run as non-root (security best practice)
RUN addgroup -S bankapp && adduser -S bankapp -G bankapp
USER bankapp

EXPOSE 8080
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
```

### docker-compose for local development

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: bankdb
      POSTGRES_USER: bankapp
      POSTGRES_PASSWORD: bankpass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
    ports:
      - "9092:9092"
    depends_on:
      - zookeeper

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  bank-api:
    build: .
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: docker
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/bankdb
      SPRING_DATASOURCE_USERNAME: bankapp
      SPRING_DATASOURCE_PASSWORD: bankpass
      SPRING_KAFKA_BOOTSTRAP_SERVERS: kafka:9092
    depends_on:
      - postgres
      - redis
      - kafka

volumes:
  postgres_data:
```

---

## 3. Testing Strategy

### The Testing Pyramid
```
         /E2E Tests\        ← few, slow, expensive (test real system)
        /Integration \      ← some, test multiple layers together
       /  Unit Tests  \     ← many, fast, test one class in isolation
```

**Rule of thumb:** 70% unit, 20% integration, 10% E2E.

### Unit Tests (Mockito)

```java
@ExtendWith(MockitoExtension.class)  // lightweight, no Spring context
class TransferServiceTest {

    @Mock
    AccountRepository accountRepo;

    @Mock
    TransactionRepository txnRepo;

    @Mock
    KafkaTemplate<String, PaymentEvent> kafkaTemplate;

    @InjectMocks
    TransferService transferService;

    @Test
    void transfer_success() {
        // Arrange
        Account fromAccount = createAccount("ACC001", new BigDecimal("1000.00"));
        Account toAccount = createAccount("ACC002", new BigDecimal("500.00"));

        when(accountRepo.findByIdForUpdate("ACC001")).thenReturn(Optional.of(fromAccount));
        when(accountRepo.findByIdForUpdate("ACC002")).thenReturn(Optional.of(toAccount));

        // Act
        transferService.transfer("ACC001", "ACC002", new BigDecimal("200.00"));

        // Assert
        assertThat(fromAccount.getBalance()).isEqualByComparingTo("800.00");
        assertThat(toAccount.getBalance()).isEqualByComparingTo("700.00");
        verify(txnRepo, times(2)).save(any(Transaction.class));
    }

    @Test
    void transfer_insufficientFunds_throwsException() {
        Account fromAccount = createAccount("ACC001", new BigDecimal("100.00"));
        when(accountRepo.findByIdForUpdate("ACC001")).thenReturn(Optional.of(fromAccount));

        assertThatThrownBy(() ->
            transferService.transfer("ACC001", "ACC002", new BigDecimal("200.00"))
        ).isInstanceOf(InsufficientFundsException.class)
         .hasMessageContaining("100.00");

        verify(accountRepo, never()).save(any());  // verify nothing was saved
    }

    @Test
    void transfer_accountNotFound_throwsException() {
        when(accountRepo.findByIdForUpdate(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            transferService.transfer("UNKNOWN", "ACC002", BigDecimal.ONE)
        ).isInstanceOf(AccountNotFoundException.class);
    }
}
```

### Integration Tests (Spring context + real DB)

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Transactional  // rollback each test
class TransferIntegrationTest {

    @Autowired TestRestTemplate restTemplate;
    @Autowired AccountRepository accountRepo;
    @Autowired JdbcTemplate jdbcTemplate;

    @Test
    void transfer_endToEnd() {
        // Arrange — create real accounts in H2
        Account from = accountRepo.save(new Account("ACC001", new BigDecimal("1000")));
        Account to = accountRepo.save(new Account("ACC002", new BigDecimal("500")));

        // Act
        TransferRequest request = new TransferRequest("ACC001", "ACC002", new BigDecimal("300"));
        ResponseEntity<TransferResponse> response = restTemplate.postForEntity(
            "/api/v1/transfers", request, TransferResponse.class);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(accountRepo.findById(from.getId()).get().getBalance())
            .isEqualByComparingTo("700.00");
        assertThat(accountRepo.findById(to.getId()).get().getBalance())
            .isEqualByComparingTo("800.00");
    }
}
```

### Controller Tests (MockMvc)

```java
@WebMvcTest(AccountController.class)  // loads only web layer
class AccountControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean AccountService accountService;  // mock the service

    @Test
    void getAccount_success() throws Exception {
        AccountResponse mockResponse = AccountResponse.builder()
            .id("ACC001").balance(new BigDecimal("1000")).build();
        when(accountService.findById("ACC001")).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/accounts/ACC001")
                .header("Authorization", "Bearer " + validToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("ACC001"))
            .andExpect(jsonPath("$.balance").value(1000));
    }

    @Test
    void createAccount_validationFailure() throws Exception {
        CreateAccountRequest bad = new CreateAccountRequest();  // missing required fields

        mockMvc.perform(post("/api/v1/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(bad)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }
}
```

### Testcontainers (real DB in tests)

```java
@SpringBootTest
@Testcontainers
class AccountRepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired AccountRepository accountRepo;

    @Test
    void findByAccountNumber_realDatabase() {
        accountRepo.save(new Account("TEST123", BigDecimal.TEN));
        Optional<Account> found = accountRepo.findByAccountNumber("TEST123");
        assertThat(found).isPresent();
        assertThat(found.get().getBalance()).isEqualByComparingTo("10.00");
    }
}
```

---

## 4. Monitoring with Actuator, Micrometer, Prometheus, Grafana

### Why monitoring matters
A payment API going down at 9 AM costs money every second it's down. You need to know about it before your customers call. Banks require 99.95% uptime SLA.

### Spring Actuator

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus,info,loggers
  endpoint:
    health:
      show-details: always
  metrics:
    tags:
      application: bank-api
      environment: prod
```

```
GET /actuator/health    → { "status": "UP", "components": { "db": "UP", "redis": "UP" } }
GET /actuator/metrics   → list of all metrics
GET /actuator/metrics/jvm.memory.used  → current memory usage
GET /actuator/prometheus → metrics in Prometheus format (for scraping)
```

### Custom Metrics with Micrometer

```java
@Component
public class TransactionMetrics {
    private final Counter successCounter;
    private final Counter failureCounter;
    private final Timer transferTimer;

    public TransactionMetrics(MeterRegistry registry) {
        this.successCounter = Counter.builder("bank.transfers.success")
            .description("Total successful transfers")
            .register(registry);
        this.failureCounter = Counter.builder("bank.transfers.failure")
            .description("Total failed transfers")
            .tag("reason", "unknown")
            .register(registry);
        this.transferTimer = Timer.builder("bank.transfer.duration")
            .description("Time to complete a transfer")
            .register(registry);
    }

    public void recordSuccess() { successCounter.increment(); }
    public void recordFailure(String reason) {
        failureCounter.builder("bank.transfers.failure").tag("reason", reason)
            .register(registry).increment();
    }
    public Timer.Sample startTimer() { return Timer.start(); }
    public void stopTimer(Timer.Sample sample) { sample.stop(transferTimer); }
}
```

### Prometheus + Grafana Setup (docker-compose addition)

```yaml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  ports:
    - "3000:3000"
  environment:
    GF_SECURITY_ADMIN_PASSWORD: admin
```

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'bank-api'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['bank-api:8080']
    scrape_interval: 15s
```

**Key dashboards to set up in Grafana:**
- HTTP request rate (requests per second)
- Error rate (5xx percentage)
- P50/P95/P99 response time
- JVM heap usage
- Database connection pool usage (HikariCP metrics)
- Kafka consumer lag

---

## 5. Logging Best Practices

```java
@Service
@Slf4j  // Lombok generates: private static final Logger log = LoggerFactory.getLogger(...)
public class TransferService {

    public TransferResult transfer(TransferRequest req) {
        // Structured logging — use {} placeholders, never String concat
        log.info("Transfer started: from={}, to={}, amount={}, currency={}",
            req.getFromId(), req.getToId(), req.getAmount(), req.getCurrency());

        // NEVER log: passwords, tokens, full card numbers, national IDs
        // Log: account IDs (masked?), amounts, status, timing

        try {
            // ... business logic ...
            log.info("Transfer completed: id={}, durationMs={}", result.getId(), elapsed);
            return result;
        } catch (InsufficientFundsException e) {
            log.warn("Transfer rejected: reason=INSUFFICIENT_FUNDS, from={}", req.getFromId());
            throw e;
        } catch (Exception e) {
            log.error("Transfer failed: from={}, to={}", req.getFromId(), req.getToId(), e);
            throw e;
        }
    }
}
```

```yaml
# logback-spring.xml (or application.yml logging section)
logging:
  level:
    root: WARN
    com.bank: INFO            # your packages
    org.springframework: WARN
    org.hibernate.SQL: DEBUG  # development only — see SQL
  file:
    name: logs/bank-api.log
  pattern:
    console: "%d{HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

---

## 6. Interview Questions — Phase 6

**Kafka:**
1. What is a Kafka topic? What is a partition?
2. How does a consumer group work? What happens if you have more consumers than partitions?
3. What is "at-least-once" delivery? Why must consumers be idempotent?
4. What is the Transactional Outbox Pattern? When do you need it?
5. What is a Dead Letter Topic?

**Testing:**
1. What is the difference between @SpringBootTest and @WebMvcTest?
2. What does @MockBean do? How is it different from @Mock?
3. Why would you use Testcontainers instead of H2 for tests?
4. What is the testing pyramid? What percentage should be unit/integration/E2E?
5. Why is @Transactional useful in tests?

**Monitoring:**
1. What is Micrometer? What is Prometheus? How do they relate?
2. What is P95 latency? Why is it more useful than average?
3. What Spring Actuator endpoints would you expose in production?

---

## References

- Kafka Docs: https://kafka.apache.org/documentation/
- Spring Kafka Docs: https://docs.spring.io/spring-kafka/reference/
- Testcontainers: https://testcontainers.com/
- Micrometer Docs: https://micrometer.io/docs
- Spring Actuator: https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html
- Microservices Patterns (Richardson) — Ch 3: Inter-process communication
- Martin Fowler — Transactional Outbox: https://microservices.io/patterns/data/transactional-outbox.html
- Netflix Tech Blog (event-driven systems): https://netflixtechblog.com
