# Phase 1 — Java Foundations

**Level:** Beginner → Junior
**Time:** Months 1–3 (working full-time, ~1 hour/day)
**Goal:** Write correct Java classes without looking anything up. Understand what the JVM actually does.

---

## 1. JDK vs JRE vs JVM

### Why it exists
Java's "write once, run anywhere" promise works because of the JVM. Before Java, you compiled C for Windows, then recompiled for Linux. Java compiles once to bytecode; the JVM on each machine runs it.

### How it works

```
You write:  HelloWorld.java
            ↓  (javac — compiler)
Bytecode:   HelloWorld.class  (not machine code — JVM instructions)
            ↓  (JVM — interpreter + JIT compiler)
CPU runs:   machine code specific to YOUR operating system
```

| Term | What it is | Contains |
|------|-----------|---------|
| JDK | Java Development Kit | JRE + compiler (`javac`) + tools (`jar`, `jshell`) |
| JRE | Java Runtime Environment | JVM + standard libraries |
| JVM | Java Virtual Machine | Executes bytecode; manages memory |

**Use JDK 21 LTS** — it is the current long-term support version. Banks and fintech companies use LTS versions only.

### JIT Compiler (Just-In-Time)
The JVM does not purely interpret. It watches which methods run often ("hot spots"), then compiles those to native machine code for speed. This is why Java performance starts slow and gets faster — this is called "warming up."

**Common mistake:** Benchmarking Java immediately after startup shows slow results. Always warm up before measuring.

### Interview Questions
1. What is the difference between JDK, JRE, and JVM?
2. What is bytecode? Is it machine code?
3. What does JIT compilation do? Why does it matter for performance?
4. Can you run a `.class` file without JDK? Can you compile without JRE?

### Resources
- https://docs.oracle.com/en/java/javase/21/
- https://www.baeldung.com/jvm-vs-jre-vs-jdk

---

## 2. Memory — Stack and Heap

### Why it matters
Memory bugs are the hardest to debug. Understanding Stack and Heap prevents `NullPointerException`, `StackOverflowError`, and memory leaks. Senior engineers are expected to know this cold.

### The Stack
- Stores method call frames
- Each method call pushes a frame; return pops it
- Stores local variables and primitive values
- **Fast** — just move a pointer
- **Fixed size** — overflow = `StackOverflowError` (infinite recursion)
- **Thread-local** — each thread has its own stack

### The Heap
- Stores all objects created with `new`
- Shared across all threads (→ concurrency issues!)
- Managed by Garbage Collector
- **Large** but **slower** to allocate

```java
void transfer(int amount) {          // amount lives on STACK
    Account acc = new Account();     // acc reference on STACK
                                     // Account object on HEAP
    acc.debit(amount);
}  // acc reference goes away; object on heap waits for GC
```

### Garbage Collection (GC)

GC automatically removes objects the program can no longer reach. You do not `free()` memory in Java (unlike C). But you can still "leak" by holding references you do not need.

**Generational GC (how G1GC and ZGC work):**
```
Young Generation → Eden → Survivor S0/S1 → Old Generation
     ^                                           ^
New objects born here              Long-lived objects promoted here
GC runs often (fast)               GC runs rarely (can be slow "stop-the-world")
```

**Common memory mistake in fintech:**
```java
// LEAK: holding all transactions in memory forever
private static List<Transaction> allTransactions = new ArrayList<>();

void recordTransaction(Transaction t) {
    allTransactions.add(t);   // never removed — grows forever
}
```

**GC tuning flags (JVM args):**
```bash
-Xms512m      # minimum heap
-Xmx4g        # maximum heap
-XX:+UseG1GC  # G1 GC (default Java 9+)
-XX:+UseZGC   # ZGC — low-latency, good for banking APIs
```

### Interview Questions
1. Where does a local variable live? Where does an object live?
2. What is a `StackOverflowError`? Write code that causes one.
3. What does Garbage Collection collect? What does it NOT collect?
4. What is a memory leak in Java? Give an example.
5. What is stop-the-world? Why is it a problem for a payment API?

