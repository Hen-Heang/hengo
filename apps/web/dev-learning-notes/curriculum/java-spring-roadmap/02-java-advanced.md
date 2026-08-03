# Phase 2 — Java Advanced

**Level:** Junior → Mid
**Time:** Months 3–5
**Goal:** Use Collections correctly, write Streams code fluently, understand Generics, handle concurrency safely.

---

## 1. Collections Framework

### Why it exists
Arrays have fixed size and no built-in operations. Collections give you dynamic size, searching, sorting, deduplication — implemented by experts and battle-tested.

### The Hierarchy
```
Collection
├── List          — ordered, allows duplicates
│   ├── ArrayList
│   └── LinkedList
├── Set           — no duplicates
│   ├── HashSet
│   ├── LinkedHashSet   (maintains insertion order)
│   └── TreeSet         (sorted)
└── Queue
    ├── LinkedList
    ├── ArrayDeque
    └── PriorityQueue

Map (NOT a Collection, but part of the framework)
├── HashMap
├── LinkedHashMap   (insertion order)
├── TreeMap         (sorted by key)
└── ConcurrentHashMap   (thread-safe)
```

---

### ArrayList vs LinkedList

| Operation | ArrayList | LinkedList |
|-----------|-----------|------------|
| `get(index)` | O(1) — direct array access | O(n) — traverse from head |
| `add(end)` | O(1) amortized | O(1) |
| `add(middle)` | O(n) — shift elements | O(1) if you have the node |
| Memory | Compact — contiguous array | Overhead per node (next/prev pointers) |
| Use when | You read by index often | You insert/remove from middle often |

**In practice:** ArrayList wins almost always. LinkedList is rarely the right choice.

```java
// WRONG choice — frequent get(i) on LinkedList is O(n) per call
List<Transaction> txns = new LinkedList<>();
for (int i = 0; i < txns.size(); i++) {
    process(txns.get(i));  // O(n) each time = O(n²) total
}

// RIGHT — use ArrayList, or better, enhanced for-loop (works well on both)
List<Transaction> txns = new ArrayList<>();
for (Transaction t : txns) { process(t); }
```

---

### HashMap Internals (critical for interviews)

```
HashMap internally:
  - Array of "buckets" (default size 16)
  - Each bucket holds a linked list (Java 8+: converts to red-black tree after 8 entries)

put("ACC001", account):
  1. Hash the key: hash("ACC001") → some integer
  2. Index = hash % array.length → bucket index
  3. If bucket empty: place entry
  4. If bucket has entries: check each with .equals()
     - found same key: update value
     - not found: add to list (or tree)

WHY equals() AND hashCode() MUST both be correct:
  - Two objects with same hashCode() go to same bucket (collision)
  - equals() is used to find the right one in that bucket
  - If equals() says two objects are equal but hashCode() differs:
    → they end up in different buckets → get() returns null even though the key "exists"
```

```java
// BROKEN — missing hashCode
class AccountId {
    String value;

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof AccountId)) return false;
        return this.value.equals(((AccountId) o).value);
    }
    // hashCode not overridden — uses Object.hashCode() = memory address
    // Two equal AccountId objects hash to different buckets!
}

HashMap<AccountId, Account> map = new HashMap<>();
AccountId id1 = new AccountId("ACC001");
AccountId id2 = new AccountId("ACC001");

map.put(id1, account);
map.get(id2);  // returns null! id2.hashCode() ≠ id1.hashCode()
```

**Always override both, or neither (via IDE or Lombok `@EqualsAndHashCode`).**

### Load Factor and Resizing
- Default load factor: 0.75 (resize when 75% full)
- Resizing doubles the array and rehashes everything — O(n) one-time cost
- `new HashMap<>(expectedSize / 0.75 + 1)` pre-sizes to avoid resizing

---

### TreeMap and Comparable vs Comparator

