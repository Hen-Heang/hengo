# 개발 가이드 — REST API 마이크로서비스

> **적용 대상:** `REST_API` 유형 프로젝트
> **유형:** Spring Boot + Spring Cloud 멀티모듈 마이크로서비스
> **단일 출처:** `.claude/config/workspace.yaml` `projects[]` (type=REST_API)

---

## 1. 패키지 구조

모든 API 모듈의 기본 패키지는 `{{config.basePackagePattern}}.api.{module}` 이며, 아래 구조를 따른다. (`{{config.basePackagePattern}}` = `workspace.yaml` `basePackagePattern` 단일 출처)

```
{{config.basePackagePattern}}.api.{module}
  ├── controller/
  ├── service/
  │   ├── impl/
  │   ├── helper/
  │   ├── transaction/
  │   └── factory/
  ├── mapper/
  ├── model/
  │   ├── api/        ← HTTP 요청/응답 DTO (*Req, *Res, *ResRec##)
  │   ├── dto/        ← MyBatis 내부 DTO ({table}{CRUD}{###}{In|Out})
  │   └── external/   ← 외부 연동 DTO
  ├── configs/
  ├── handler/
  ├── filter/
  ├── constants/      ← 외부 API 전용 상수만 (예: KcbResponse, KmcResponse)
  └── util/
```

---

## 2. 클래스 명명 규칙

| 레이어             | 패턴                            | 예시                        |
| ------------------ | ------------------------------- | --------------------------- |
| Controller         | `{모듈도메인}{기능}Controller`  | `AccountUserController`     |
| Service 인터페이스 | `{모듈도메인}{기능}Service`     | `AccountPayCardService`     |
| Service 구현체     | `{모듈도메인}{기능}ServiceImpl` | `AccountPayCardServiceImpl` |
| Factory            | `{모듈도메인}{기능}Factory`     | `AccountPayCardFactory`     |
| Mapper             | `{모듈도메인}{기능}Mapper`      | `AccountUserMapper`         |

---

## 3. CRUD 명명 규칙

### 3-1. DB 테이블명 → camelCase 변환

DB 테이블명을 스네이크케이스에서 camelCase로 변환하여 Mapper 메소드명 및 DTO 클래스명의 접두사로 사용한다.

```
user_info        → userInfo
gfc_gift_ldgr    → gifcGiftLdgr
pay_ldgr         → payLdgr
api_trxn_hist    → apiTrxnHist
merc_emp_info    → mercEmpInfo
```

### 3-2. Mapper 메소드명

```
{tableNameCamelCase}{C|R|U|D}{###}(ParamType param)

C = INSERT : userInfoC001(UserInfoC001In in)                    → int
R = SELECT : userInfoR001(UserInfoR001In in)                    → UserInfoR001Out
U = UPDATE : userInfoU001(UserInfoU001In in)                    → int
D = DELETE : userTrmsAgreInfoD001(UserTrmsAgreInfoD001In in)   → int
```

- `###` 는 `001` 부터 시작하며, 동일 테이블·동일 작업이 여러 개일 경우 순번을 증가시킨다.
- **시퀀스/채번 예외**: `get{TableNameCamelCase}()` 패턴을 사용한다. 예: `getUserNo()`, `getWallId()`

### 3-3. model/dto/ DTO 클래스명 (Mapper와 1:1 매칭)

```
{TableNameCamelCase}{C|R|U|D}{###}{In|Out}

In  = Mapper 입력 파라미터
Out = Mapper 출력 결과

매칭 예:
  userInfoR001(UserInfoR001In)          → UserInfoR001Out
  gifcGiftLdgrC001(GifcGiftLdgrC001In) → int
  payLdgrR003(PayLdgrR003In)            → List<PayLdgrR003Out>
```

### 3-4. model/api/ HTTP DTO 클래스명

```
요청:        {FunctionName}Req            예: CardConfirmReq
응답:        {FunctionName}Res            예: CardConfirmRes
응답 레코드: {FunctionName}ResRec##       예: AlarmBoxListResRec01
```

---

## 4. Factory 패턴 (API 버전 관리)

API 버전 분기는 Factory 패턴으로 처리한다. URL 버전(`/v1/`, `/v2/`)에 따라 Factory가 적절한 ServiceImpl을 반환한다.

