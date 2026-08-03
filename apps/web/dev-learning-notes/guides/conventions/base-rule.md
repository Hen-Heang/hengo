# Base Rule — 개발팀 공통 개발 규격

> **적용 대상:** `**/*`

---

## 1. 기밀 정보 보호 (원칙)

본 섹션은 **원칙(WHY)** 만 선언한다. 차단 패턴·실행 정책·우회 방식 등 실행 규칙(HOW) 단일 출처: [`.claude/skills/secrets-guard/SKILL.md`](../skills/secrets-guard/SKILL.md).

- **민감 정보 코드 노출 금지** — `resources` 하위 설정 파일의 DB 접속 정보·API Key·비밀번호 등은 코드·문서·로그에 하드코딩하지 않는다.
- **암호화 값 복호화 금지** — Jasypt `ENC(...)` 등 암호화 값은 원문 복원을 시도하지 않는다.
- **복호화 키 격리** — 복호화 키(`jasypt.encryptor.password` 등)는 코드·yml 하드코딩 금지, 환경 변수 / JVM 인수로만 주입.

```yaml
# ❌ 금지 — 복호화 키 하드코딩
jasypt:
  encryptor:
    password: mySecretKey

# ✅ 허용 — 환경 변수로 주입
jasypt:
  encryptor:
    password: ${JASYPT_ENCRYPTOR_PASSWORD}
```

> 차단 대상 파일·패턴 표·우회 시 동작 규칙: secrets-guard SKILL.md `## 차단 규칙` 참조. 본 원칙 위반 발견 시 secrets-guard 정책으로 자동 차단된다.

---

## 2. Git 브랜치 전략

브랜치 구조는 다음을 따른다:

```
main
├── develop
│   ├── release-{yyyy.MM.dd}-v{N}               ← 사업부 요청 배포 대상
│   │   └── feature/{과업번호}/{사용자 ID}         ← 과업 기반 기능 개발
│   ├── internal-{yyyy.MM.dd}-v{N}              ← 개발팀 자체 개선 배포 대상
│   │   └── feature/internal/{기능명}/{사용자 ID} ← 내부 기능 개발
└── hotfix/{버그수정명}/{사용자 ID}                ← 긴급 버그 수정 (main 기준)
```

| 브랜치 유형          | 네이밍 규칙                                 | 부모 브랜치 | 병합 대상         | 용도                       |
| -------------------- | ------------------------------------------- | ----------- | ----------------- | -------------------------- |
| `main`               | -                                           | -           | -                 | 운영 릴리즈 기준           |
| `develop`            | -                                           | `main`      | `main`            | 통합 개발 브랜치           |
| `release`            | `release-{yyyy.MM.dd}-v{N}`                 | `develop`   | `develop`         | 사업부 요청 배포 대상      |
| `internal`           | `internal-{yyyy.MM.dd}-v{N}`                | `develop`   | `develop`         | 개발팀 자체 개선 배포 대상 |
| `feature/*`          | `feature/{과업번호}/{git 사용자 ID}`        | `release`   | `release`         | 과업 기반 기능 개발        |
| `feature/internal/*` | `feature/internal/{기능명}/{git 사용자 ID}` | `internal`  | `internal`        | 내부 기능 개발             |
| `hotfix/*`           | `hotfix/{버그수정명}/{git 사용자 ID}`       | `main`      | `main`, `develop` | 운영 긴급 버그 수정        |

---

## 3. 작업 브랜치 원칙

- **`main`, `develop`, `release-*`, `internal-*` 브랜치에서 직접 작업하지 않는다.**
- 모든 작업은 반드시 `feature/*` 또는 `hotfix/*` 브랜치에서 진행한다.
- 작업 완료 후 GitLab Merge Request(MR)를 통해 부모 브랜치로 병합한다.

---

## 4. 커밋 전 코드 리뷰 원칙

- 커밋 이전에 반드시 **`/code-review`** 스킬(`.claude/skills/code-review/`)을 수행한다.
- 코드 리뷰 결과 **`WARNING`** 또는 **`CRITICAL`** 등급의 이슈가 존재할 경우 **커밋하지 않는다.**
- 모든 이슈를 해결한 후 재검토를 거쳐 커밋을 진행한다.