```java
// TreeMap keeps entries sorted by key
// Key must be Comparable, OR you provide a Comparator

// Natural ordering (Comparable)
TreeMap<String, Account> byId = new TreeMap<>();  // String is Comparable

// Custom ordering (Comparator)
TreeMap<Account, BigDecimal> byBalance =
    new TreeMap<>(Comparator.comparing(Account::getBalance).reversed());

// Custom ordering for your own class
public class Transaction implements Comparable<Transaction> {
    @Override
    public int compareTo(Transaction other) {
        return this.timestamp.compareTo(other.timestamp);  // oldest first
    }
}
```

---

### ConcurrentHashMap (Thread-Safe Map)

```java
// HashMap is NOT thread-safe — concurrent writes corrupt the structure
// Do NOT do this with shared state:
Map<String, Account> accounts = new HashMap<>();  // multiple threads = data corruption

// ConcurrentHashMap — segments, each independently locked
Map<String, Account> accounts = new ConcurrentHashMap<>();

// For atomic operations
accounts.putIfAbsent("ACC001", newAccount);
accounts.computeIfAbsent("ACC001", id -> createAccount(id));
accounts.merge("ACC001", delta, Account::merge);
```

---

## 2. Generics

### Why they exist
Before Java 5, collections held `Object`. Every get() required a cast. ClassCastException at runtime. Generics moved that error to compile time.

```java
// Without generics (pre-Java 5 style — don't do this)
List accounts = new ArrayList();
accounts.add(new Account("A1"));
accounts.add("oops");             // compiles — no error!
Account a = (Account) accounts.get(1);  // ClassCastException at runtime

// With generics
List<Account> accounts = new ArrayList<>();
accounts.add(new Account("A1"));
accounts.add("oops");             // COMPILE ERROR — caught early
Account a = accounts.get(0);      // no cast needed
```

### Generic Classes and Methods

```java
// Generic class — T is a type parameter
public class Repository<T, ID> {
    private final Map<ID, T> store = new HashMap<>();

    public void save(T entity, ID id) { store.put(id, entity); }
    public Optional<T> findById(ID id) { return Optional.ofNullable(store.get(id)); }
    public List<T> findAll() { return new ArrayList<>(store.values()); }
}

// Generic method
public <T extends Comparable<T>> T max(List<T> items) {
    return items.stream().max(Comparator.naturalOrder()).orElseThrow();
}
```

### Bounded Type Parameters

```java
// Upper bound — T must be a Number or subtype
public <T extends Number> BigDecimal sum(List<T> amounts) {
    return amounts.stream()
        .map(n -> new BigDecimal(n.toString()))
        .reduce(BigDecimal.ZERO, BigDecimal::add);
}

// Wildcards
List<? extends Account> readAnyAccount(...)   // read-only, any Account subtype
List<? super SavingsAccount> addSavings(...)  // can add SavingsAccount or supertypes
```

### Type Erasure (why you cannot do `new T()`)
Java removes generic type info at runtime (erased to Object or upper bound).
This means:
- You cannot do `new T()` or `T.class` at runtime
- `instanceof List<String>` is a compile error (use `instanceof List<?>`)
- Generic array creation is not allowed: `new T[10]` → compile error

---

## 3. Streams API

### Why it exists
Processing collections used to require imperative for-loops with mutable variables. Streams enable **declarative** processing — describe WHAT you want, not HOW to iterate.

### The Pipeline
```
Source → Intermediate Operations (lazy) → Terminal Operation (triggers processing)
```

```java
List<Transaction> transactions = getTransactions();

// Imperative (old way)
List<Transaction> large = new ArrayList<>();
for (Transaction t : transactions) {
    if (t.getAmount().compareTo(new BigDecimal("10000")) > 0) {
        large.add(t);
    }
}
Collections.sort(large, Comparator.comparing(Transaction::getAmount).reversed());
// now print top 5...

// Declarative with Streams
List<Transaction> top5Large = transactions.stream()
    .filter(t -> t.getAmount().compareTo(new BigDecimal("10000")) > 0)  // intermediate
    .sorted(Comparator.comparing(Transaction::getAmount).reversed())    // intermediate
    .limit(5)                                                           // intermediate
    .collect(Collectors.toList());                                      // terminal
```

