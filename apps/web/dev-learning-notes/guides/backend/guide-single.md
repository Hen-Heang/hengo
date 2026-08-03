# 개발 가이드 — 단일 서비스 (Excel)

> **적용 대상:** `SINGLE_SERVICE` 유형 프로젝트 기본 가이드 (Excel 파일 생성·처리 등)
> **유형:** Spring Boot 기반 Excel 파일 생성·처리 서비스 (Apache POI)
> **단일 출처:** `.claude/config/workspace.yaml` `projects[]` (type=SINGLE_SERVICE, `guidelineOverride` 미지정)

---

## 1. 패키지 구조

기본 패키지는 `{{config.basePackagePattern}}.excel` 이며, 처리 유형별로 패키지를 구성한다.

```
{{config.basePackagePattern}}.excel
  ├── ExcelApplication.java
  ├── config/          ← Spring, Security 설정
  ├── constants/       ← ResultCode, Constants (모듈 자체 정의)
  ├── handler/         ← 전역 예외 핸들러 (REST endpoint 있을 경우)
  ├── model/           ← 요청/응답 모델
  ├── service/         ← 비즈니스 로직 (단순하면 직접 @Service)
  ├── processor/       ← Excel 데이터 처리 로직 (읽기·쓰기·변환)
  └── template/        ← Excel 템플릿 정의 (시트 구조, 스타일 등)
```

---

## 2. 클래스 명명 규칙

| 역할 | 패턴 | 예시 |
|------|------|------|
| 처리기 | `{Domain}ExcelProcessor` | `CardListExcelProcessor` |
| 템플릿 | `{Domain}ExcelTemplate` | `PaymentExcelTemplate` |
| 서비스 | `{Domain}ExcelService` | `CardExcelService` |

---

## 3. 서비스 메소드 명명

기능 기반으로 명명한다.

```
process{Entity}{Action}()   예: processCardListExport()
read{Entity}Excel()         예: readMerchantDataExcel()
generate{Entity}Report()    예: generatePaymentReport()
```

---

## 4. Apache POI 코딩 규칙

- `Workbook`, `Sheet` 등 POI 리소스는 `try-with-resources` 또는 `finally` 블록에서 반드시 닫는다.
- 대용량 파일 처리 시 `SXSSFWorkbook` (스트리밍 방식)을 사용하여 메모리 과부하를 방지한다.

```java
// ✅ 권장 — try-with-resources 사용
try (Workbook workbook = new XSSFWorkbook()) {
    Sheet sheet = workbook.createSheet("데이터");
    // ...
} catch (IOException e) {
    log.error("Excel 생성 오류 :: {}", LogUtil.getStackTrace(e));
    throw new ExcelException(ResultCode.ERROR_EXCEL_CREATE);
}

// ✅ 대용량 처리 — SXSSFWorkbook 사용
try (SXSSFWorkbook workbook = new SXSSFWorkbook(1000)) {
    // ...
}
```

---

## 5. 응답 템플릿

- REST endpoint를 제공하는 경우, 모듈 내 자체 `ResponseTemplate` 을 정의하여 사용한다.
- REST_API 프로젝트의 `common` 모듈 또는 타 모듈의 `ResponseTemplate` 을 공유하지 않는다.

---

## 6. Factory 패턴

복수의 Excel 템플릿 유형이 필요한 경우에만 적용한다. 단일 유형이면 불필요.

---

## 체크리스트

- [ ] 패키지 구조에 `processor/`, `template/` 이 구성되어 있는가
- [ ] `ResultCode` / `Constants` 를 모듈 내 자체 정의하는가 (common 모듈 미참조)
- [ ] POI 리소스가 `try-with-resources` 또는 `finally` 로 닫히는가
- [ ] 대용량 파일 처리 시 `SXSSFWorkbook` 을 사용하는가
- [ ] REST endpoint 제공 시 `ResponseTemplate` 이 모듈 자체 클래스로 사용되는가