### Exercise
```java
// TASK: Trace what is on Stack vs Heap at point X
public class BankDemo {
    public static void main(String[] args) {
        int rate = 5;                     // where?
        Account acc = new Account(1000);  // where?
        calculate(acc, rate);
    }

    static void calculate(Account a, int r) {
        double interest = a.getBalance() * r / 100.0;  // where?
        // ← POINT X: draw the stack frames and heap
    }
}
```

---

## 3. Variables, Primitive Types, Reference Types

### The 8 Primitives

| Type | Size | Range | Use for |
|------|------|-------|---------|
| `byte` | 8-bit | -128 to 127 | Raw bytes, file I/O |
| `short` | 16-bit | -32,768 to 32,767 | Rarely used |
| `int` | 32-bit | -2.1B to 2.1B | Counts, IDs |
| `long` | 64-bit | very large | Timestamps (`System.currentTimeMillis()`) |
| `float` | 32-bit | ~6-7 decimal digits | Never use for money |
| `double` | 64-bit | ~15-16 decimal digits | Never use for money |
| `char` | 16-bit | Unicode character | Characters |
| `boolean` | 1-bit | true / false | Flags |

### CRITICAL RULE FOR BANKING: Never use `float` or `double` for money

```java
// WRONG — floating-point error
double price = 0.1 + 0.2;
System.out.println(price);  // prints 0.30000000000000004 !!!

// RIGHT — use BigDecimal for all monetary calculations
BigDecimal price = new BigDecimal("0.1").add(new BigDecimal("0.2"));
System.out.println(price);  // prints 0.3

// Also wrong — new BigDecimal(0.1) — the double 0.1 is already imprecise
// Always pass a String to BigDecimal constructor
```

### Reference Types
Everything else is a reference type — String, arrays, all classes.
A reference variable holds a **memory address**, not the object itself.

```java
Account a1 = new Account(1000);  // a1 holds address, e.g., 0x4A3F
Account a2 = a1;                 // a2 holds THE SAME address
a2.debit(100);
System.out.println(a1.getBalance());  // prints 900! same object
```

### Pass-by-Value (Java always passes by value)
Java passes the **value** of the variable. For references, it passes the **value of the address**.

```java
void changeBalance(Account acc) {
    acc.debit(100);    // WORKS — modifies the object at that address
}

void changeRef(Account acc) {
    acc = new Account(9999);  // does NOT change the caller's variable
}                             // acc was a copy of the address
```

### String Immutability and String Pool
```java
String s1 = "hello";           // from String pool
String s2 = "hello";           // same object from pool
String s3 = new String("hello"); // NEW object on heap (don't do this)

s1 == s2        // true (same pool reference)
s1 == s3        // false (different object)
s1.equals(s3)   // true (same content)

// RULE: always use .equals() for String comparison, never ==
```

### Interview Questions
1. What is the difference between `int` and `Integer`?
2. Why can't you use `==` to compare Strings?
3. Why should you never use `double` for money? What should you use?
4. What does "Java is pass-by-value" mean for reference types?
5. What is autoboxing? What is its performance cost?

---

## 4. OOP — The 4 Pillars

### Why OOP exists
Before OOP, programs were sequences of procedures. As programs grew, procedures called each other in uncontrolled ways — changing one thing broke everything else. OOP organizes code around **data + behavior together**, with rules about who can change what.

---

### Encapsulation

**What:** Bundle data (fields) and behavior (methods) in one class. Hide internal details. Expose only what callers need.

**Why banks care:** An `Account` object should be the **only** place that changes a balance. If any code anywhere can set `account.balance = -999`, you cannot guarantee correctness.

```java
public class Account {
    private BigDecimal balance;  // hidden — nobody touches this directly
    private final String id;

    public Account(String id, BigDecimal initialBalance) {
        if (initialBalance.compareTo(BigDecimal.ZERO) < 0)
            throw new IllegalArgumentException("Initial balance cannot be negative");
        this.id = id;
        this.balance = initialBalance;
    }

    // Controlled access — rules enforced here
    public void debit(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("Amount must be positive");
        if (balance.compareTo(amount) < 0)
            throw new InsufficientFundsException("Insufficient balance");
        this.balance = this.balance.subtract(amount);
    }

    public BigDecimal getBalance() { return balance; }  // read-only access
}
```