### Key Operations

```java
// filter — keep elements matching predicate
.filter(t -> t.getStatus() == Status.SUCCESS)

// map — transform each element
.map(t -> t.getAmount())
.map(Transaction::getAmount)   // method reference, same thing

// flatMap — flatten nested collections
.flatMap(account -> account.getTransactions().stream())

// distinct — remove duplicates (uses equals/hashCode)
.distinct()

// sorted — sort (natural or custom comparator)
.sorted(Comparator.comparing(Transaction::getTimestamp))

// limit / skip — pagination
.skip(page * size).limit(size)

// peek — for debugging only (do not use in production logic)
.peek(t -> log.debug("Processing: {}", t.getId()))

// collect — most common terminal
.collect(Collectors.toList())
.collect(Collectors.toSet())
.collect(Collectors.toMap(T::getId, t -> t))
.collect(Collectors.groupingBy(T::getType))
.collect(Collectors.joining(", "))

// reduce — accumulate
.reduce(BigDecimal.ZERO, BigDecimal::add)

// findFirst / findAny — short-circuits
.findFirst()  // returns Optional<T>

// anyMatch / allMatch / noneMatch — short-circuit predicates
.anyMatch(t -> t.getAmount().compareTo(limit) > 0)

// count / sum / average / min / max — statistics
.count()
.mapToLong(Transaction::getAmount).sum()
```

### Collectors.groupingBy — very powerful

```java
// Group transactions by type
Map<TransactionType, List<Transaction>> byType =
    transactions.stream()
        .collect(Collectors.groupingBy(Transaction::getType));

// Count per type
Map<TransactionType, Long> countByType =
    transactions.stream()
        .collect(Collectors.groupingBy(Transaction::getType, Collectors.counting()));

// Sum per account
Map<String, BigDecimal> sumByAccount =
    transactions.stream()
        .collect(Collectors.groupingBy(
            Transaction::getAccountId,
            Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
        ));
```

### Parallel Streams (use carefully)

```java
// Parallel processing — splits stream across multiple CPU cores
transactions.parallelStream()
    .filter(t -> heavyValidation(t))
    .collect(Collectors.toList());

// WARNING: parallelStream has overhead — only beneficial for:
// - Very large datasets (thousands+)
// - CPU-heavy operations (not I/O)
// - Stateless operations
// Bank transactions: usually NOT worth it — the DB query is the bottleneck
```

---

## 4. Lambda and Functional Interfaces

```java
// A lambda is a short anonymous implementation of a functional interface
// Functional interface = interface with exactly ONE abstract method

// Without lambda (anonymous class)
Comparator<Transaction> comp = new Comparator<Transaction>() {
    @Override
    public int compare(Transaction a, Transaction b) {
        return a.getAmount().compareTo(b.getAmount());
    }
};

// With lambda — same thing
Comparator<Transaction> comp = (a, b) -> a.getAmount().compareTo(b.getAmount());

// Method reference — even shorter when it's just delegating
Comparator<Transaction> comp = Comparator.comparing(Transaction::getAmount);
```

### Built-in Functional Interfaces

| Interface | Method | Use for |
|-----------|--------|---------|
| `Predicate<T>` | `boolean test(T t)` | `filter()`, conditions |
| `Function<T, R>` | `R apply(T t)` | `map()`, transformations |
| `Consumer<T>` | `void accept(T t)` | `forEach()`, side effects |
| `Supplier<T>` | `T get()` | factory, lazy evaluation |
| `BiFunction<T, U, R>` | `R apply(T t, U u)` | two inputs |
| `UnaryOperator<T>` | `T apply(T t)` | `map()` when T→T |

