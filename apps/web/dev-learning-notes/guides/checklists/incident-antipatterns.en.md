# Incident-Derived Anti-Patterns (English Reference)

> English companion of `incident-antipatterns.md`. The original is a
> **template with 2 example rules** — the company keeps a rulebook
> where every rule comes from a real production incident, and this
> file shows the format. This version translates it and adds
> **💡 Why** notes.

💡 **Why this document exists at all:** code conventions say "write it
this way." This file says "we already got burned — never again." Each
rule carries the ID of the incident that created it, so nobody can
argue it is theoretical. This is one of the most valuable documents a
team can own, because it turns one person's 2 AM outage into everyone's
permanent knowledge.

**How it is used:**

- **IC** (Incident-Critical) rules — patterns that directly caused an
  outage or money loss. Finding one **blocks the merge**.
- **IW** (Incident-Warning) rules — patterns that hurt stability,
  observability, or recovery. Finding one gets a **fix recommendation**.
- Every rule names its source incident (I3, I6, ...) for traceability.
- Reviewers comment in the form **"[IC01] rule name — incident I6
  regression risk"**.

### Incident index (examples)

| ID | Type | One-line description |
|----|------|---------------------|
| I3 | Resource exhaustion | async state-sync failures accumulated → OOM, many unsent notifications |
| I6 | Performance / duplication | long SQL + external retry without idempotency → duplicate payouts |

---

## 1. Incident-Critical (IC)

### IC01 — Payment / payout / approval API without idempotency

- **From incident:** I6 (external retry caused duplicate payouts)
- **Applies to:** every payment / payout / approval endpoint that an
  external system calls
- **Anti-pattern:**

  ```java
  // ❌ external caller times out and retries → processed twice
  @PostMapping("/pay/auto")
  public Response autoPay(@RequestBody AutoPayRequest req) {
      paymentService.process(req); // no duplicate-transaction check
      return Response.ok();
  }
  ```

- **Correct pattern:**

  ```java
  @PostMapping("/pay/auto")
  public Response autoPay(@RequestBody AutoPayRequest req) {
      // 1. check the external transaction id (idempotency key) first
      if (paymentService.existsByExternalTxId(req.getExternalTxId())) {
          return Response.duplicate(req.getExternalTxId()); // return the EXISTING result
      }
      // 2. UNIQUE constraint + INSERT (closes the race window)
      paymentService.processWithIdempotency(req);
      return Response.ok();
  }
  ```

- **DB reinforcement:** UNIQUE INDEX on the transaction-id column —
  this also blocks the concurrency race.

💡 **Why the UNIQUE index is the real fix, not the `exists` check:**
two identical requests can arrive at the same moment. Both run
`existsByExternalTxId`, both see "not found", both insert → duplicate
payout anyway. This is a TOCTOU race (time-of-check to time-of-use).
The `exists` check is a fast path for the common case; the UNIQUE
constraint is the guarantee — the second INSERT fails at the database
level no matter the timing. Catch that unique-violation exception and
return the existing result.

💡 **Why retries make this mandatory:** networks deliver
"at-least-once" in practice. The caller's timeout does NOT mean your
server did not process the request — it may have succeeded after the
caller gave up. The caller retries (it must), and without idempotency
you pay twice. Interview phrasing: *"timeout is not failure; it is
unknown outcome."*

---

## 2. Incident-Warning (IW)

### IW02 — Async accumulating work with no cleanup for failed items

- **From incident:** I3 (state-sync failures accumulated → OOM)
- **Applies to:** Kafka consumers, `@Async` jobs, notification daemons,
  retry queues
- **Anti-pattern:** failed items accumulate forever in a queue or
  state table — no retry limit, no TTL, no cleanup batch.
- **Correct pattern:**
  - retry count limit (`retry_count`) + dead-letter queue (DLQ)
  - move items older than N days to a separate table → keep the main
    queue small
  - alarm on accumulation threshold (e.g. pending-send count > N)

💡 **Why this fails slowly then all at once:** each failed item is
tiny. Day 1: 50 stuck rows, nobody notices. Day 90: two million rows —
the polling query that re-reads them slows down, memory for the batch
grows, then OOM. The system that dies is often NOT the one that caused
the failures. Rule of thumb: **any queue that can grow must have a
bounded size and an alarm**, because unbounded growth is just an
outage on a delay.

💡 **What a DLQ is:** a "dead letter queue" — after N failed retries,
move the item out of the live queue into a parking lot for humans to
inspect. The live queue stays healthy; the broken items are not lost.

---

## 3. How reviewers apply this

1. From the PR diff, identify the changed domain (auto-payout, payout
   approval, notifications, DB, external integration).
2. Match the domain's priority rules against the changed code.
3. On a match, comment as **"[ICnn] rule name — incident In regression
   risk"**.
4. **IC** blocks the merge; **IW** gets a fix recommendation plus a
   tracking issue.

### Example review comment

> **[IC01] payment API missing idempotency — I6 regression risk**
>
> `autoPayController.autoPay()` has no duplicate check on the external
> transaction id. If the external system retries after a timeout, the
> same transaction is processed twice (incident I6 — duplicate payout
> from external retry).
>
> **Recommendation:** UNIQUE INDEX on the transaction-id column +
> `existsByExternalTxId()` check at entry, returning the existing
> result.

---

## 4. Adding a new rule

When a new production incident happens:

1. Incident report → add the case to the incident index (I7, I8, ...)
2. If an anti-pattern can be extracted, add it here with an IC/IW id
3. Name the source incident id in the rule body
4. Update the domain priority table

💡 **The discipline that makes this work:** the rule is written while
the incident is fresh, with the real numbers (how much money, how many
hours). A rule added "because it seems risky" carries no weight; a rule
that says "this exact thing cost us I6" ends every code-review debate.

---

**Related in this repo:** `query-quality-check.en.md` (slow-SQL half of
incident I6), `../backend/guide-kafka.md` and `guide-redis.md` (the
async infrastructure where IW02 lives). Idempotency is also a Phase 7+
topic in `curriculum/ROADMAP.md` — this file is the real-world preview.
