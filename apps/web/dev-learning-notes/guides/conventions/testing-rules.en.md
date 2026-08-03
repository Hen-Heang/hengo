# Testing Requirements (English Reference)

> English companion of `testing-rules.md`. The Korean file is the
> original company rule. This version translates it, adds **💡 Why**
> explanations and how-to detail, and marks workspace-only parts.
>
> **Applies to:** all files (`**/*`)

## Recommended test coverage: 80%

💡 **Why 80% and not 100%?** The last 20% (getters, config classes,
generated code) costs more time than the bugs it would catch. 80%
forces you to test all business logic without wasting time on
boilerplate. Important: coverage measures *executed lines*, not
*verified behavior* — a test with no assertions still "covers" lines.
Treat 80% as a floor, not a goal.

Test types:

1. **Unit Tests** — verify one class/method alone (Service, Util).
   Dependencies are replaced with mocks. Fast (milliseconds), run on
   every build.
2. **Integration Tests** — verify parts working together: Controller
   with MockMvc, API endpoints, DB access. Slower, but catch wiring
   mistakes unit tests cannot see.
3. **E2E Tests** — browser-based user flow tests (original workspace
   used Playwright via MCP; HTML projects only).

💡 **The test pyramid:** many unit tests, fewer integration tests, few
E2E tests. Unit tests are cheap and precise (a failure points at one
method). E2E tests are expensive and vague (a failure could be
anything). Build the base wide.

## Test technology stack

| Item | Technology |
|------|-----------|
| Language | Java 17 |
| Framework | JUnit 5 |
| Mock | Mockito (`@Mock`, `@InjectMocks`, `@MockBean`) |
| Web MVC | `@WebMvcTest` + `MockMvc` |
| WebFlux | `WebTestClient` |
| Build/Run | Maven (`mvn test`, `mvn verify`) |
| E2E | Playwright (original workspace: via MCP browser control) |

💡 **`@Mock` vs `@MockBean` — interview favorite:**

- `@Mock` (Mockito) — plain unit test, **no Spring context**. Use with
  `@InjectMocks` to inject mocks into the class under test. Very fast.
- `@MockBean` (Spring Boot) — starts a Spring context, then **replaces
  a real bean** in that context with a mock. Use in `@WebMvcTest` /
  `@SpringBootTest`. Much slower, because the context must load.
- Rule of thumb: testing a Service's logic → `@Mock`. Testing a
  Controller's request mapping/validation → `@WebMvcTest` + `@MockBean`
  for the service behind it.

```java
// Unit test — no Spring, fast
@ExtendWith(MockitoExtension.class)
class TransferServiceTest {
    @Mock AccountRepository accountRepository;   // fake dependency
    @InjectMocks TransferService transferService; // class under test

    @Test
    void transfer_fails_when_balance_too_low() {
        when(accountRepository.findBalance("A-1")).thenReturn(1000L);

        assertThatThrownBy(() -> transferService.transfer("A-1", "B-2", 5000L))
            .isInstanceOf(InsufficientBalanceException.class);
    }
}
```

## Test-Driven Development

Recommended workflow:

1. Write the test first (RED)
2. Run it — confirm it fails
3. Write the minimum implementation (GREEN)
4. Run it — confirm it passes
5. Refactor (IMPROVE)
6. Check coverage (target: 80%+)

💡 **Why confirm the RED step?** A test you never saw fail might be
testing nothing (wrong setup, wrong assertion). Seeing it fail first
proves the test can detect the bug it was written for.

## Running tests

```bash
# all tests in a module
mvn test -pl {module}

# one test class
mvn test -pl {module} -Dtest={TestClassName}

# one test method
mvn test -pl {module} -Dtest={TestClassName}#{methodName}

# verify phase (runs integration tests + coverage check)
mvn verify -pl {module}
```

💡 `mvn test` runs the *surefire* plugin (unit tests).
`mvn verify` additionally runs *failsafe* (integration tests, classes
named `*IT.java`) and any coverage gate (JaCoCo). That is why coverage
is checked with `verify`, not `test`.

## Troubleshooting failing tests

1. **Check test isolation** — does the test depend on another test
   running first? (shared static state, DB rows left behind, fixed
   ordering). Each test must pass alone: run it alone to confirm.
2. **Check mock setup** — missing `when/thenReturn`, or an `any()`
   matcher that does not match the real argument. A mock without
   stubbing returns null/0/false — a common source of confusing NPEs.
3. **Fix the implementation, not the test** — unless the test itself
   is wrong. A failing test is information; "making it pass" by
   weakening the assertion deletes that information.

💡 **Why isolation matters in CI:** test runners may run tests in a
different order, or in parallel, on the build server. A test that
passes locally and fails in CI is almost always an isolation problem.

## Command support (original workspace only)

The original workspace had a `/qa-test {plan.md}` command that ran the
tests listed in a test plan and reported GREEN/RED. That tooling is not
in this repo — listed here only so you know what the reference meant.

---

**Related in this repo:** `/java-junit` skill (JUnit 5 best practices,
parameterized tests), `incident-antipatterns.md` (what missing tests
cost in production).
