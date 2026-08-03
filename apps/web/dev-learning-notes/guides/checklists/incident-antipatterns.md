# Incident-Derived Anti-Patterns (EXAMPLE) — 운영 장애 기반 안티패턴 룰셋 템플릿

> **본 파일은 예시(example) 형식이다.** 아래에는 대표 룰 **2개**(IC 1 + IW 1)만 남겨 형식을 보인다.
> 도입 조직은 본 파일을 `incident-antipatterns.md` 로 복사한 뒤, 자체 운영 장애 사례로 룰을 추가한다.
>
> **위치:** `.claude/docs/anti-patterns/incident-antipatterns.md` (운영 경험 누적 지식 베이스 — `rules/` 의 정적 컨벤션과 분리)
> **적용 대상:** `**/*` (Java, MyBatis XML, JavaScript, Thymeleaf, 빌드/배포 설정)
> **사용 시점:** 코드 작성 (dev-backend / dev-frontend 회귀 차단 가드) + 코드 리뷰 (code-reviewer / mr-reviewer 매칭).
> **출처:** 조직 자체 장애 보고서 누적 + 운영 경험 기반 누적 룰 (아래 사례는 구조 예시).

---

## 0. 사용 방법

- 코드 작성·리뷰 시 본 문서의 **IC**(Incident-Critical) / **IW**(Incident-Warning) 패턴을 변경 코드에 매칭한다.
  - **코드 작성**: dev-backend / dev-frontend 가 회귀 차단 가드로 IC/IW ID 를 인용한다.
  - **코드 리뷰**: code-reviewer / mr-reviewer 가 변경 코드에 IC/IW 패턴 매칭 후 *"[ICnn] ... I{n} 사례 회귀 위험"* 형태로 코멘트한다.
- 각 룰은 **유래 장애 ID** 를 명시한다 → 트레이서빌리티 확보.
- 일반 코드 컨벤션은 `.claude/rules/bizplay-convention.md` / `base-rule.md` 가, 장애 회귀 차단은 본 문서가 담당한다 (역할 분리).

### 유래 장애 인덱스 (예시 — 조직 사례로 교체)

| ID  | 유형        | 한 줄 설명 (예시)                              |
| --- | ----------- | ---------------------------------------------- |
| I3  | 리소스 고갈 | 비동기 상태동기화 실패 누적 → OOM, 미발송 다수 |
| I6  | 성능/중복   | Long SQL + 외부 재시도 멱등성 부재 → 중복 지급 |

> 실제 사용 시 `발생일`·`시스템`·`피해 규모` 컬럼을 추가하고 조직 보고서 ID 와 매핑한다.

---

## 1. Incident-Critical (IC)

> 즉시 운영 장애·금전 사고로 직결된 패턴. 발견 시 **커밋 차단**.

### IC01 — 결제/지급/승인 API 멱등성 미적용

- **유래:** I6 (외부 재시도로 인한 중복 지급)
- **적용 영역:** Java REST API, 외부 시스템에서 호출 받는 모든 지급/결제/승인 엔드포인트
- **탐지 키워드:** `멱등성`, `idempotency`, `거래번호 중복 체크`, `중복 지급`, `재시도 안전`, `at-least-once`
- **안티패턴**:

  ```java
  // ❌ 외부에서 타임아웃 후 재요청 시 그대로 재처리됨
  @PostMapping("/pay/auto")
  public Response autoPay(@RequestBody AutoPayRequest req) {
      paymentService.process(req); // 거래번호 중복 체크 없음
      return Response.ok();
  }
  ```

- **모범 패턴**:

  ```java
  @PostMapping("/pay/auto")
  public Response autoPay(@RequestBody AutoPayRequest req) {
      // 1. 외부 거래번호(또는 idempotency-key) 사전 체크
      if (paymentService.existsByExternalTxId(req.getExternalTxId())) {
          return Response.duplicate(req.getExternalTxId()); // 기존 결과 반환
      }
      // 2. UNIQUE 제약 + INSERT (race 방지)
      paymentService.processWithIdempotency(req);
      return Response.ok();
  }
  ```

- **DB 보강:** 거래번호 컬럼에 UNIQUE INDEX 설치 → 동시성 race도 차단.
- **회귀 차단 사례:** I6.

---

## 2. Incident-Warning (IW)

> 즉시 장애로 이어지진 않지만 운영 안정성·관측성·복원력에 부정적 영향. 발견 시 **수정 권고**.

### IW02 — 비동기 누적 작업의 실패 누적 정리 로직 부재

- **유래:** I3 (상태 동기화 실패 누적 → OOM)
- **적용 영역:** Kafka 컨슈머, `@Async`, 알림 데몬, 재처리 큐
- **탐지 키워드:** `재처리`, `상태 동기화`, `발송 대기`, `발송 중`, `누적 처리`, `메모리 누수`
- **안티패턴:** 실패 건이 무한 누적되는 큐/상태 테이블, 한도/TTL/배치 정리 없음
- **모범 패턴:**
  - 재처리 시도 횟수 상한(`retry_count`) + DLQ
  - 일정 기간 경과 건 별도 적재 → 메인 큐 정리
  - 누적량 임계치 알람(예: 발송대기 N건 초과)
- **회귀 차단 사례:** I3.

---

## 3. 코드 리뷰 시 적용 절차

1. PR/diff에서 변경 도메인 식별 (자동지급·지급승인·알림·DB·외부연동)
2. 도메인별 1·2순위 룰을 기준으로 매칭 검사
3. 매칭 시 리뷰 코멘트에 **"[ICnn] 룰명 — 유래 사례 In"** 형태로 표기
4. **IC**(Critical)는 머지 차단, **IW**(Warning)는 수정 권고 + Tracking 이슈 등록

### 리뷰 코멘트 예시

> **[IC01] 결제/지급 API 멱등성 미적용 — I6 사례 회귀 위험**
>
> `autoPayController.autoPay()` 메소드에서 외부 거래번호 기반 중복 체크가 누락되었습니다. 외부 시스템이 타임아웃 후 재시도하면 동일 거래가 중복 처리될 수 있습니다 (I6 — 외부 재시도로 인한 중복 지급 사례).
>
> **권고:** 거래번호 컬럼에 UNIQUE INDEX 추가 + 진입부에서 `existsByExternalTxId()` 선행 체크 후 기존 결과 반환.

---

## 4. 신규 룰 추가 절차

새로운 운영 장애 발생 시:

1. 장애 보고서 → 조직 사례 저장소에 사례 추가 (I7, I8, ...)
2. 안티패턴이 도출되면 본 문서에 IC/IW ID 부여하여 추가
3. 유래 장애 ID(I7 등)를 룰 본문에 명시
4. 도메인별 적용 우선순위 표 갱신