```
CRITICAL  → 즉시 수정 필수, 커밋 불가
WARNING   → 수정 후 커밋, 커밋 불가
INFO      → 참고 사항, 커밋 가능
```

---

## 5. Spring Boot 개발 규칙

- 모든 설정 값은 반드시 **`.yml` 형식**으로 작성한다. (`.properties` 사용 금지)
- 로그 처리는 반드시 **Logback**을 사용한다.
  - 로그 설정 파일: `logback-spring.xml`
  - 로그 레벨은 환경별로 분리 관리한다. (local / dev / prod)

---

## 6. 문서화 규칙 (JavaDoc)

- 모든 **클래스**와 **메소드**에는 반드시 **JavaDoc** 형식의 주석을 작성한다.

```java
/**
 * 사용자 정보를 조회하는 서비스 클래스.
 *
 * @author 작성자명
 * @since 2024.01.01
 * @version 1.0
 */
public class UserService {

    /**
     * 사용자 ID로 사용자 정보를 조회한다.
     *
     * @param userId 조회할 사용자 ID
     * @return 사용자 정보 {@link UserDto}
     * @throws UserNotFoundException 사용자가 존재하지 않을 경우
     */
    public UserDto findById(Long userId) { ... }
}
```

---

## 7. Git Commit 메시지 컨벤션

커밋 작업은 `/git commit` 사용 — 컨벤션은 `/git` 스킬의 `commit-convention.md` 가 단일 출처.

- TYPE: `ADD` / `CHANGE` / `DELETE` / `REVERT` / `MERGE`
- 형식: `{TYPE} : {메시지} (#{브랜치})`

---

## 8. DB 쿼리 공통 규칙

> **단일 출처**: vendor·schema·searchPath 활성 여부는 `.claude/config/workspace.yaml` `db.*` 가 마스터. 본 섹션은 `{{config.db.vendor}}`·`{{config.db.schema}}` 변수 치환 기반.

- **DB:** `{{config.db.vendor}}`, 운영 스키마 `{{config.db.schema}}`
- DB 연결에 `search_path` 가 설정되어 있으므로 (`workspace.yaml db.searchPathEnabled: true`) **테이블명에 스키마 접두사(`{{config.db.schema}}.`)를 붙이지 않는다.**

**적용 범위:**

- mapper XML (`*Mapper.xml`)
- Java embedded SQL / `JdbcTemplate` / `EntityManager` 네이티브 쿼리
- ad-hoc 조회 (`mcp__postgres__query`, psql, DBeaver 등 DB 클라이언트)
- 문서·가이드 예시 SQL

**예외:** 명시적으로 시스템 카탈로그를 조회할 때만 스키마 접두사를 사용한다 (`pg_catalog.*`, `information_schema.*`).

```sql
-- ❌ 금지
SELECT USER_ID FROM {{config.db.schema}}.TB_USER

-- ✅ 허용
SELECT USER_ID FROM TB_USER

-- ✅ 허용 (시스템 카탈로그)
SELECT table_name FROM information_schema.tables
```

---

## 체크리스트 요약

커밋 전 아래 항목을 반드시 확인한다:

- [ ] `src/**/resources/**/*.yml`, `src/**/resources/**/*.properties` 민감 정보 하드코딩 여부 확인
- [ ] `ENC(...)` Jasypt 암호화 값 복호화 시도 금지 확인
- [ ] Jasypt 복호화 키가 환경 변수로 주입되는지 확인
- [ ] 작업 브랜치가 `feature/*` 또는 `hotfix/*` 인지 확인
- [ ] SQL 작성 시 스키마 접두사(`{{config.db.schema}}.`) 미부착 확인 (workspace.yaml `db.searchPathEnabled: true` 일 때)
- [ ] `/code-review` 수행 완료 (WARNING / CRITICAL 없음)
- [ ] (권장) JUnit 테스트 케이스 작성 완료
- [ ] (권장) 테스트 커버리지 80% 이상 통과
- [ ] 클래스 및 메소드 JavaDoc 작성 완료
- [ ] 커밋 메시지 컨벤션 준수
