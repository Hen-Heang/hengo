# 개발 가이드 — Web MVC WAR

> **적용 대상:** `WEB_MVC` 유형 프로젝트
> **유형:** Spring Framework (non-Boot), WAR 패키징, Thymeleaf 뷰
> **단일 출처:** `.claude/config/workspace.yaml` `projects[]` (type=WEB_MVC)

---

## 1. 패키지 구조

기본 패키지는 `{{config.basePackagePattern}}.{project}` 이며, 아래 구조를 따른다.

```
{{config.basePackagePattern}}.{project}
  ├── config/              ← Spring, Security, Redis 설정
  ├── constants/           ← ResponseCode, Constants (모듈 내 자체 정의)
  ├── controller/          ← @Controller (도메인별 서브패키지)
  │   ├── {domain}/
  │   └── common/
  ├── exception/           ← 커스텀 예외 클래스
  ├── filter/              ← 서블릿 필터
  ├── handler/             ← 전역 예외 핸들러
  ├── interceptor/         ← 요청 인터셉터
  ├── mapper/              ← MyBatis @Mapper (도메인별 서브패키지)
  │   ├── {domain}/
  │   └── common/
  ├── model/
  │   └── repository/
  │       ├── request/     ← *InDTO 클래스 (도메인별 서브패키지)
  │       └── response/    ← *OutDTO 클래스 (도메인별 서브패키지)
  ├── service/             ← Service 인터페이스 (도메인별 서브패키지)
  │   └── impl/            ← ServiceImpl 구현체
  ├── template/            ← ResponseTemplate (모듈 내 자체 정의)
  └── util/                ← 모듈 전용 유틸리티
```

---

## 2. 클래스 명명 규칙

| 레이어 | 패턴 | 예시 |
|--------|------|------|
| Controller | `{Domain}Controller` | `UserController`, `DeliveryController` |
| Service 인터페이스 | `{Domain}Service` | `UserService` |
| Service 구현체 | `{Domain}ServiceImpl` | `UserServiceImpl` |
| Mapper | `{Domain}Mapper` | `UserMapper` |
| 요청 DTO | `{EntityName}InDTO` | `UserInDTO` |
| 응답 DTO | `{EntityName}OutDTO` | `UserOutDTO` |

**주의:**
- Factory 패턴 없음 — 직접 생성자 주입 방식 사용
- API 버전 분기(`version()`) 메소드 불필요

---

## 3. DTO 명명 규칙

### 3-1. 요청 DTO (InDTO)

- 패턴: `{EntityName}InDTO`
- 상위 클래스: `CommonInDTO` (공통 페이지네이션/검색 필드 포함)
- Lombok: `@Getter @Setter`

```java
@Getter
@Setter
public class UserInDTO extends CommonInDTO {
    String usagId;
    String userNo;
    String userNm;
    String mobn;
    // ... 도메인 필드
}
```

### 3-2. 응답 DTO (OutDTO)

- 패턴: `{EntityName}OutDTO`
- 상위 클래스: `CommonOutDTO` (`totalCount`, `seq` 필드 포함)
- Lombok: `@Getter @Setter`
- `@Alias` 미사용

```java
@Getter
@Setter
public class UserOutDTO extends CommonOutDTO {
    String userNm;
    String userNo;
    String mobn;
    // ... 조회 결과 필드
}
```

### 3-3. CommonInDTO / CommonOutDTO

```java
// CommonInDTO — 공통 입력 필드
@Getter
@Setter
public class CommonInDTO {
    String adminId;
    String searchText;
    String searchType;
    Integer pageSize;
    Integer searchPageNum;
    Boolean isSearch;
    String searchStartDay;
    String searchEndDay;
}

// CommonOutDTO — 공통 출력 필드
@Getter
@Setter
public class CommonOutDTO {
    Integer totalCount;   // 전체 레코드 수
    Integer seq;          // 시퀀스 번호
}
```

### 3-4. 페이지네이션 헬퍼

```java
// PagingOutDTO — 뷰 전달용 페이지 메타데이터
@Getter
@Setter
public class PagingOutDTO {
    Integer currentPage;
    Integer totalPage;

    public <I extends CommonInDTO> PagingOutDTO(I in, int totalCount) {
        this.currentPage = in.getSearchPageNum();
        this.totalPage = (int) Math.ceil((double) totalCount / in.getPageSize());
    }
}
```

---

## 4. Mapper 메소드 명명 규칙

REST_API 프로젝트의 `{table}{CRUD}{###}` 패턴을 따르지 않는다. 현행 명명 기준:

```
select{EntityName}ListPage(EntityNameInDTO)   → List<EntityNameOutDTO>
select{EntityName}DetailPage(EntityNameInDTO) → EntityNameOutDTO
insert{EntityName}Action(EntityNameInDTO)     → Boolean
update{EntityName}Action(EntityNameInDTO)     → Boolean
delete{EntityName}Action(EntityNameInDTO)     → Boolean
```

- 동일 엔티티에 여러 조회가 있을 경우 suffix로 `002`, `003` 등을 붙인다.
  예: `selectUserDetailPage002(...)`, `selectUserDetailPage003(...)`
