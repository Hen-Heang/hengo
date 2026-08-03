# Testing Requirements

> **적용 대상:** `**/*`

## 권장 테스트 커버리지: 80%

테스트 유형:
1. **Unit Tests** — Service, Util 등 개별 클래스/메소드 단위 검증
2. **Integration Tests** — Controller MockMvc, API 엔드포인트, DB 연동 검증
3. **E2E Tests** — Playwright MCP를 활용한 브라우저 기반 사용자 플로우 검증 (HTML 프로젝트만)

## 테스트 기술 스택

| 항목 | 기술 |
|------|------|
| Language | Java 17 |
| Framework | JUnit 5 |
| Mock | Mockito (`@Mock`, `@InjectMocks`, `@MockBean`) |
| Web MVC | `@WebMvcTest` + `MockMvc` |
| WebFlux | `WebTestClient` |
| Build/Run | Maven (`mvn test`, `mvn verify`) |
| E2E | Playwright MCP 도구 (브라우저 직접 조작) |

## Test-Driven Development

권장 워크플로:
1. 테스트 먼저 작성 (RED)
2. 테스트 실행 — 실패 확인
3. 최소 구현 작성 (GREEN)
4. 테스트 실행 — 통과 확인
5. 리팩토링 (IMPROVE)
6. 커버리지 확인 (목표: 80%+)

## 테스트 실행

```bash
# 전체 테스트
mvn test -pl {module}

# 특정 테스트 클래스
mvn test -pl {module} -Dtest={TestClassName}

# 커버리지 확인
mvn verify -pl {module}
```

## 테스트 실패 트러블슈팅

1. 테스트 격리 확인 (다른 테스트에 의존하지 않는지)
2. Mock 설정 검증 (`when/thenReturn` 누락, `any()` 매처 확인)
3. 구현을 수정한다, 테스트를 수정하지 않는다 (테스트가 잘못된 경우 제외)

## 커맨드 지원

| 커맨드 | 역할 |
|--------|------|
| `/qa-test {계획서.md}` | 테스트 계획서 기반으로 기존 테스트 실행 + 결과 집계 (GREEN/RED 판정) |
| `/qa-test {계획서.md} e2e` | 위 + Playwright E2E 테스트 추가 실행 |