**Common mistakes:**
- Public fields (`public BigDecimal balance`) — anyone can corrupt data
- Returning mutable objects from getters — caller can modify internal state
- Setters for everything — defeats the purpose of encapsulation

---

### Inheritance

**What:** A child class extends a parent class and inherits its methods and fields.

**Why it exists:** Avoid copying the same code into multiple classes.

```java
// Parent
public class Account {
    protected String id;
    protected BigDecimal balance;

    public void credit(BigDecimal amount) { /* common logic */ }
    public BigDecimal getBalance() { return balance; }

    // Template method — children override the fee calculation
    public BigDecimal calculateFee(BigDecimal amount) {
        return BigDecimal.ZERO;
    }
}

// Child
public class SavingsAccount extends Account {
    private BigDecimal interestRate;

    @Override
    public BigDecimal calculateFee(BigDecimal amount) {
        return BigDecimal.ZERO;  // no fee for savings
    }

    public BigDecimal calculateInterest() {
        return balance.multiply(interestRate);
    }
}

// Another child
public class CheckingAccount extends Account {
    @Override
    public BigDecimal calculateFee(BigDecimal amount) {
        return new BigDecimal("0.50");  // flat fee per transaction
    }
}
```

**Common mistakes:**
- Deep inheritance hierarchies (more than 2 levels is usually a smell)
- Inheriting for code reuse when **composition** is the right answer
- Violating Liskov Substitution Principle (LSP) — child breaks the contract of the parent

**Rule:** Prefer composition over inheritance. "Has-a" is usually better than "is-a."

---

### Polymorphism

**What:** One interface, many implementations. The same method call does different things depending on the actual object type.

```java
// Runtime polymorphism (method overriding)
Account acc = new SavingsAccount(...);  // declared as Account, actually SavingsAccount
BigDecimal fee = acc.calculateFee(amount);  // calls SavingsAccount.calculateFee()
// The JVM decides AT RUNTIME which method to call — "dynamic dispatch"

// Compile-time polymorphism (method overloading)
public void transfer(BigDecimal amount) { ... }
public void transfer(BigDecimal amount, String currency) { ... }
```

**Where this appears in Spring:**
- Every Spring `@Service` and `@Repository` can be swapped for a mock in tests
- `ApplicationContext.getBean(AccountService.class)` returns whatever implementation is in the container

---

### Abstraction

**What:** Define WHAT something does (interface/abstract class), not HOW it does it.

```java
// Abstract — defines the contract
public interface PaymentProcessor {
    PaymentResult process(PaymentRequest request);
    boolean supports(PaymentMethod method);
}

// Concrete implementations
public class VisaProcessor implements PaymentProcessor { ... }
public class MasterCardProcessor implements PaymentProcessor { ... }
public class BakongProcessor implements PaymentProcessor { ... }  // Cambodian NBC system

// Service uses the abstraction — does not know which bank handles it
public class PaymentService {
    private final List<PaymentProcessor> processors;

    public PaymentResult pay(PaymentRequest request) {
        return processors.stream()
            .filter(p -> p.supports(request.getMethod()))
            .findFirst()
            .orElseThrow(() -> new UnsupportedPaymentMethodException(...))
            .process(request);
    }
}
```

---

## 5. Interfaces vs Abstract Classes

| | Interface | Abstract Class |
|-|-----------|----------------|
| Multiple inheritance | Yes — a class can implement many | No — only one parent |
| Constructor | No | Yes |
| Fields | Only `public static final` constants | Any fields |
| Methods | `default` (with body), `static`, `abstract` | Any method type |
| When to use | **Define a contract** (CAN-DO relationship) | **Share code** between related classes (IS-A) |

```java
// Interface: defines capability
public interface Auditable {
    LocalDateTime getCreatedAt();
    String getCreatedBy();
}

// Abstract class: shares implementation
public abstract class BaseEntity implements Auditable {
    private LocalDateTime createdAt = LocalDateTime.now();
    private String createdBy;

    @Override
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Abstract — subclasses must implement
    public abstract String getEntityType();
}
```

---

## 6. Exceptions

### Why they exist
Without exceptions, every method must return error codes. Caller forgets to check. Data corruption happens silently. Exceptions force the caller to handle errors.