### Factory 표준 구조

```java
/**
 * {모듈}{기능} 서비스 팩토리 — API 버전에 따라 적절한 서비스 구현체를 반환한다.
 *
 * @author 작성자명
 * @since YYYY.MM.DD
 * @version 1.0
 */
@Component
@Slf4j
public class {모듈}{기능}Factory {
	private final Map<String, {모듈}{기능}Service> services = new HashMap<>();

	/**
	 * 서비스 구현체 목록을 주입받아 버전별로 등록한다.
	 *
	 * @param serviceList 등록할 서비스 구현체 목록
	 */
	public {모듈}{기능}Factory(List<{모듈}{기능}Service> serviceList) {
		serviceList.forEach(s -> services.put(s.version(), s));
	}

	/**
	 * 버전 문자열에 해당하는 서비스 구현체를 반환한다.
	 *
	 * @param version API 버전 문자열 (예: "V1", "V2")
	 * @return 버전에 맞는 {@link {모듈}{기능}Service} 구현체
	 * @throws ApiException 등록되지 않은 버전일 경우 ERROR_E998
	 */
	public {모듈}{기능}Service get{모듈}{기능}Service(final String version) {
		{모듈}{기능}Service service = services.get(version);
		if (service == null) {
			log.error("Invalid {모듈}{기능}Service VERSION :: {}", version);
			throw new ApiException(ResponseCode.ERROR_E998);
		}
		return service;
	}
}
```

### Service 인터페이스: version() 필수

```java
public interface AccountPayCardService {
	/**
	 * 이 서비스 구현체가 담당하는 API 버전을 반환한다.
	 *
	 * @return API 버전 문자열
	 */
	String version();

	// 비즈니스 메소드...
}
```

### ServiceImpl: version() 구현

```java
@Override
public String version() {
	return Constants.API_VERSION_1;  // "V1"
}
```

### Controller에서 사용

```java
factory.get{모듈}{기능}Service(Constants.API_VERSION_1).selectXxx(param);
```

### URL과 버전 매핑

```
URL: /{domain}/v1/{action} → Constants.API_VERSION_1
URL: /{domain}/v2/{action} → Constants.API_VERSION_2
```

---

## 5. Service 메소드명

```
CREATE → insert{Entity}{Action}()   예: insertCardConfirm()
READ   → select{Entity}{Action}()   예: selectUserInfo()
UPDATE → update{Entity}{Action}()   예: updateUserInfoChange()
DELETE → delete{Entity}{Action}()   예: deleteUserWithdrawConfirm()
```

---

## 6. 응답 템플릿 (ResponseTemplate)

- **원칙**: 모든 Controller의 API 응답은 반드시 `ResponseTemplate` 을 사용한다.
- **위치**: `{{config.basePackagePattern}}.api.common.templates.ResponseTemplate`

```java
// 1. 성공 + 데이터
new ResponseTemplate(ResponseCode.SUCCESS, data)

// 2. 에러만 (데이터 없음)
new ResponseTemplate(ResponseCode.ERROR_E001)

// 3. Service에서 반환한 ResponseTemplate 그대로 사용
ResponseTemplate response = factory.getXxxService(V1).selectXxx(req);
return ResponseEntity.ok(response);
```

- **금지**: `ResponseTemplate` 을 우회하여 직접 JSON 객체를 반환하지 않는다.

---

## 체크리스트

신규 기능 개발 시 아래 항목을 확인한다:

- [ ] 패키지 구조가 표준 레이아웃을 따르는가
- [ ] 클래스명이 레이어별 명명 패턴을 따르는가
- [ ] Mapper 메소드명이 `{table}{CRUD}{###}` 패턴을 따르는가
- [ ] DTO 클래스명이 Mapper 메소드명과 1:1 매칭되는가
- [ ] API 버전 분기가 Factory 패턴으로 처리되는가
- [ ] Service 인터페이스에 `version()` 메소드가 선언되어 있는가
- [ ] `ResponseCode` 가 `common` 모듈에만 정의되어 있는가
- [ ] 범용 상수가 `common` 모듈의 `Constants` 에만 정의되어 있는가
- [ ] 모든 Controller 응답이 `ResponseTemplate` 을 사용하는가