```java
Predicate<Account> isOverdrawn = acc -> acc.getBalance().compareTo(BigDecimal.ZERO) < 0;
Function<Account, String> toDisplayName = acc -> acc.getOwner() + " (" + acc.getId() + ")";
Consumer<Transaction> logTransaction = t -> log.info("TX: {} {}", t.getId(), t.getAmount());
Supplier<Account> defaultAccount = () -> new Account("DEFAULT", BigDecimal.ZERO);
```

---

## 5. Optional

### Why it exists
`NullPointerException` is called "the billion-dollar mistake" (Tony Hoare, the inventor of null). `Optional` makes the possibility of missing value **explicit in the type system**.

```java
// Without Optional — easy to forget null check
Account account = accountRepo.findById("ACC001");  // might return null
BigDecimal balance = account.getBalance();          // NPE if account is null

// With Optional — caller MUST handle the missing case
Optional<Account> account = accountRepo.findById("ACC001");
BigDecimal balance = account
    .map(Account::getBalance)
    .orElse(BigDecimal.ZERO);

// Patterns
optional.isPresent()                    // just check presence
optional.get()                          // DANGEROUS — throws if empty, avoid
optional.orElse(defaultValue)           // return default if empty
optional.orElseGet(() -> compute())     // lazy default (only computed if needed)
optional.orElseThrow(() -> new NotFoundException("Account not found"))
optional.map(Account::getBalance)       // transform if present, empty if not
optional.filter(acc -> acc.isActive())  // filter — empty if predicate fails
optional.ifPresent(acc -> log(acc))     // run action only if present
```

**Rules:**
- Never return `Optional<T>` from a field or constructor — use only as return type
- Never `Optional.get()` without `isPresent()` first — defeats the purpose
- Do not use `Optional` in collections — `List<Optional<T>>` is always wrong
- Spring Data JPA `findById()` returns `Optional<T>` — always use it

---

## 6. Concurrency

### Why it matters for banking
A bank account balance can be read and written by multiple threads simultaneously. Without proper synchronization, two concurrent withdrawals can both read balance = 1000, both subtract 500, and both write 500 — leaving the account at 500 instead of 0.

```
Thread 1: read balance=1000
Thread 2: read balance=1000
Thread 1: balance = 1000 - 500 = 500, write
Thread 2: balance = 1000 - 500 = 500, write  ← WRONG! Should be 0
```
This is a **race condition**. The account lost $500.

### Synchronized

```java
public class Account {
    private BigDecimal balance;

    // Method-level lock — only one thread in this method at a time
    public synchronized void debit(BigDecimal amount) {
        if (balance.compareTo(amount) < 0)
            throw new InsufficientFundsException(...);
        this.balance = this.balance.subtract(amount);
    }

    // Block-level — finer granularity
    public void transfer(Account target, BigDecimal amount) {
        synchronized (this) {           // lock this account
            synchronized (target) {     // lock target account
                this.debit(amount);
                target.credit(amount);
            }
        }
    }
}
```

**Deadlock:** Thread 1 holds lock on A, waits for B. Thread 2 holds lock on B, waits for A. Both wait forever.

**Fix:** Always acquire locks in the same global order (e.g., by account ID string comparison).

### AtomicInteger / AtomicLong / AtomicReference

```java
// For simple counters — faster than synchronized
private final AtomicLong transactionCounter = new AtomicLong(0);

public String generateTransactionId() {
    return "TX" + transactionCounter.incrementAndGet();
}

// Compare-and-swap (lock-free)
AtomicInteger version = new AtomicInteger(0);
version.compareAndSet(0, 1);  // only sets if current value is 0
```

### ExecutorService and Thread Pools

```java
// Never create threads manually in production
// new Thread(() -> ...).start()  ← bad — uncontrolled thread creation

// Use ExecutorService — manages a pool of reusable threads
ExecutorService pool = Executors.newFixedThreadPool(10);

// Submit tasks
Future<BigDecimal> futureBalance = pool.submit(() -> accountRepo.getBalance(id));

// Get result (blocks until done)
BigDecimal balance = futureBalance.get(5, TimeUnit.SECONDS);  // timeout!

// Always shut down
pool.shutdown();
pool.awaitTermination(30, TimeUnit.SECONDS);
```