- 반환 타입 `Boolean` 은 성공/실패 여부를 나타낸다.

---

## 5. 응답 패턴

### 5-1. Thymeleaf 뷰 응답 (페이지 이동)

- Controller 메소드가 `String` 을 반환하며 템플릿 경로를 나타낸다.
- Model 객체를 Service에 전달하여 뷰 속성을 설정한다.

```java
@PostMapping(value = "/listPage")
public String selectUserListPage(UserInDTO userInDTO, Model model) {
    userService.selectUserListPage(userInDTO, model);
    return "customer/userList";  // Thymeleaf 템플릿 경로
}
```

### 5-2. AJAX JSON 응답

- `@ResponseBody ResponseTemplate` 을 반환한다.
- `ResponseTemplate` 은 모듈 내 `template/` 패키지에 자체 정의되어 있다.
- `ResponseCode` 도 모듈 내 `constants/` 패키지에 자체 정의되어 있다.

```java
@PostMapping(value = "/detailAction")
public @ResponseBody ResponseTemplate updateUserDetailAction(UserInDTO userInDTO) {
    userService.updateUserDetailAction(userInDTO);
    return new ResponseTemplate(ResponseCode.SUCCESS.getCode(), "처리되었습니다.");
}
```

### 5-3. 레거시 패턴 (신규 코드 금지)

```java
// ❌ 금지 — 신규 코드에서 사용 불가
public @ResponseBody Map<String, Object> someAction() { ... }
```

---

## 6. Service 계층 패턴

### 서비스 인터페이스

```java
public interface UserService {
    void selectUserListPage(UserInDTO userInDTO, Model model);
    void selectUserDetailPage(UserInDTO userInDTO, Model model);
    void updateUserDetailAction(UserInDTO userInDTO);
    String insertUserDetailAction(UserInDTO userInDTO);
}
```

### 서비스 구현체

```java
@Service
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;

    public UserServiceImpl(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @Override
    public void selectUserListPage(UserInDTO userInDTO, Model model) {
        List<UserOutDTO> userList = userMapper.selectUserListPage(userInDTO);
        int totalCount = userList.isEmpty() ? 0 : userList.get(0).getTotalCount();
        PagingOutDTO paging = new PagingOutDTO(userInDTO, totalCount);
        model.addAttribute("userList", userList);
        model.addAttribute("paging", paging);
    }

    @Override
    public void updateUserDetailAction(UserInDTO userInDTO) {
        if (!userMapper.updateUserDetailAction(userInDTO)) {
            throw new JsonException(ResponseCode.MODIFY_FAIL.getMsg());
        }
    }
}
```

---

## 7. 주의사항

- **`ResponseCode`, `ResponseTemplate` 이 모듈 내 별도 존재** — `common` 모듈과 공유하지 않는다.
- `version()` 메소드 및 Factory 패턴은 이 유형에 적용하지 않는다.
- `@Alias` (MyBatis 타입 별칭)는 이 유형에서 사용하지 않는다.
- Lombok 어노테이션은 `@Getter @Setter` 만 사용한다. (`@Builder`, `@JsonInclude` 미사용)

---

## 8. 프론트엔드 개발 규칙

프론트엔드(JavaScript, CSS, Thymeleaf) 개발 시 반드시 별도 프론트엔드 가이드를 참조한다.

- **가이드 위치**:
  - [guide-frontend/common.md](guide-frontend/common.md) — 공통 규칙 (디렉토리, AJAX, DOM, 라이브러리, Thymeleaf, CSS, 보안)
  - [guide-frontend/mvc-pattern.md](guide-frontend/mvc-pattern.md) — Web MVC 프로젝트 JS 코딩 패턴
- **적용 대상**: `WEB_MVC` 유형 프로젝트의 정적 리소스 (`common.md` §1 기술 스택 표 참조)
- **핵심 사항**: 스코프별 JS 패턴은 `common.md` §1 표 + `mvc-pattern.md` §4 참조 (backoffice=전역 함수+customAjax, saleoffice=jQuery 플러그인+BizJS, webview=객체 리터럴+BizJS+UI.global)

---

## 체크리스트

신규 기능 개발 시 아래 항목을 확인한다:

- [ ] 패키지 구조가 표준 레이아웃을 따르는가
- [ ] DTO가 `CommonInDTO` / `CommonOutDTO` 를 올바르게 상속하는가
- [ ] Mapper 메소드명이 `select/insert/update/delete{EntityName}Action/ListPage/DetailPage` 패턴을 따르는가
- [ ] Thymeleaf 뷰 응답은 `String` 반환, AJAX 응답은 `@ResponseBody ResponseTemplate` 반환인가
- [ ] `ResponseCode`, `ResponseTemplate` 을 모듈 내 자체 클래스에서 참조하는가
- [ ] Lombok 어노테이션이 `@Getter @Setter` 만 사용되는가 (DTO 기준)
- [ ] 프론트엔드 가이드(`guide-frontend/common.md` + `guide-frontend/mvc-pattern.md`) 체크리스트 항목 준수 확인