### Hierarchy
```
Throwable
├── Error          ← JVM problems (OutOfMemoryError) — don't catch
└── Exception
    ├── RuntimeException (unchecked) ← programming mistakes, no need to declare
    │   ├── NullPointerException
    │   ├── IllegalArgumentException
    │   ├── IllegalStateException
    │   └── InsufficientFundsException (your custom ones)
    └── Checked exceptions ← external failures, MUST declare or catch
        ├── IOException
        ├── SQLException
        └── ParseException
```

### Custom Exceptions (how production code works)

```java
// Base for all domain exceptions
public class BankException extends RuntimeException {
    private final String errorCode;

    public BankException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() { return errorCode; }
}

public class InsufficientFundsException extends BankException {
    public InsufficientFundsException(BigDecimal balance, BigDecimal amount) {
        super("INSUFFICIENT_FUNDS",
              String.format("Balance %.2f is less than requested %.2f", balance, amount));
    }
}

public class AccountNotFoundException extends BankException {
    public AccountNotFoundException(String accountId) {
        super("ACCOUNT_NOT_FOUND", "Account not found: " + accountId);
    }
}
```

### Try-with-resources (always use for closeable resources)
```java
// WRONG — resource leak if exception occurs before close()
Connection conn = dataSource.getConnection();
Statement stmt = conn.createStatement();
stmt.execute(sql);
conn.close();  // never reached if exception thrown above

// RIGHT — AutoCloseable resources closed automatically
try (Connection conn = dataSource.getConnection();
     Statement stmt = conn.createStatement()) {
    stmt.execute(sql);
}  // conn.close() called automatically in finally block
```

### Interview Questions
1. What is the difference between checked and unchecked exceptions?
2. When should you create a custom exception? What should it extend?
3. What is try-with-resources? Why is it important for database connections?
4. What happens if you throw an exception inside a finally block?
5. Should you catch `Exception` or `Throwable`? Why or why not?

---

## 7. Mini Project — Phase 1

**Build a banking domain model from scratch. No Spring, no frameworks.**

### Requirements
```
Account
  - id (String, immutable)
  - owner (String)
  - balance (BigDecimal, never negative)
  - type (SAVINGS / CHECKING / FIXED_DEPOSIT)
  - createdAt (LocalDateTime)

Operations
  - credit(amount) — add funds
  - debit(amount) — remove funds (throw if insufficient)
  - transfer(amount, target) — atomic credit+debit

Transaction
  - id, fromAccountId, toAccountId
  - amount, type (CREDIT/DEBIT/TRANSFER)
  - timestamp, status (PENDING/SUCCESS/FAILED)

TransactionHistory
  - keeps last N transactions per account
  - supports filtering by type and date range

InterestCalculator (interface)
  - calculate(Account) returns BigDecimal
  - SavingsInterestCalculator — rate × balance
  - FixedDepositCalculator — compound interest formula
```

### Constraints
- All money must be `BigDecimal` — never `double`
- All ids must be non-null, non-blank
- Balance must never go negative
- Write JUnit 5 tests for every rule
- No `System.out.println` — use proper exception messages

### What you learn
- OOP design from requirements
- Encapsulation in practice
- Custom exceptions
- Using `BigDecimal`
- Writing tests

---

## Phase 1 Checklist

- [ ] Can explain JDK vs JRE vs JVM without notes
- [ ] Know all 8 primitive types and their sizes
- [ ] Can trace Stack vs Heap for any piece of code
- [ ] Know why `double` is wrong for money
- [ ] Can explain all 4 OOP pillars with banking examples
- [ ] Can write an interface, an abstract class, and explain when to use each
- [ ] Know checked vs unchecked exceptions
- [ ] Always use try-with-resources for connections
- [ ] Mini project compiles and all tests pass

---

## References

- Oracle Java Tutorial (official): https://docs.oracle.com/javase/tutorial/
- Baeldung OOP guide: https://www.baeldung.com/java-oop
- Effective Java Items 1–17 (Bloch) — Item 17: "Minimize mutability"
- Spring Guides: https://spring.io/guides/gs/spring-boot/
- InfoQ Java: https://www.infoq.com/java/