### CompletableFuture (modern async in Java 8+)

```java
// Run async, chain operations
CompletableFuture<BigDecimal> result = CompletableFuture
    .supplyAsync(() -> accountRepo.getBalance(accountId))   // async
    .thenApply(bal -> bal.multiply(interestRate))           // transform
    .thenCompose(interest -> CompletableFuture.supplyAsync(
        () -> applyInterest(accountId, interest)))          // chain another async
    .exceptionally(ex -> {
        log.error("Interest calculation failed", ex);
        return BigDecimal.ZERO;
    });

// Combine two async operations
CompletableFuture<Account> fromAcc = CompletableFuture.supplyAsync(() -> getAccount(fromId));
CompletableFuture<Account> toAcc   = CompletableFuture.supplyAsync(() -> getAccount(toId));

CompletableFuture.allOf(fromAcc, toAcc)
    .thenRun(() -> performTransfer(fromAcc.join(), toAcc.join(), amount));
```

### Virtual Threads (Java 21 — Project Loom)

```java
// Traditional threads: OS-managed, expensive to create, ~1MB stack
// Virtual threads: JVM-managed, lightweight, millions possible

// Old way
Thread thread = new Thread(task);

// Virtual thread (Java 21)
Thread vThread = Thread.ofVirtual().start(task);

// With executor
try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> handleHttpRequest());  // one virtual thread per request
}
// This is how Spring Boot 3.2+ handles high concurrency without reactive programming
```

**Why banks care:** Virtual threads allow high-throughput APIs with simple blocking code — no need for reactive/WebFlux complexity.

---

## 7. Interview Questions — Phase 2

**Collections:**
1. What is the time complexity of ArrayList.get(i) vs LinkedList.get(i)?
2. Explain how HashMap works internally. What happens on hash collision?
3. Why must you override hashCode() when you override equals()?
4. When would you use TreeMap over HashMap?
5. What is the difference between HashMap and ConcurrentHashMap?
6. What is fail-fast behavior? What causes ConcurrentModificationException?

**Streams:**
1. What is the difference between map() and flatMap()?
2. Are intermediate stream operations lazy? Why does this matter?
3. When would you NOT use parallelStream()?
4. What does collect(Collectors.groupingBy(...)) return?

**Generics:**
1. What is type erasure? What can't you do at runtime because of it?
2. What is the difference between `? extends T` and `? super T`?

**Concurrency:**
1. What is a race condition? Give a banking example.
2. What is a deadlock? How do you prevent it?
3. What is the difference between synchronized and AtomicInteger?
4. What is CompletableFuture? How is it different from Future?
5. What are virtual threads? When should you use them?

---

## 8. Mini Project — Phase 2

**Extend Phase 1 bank project:**

1. Add `TransactionService` that uses Streams to:
   - Find all transactions above a threshold amount
   - Calculate total credits and debits per account
   - Return top 10 transactions by amount (sorted desc)
   - Group transactions by type and count each
   - Find the highest single transaction in the last 30 days

2. Add a `ReportGenerator` that:
   - Processes a list of accounts in parallel (parallelStream)
   - Returns `Map<AccountType, DoubleSummaryStatistics>` for balances
   - Uses `Optional` correctly — no null returns anywhere

3. Make `TransactionCounter` thread-safe using `AtomicLong`

4. Write a simulation: 100 threads simultaneously debit the same account.
   - First without synchronization — observe the race condition
   - Then fix it — prove correctness with assertions

---

## References

- Java Collections Tutorial: https://docs.oracle.com/javase/tutorial/collections/
- Baeldung Guide to HashMap: https://www.baeldung.com/java-hashmap
- Baeldung Streams: https://www.baeldung.com/java-8-streams
- Java Concurrency in Practice (Goetz) — Ch 2-5
- OpenJDK Project Loom: https://openjdk.org/projects/loom/
- Effective Java — Items 18, 26-32 (Generics), 78-84 (Concurrency)
