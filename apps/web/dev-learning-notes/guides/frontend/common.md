# 개발 가이드 — 프론트엔드 공통 (JS / CSS / Thymeleaf)

> **적용 대상:** `WEB_MVC` + `SPRING_BOOT_WEB` 유형 프로젝트의 정적 리소스
> **단일 출처:** `.claude/config/workspace.yaml` `projects[]` (type=WEB_MVC | SPRING_BOOT_WEB)
>
> 프로젝트별 JS 코딩 패턴(§4)과 패턴별 오류 처리(§7-1, §7-3)는 별도 파일을 참조한다:
> - `mvc-pattern.md` — WEB_MVC 패키징(WAR) + saleoffice 패턴 적용 프로젝트
> - `iife-pattern.md` — IIFE + `UI` 네임스페이스 패턴 프로젝트

---

## 1. 프론트엔드 기술 스택

> **단일 출처:** 본 표는 현재 워크스페이스의 프로젝트별 스택 인벤토리. 신규 프로젝트 추가 시 `.claude/config/workspace.yaml` `projects[]` 추가 + 본 표 갱신.

| 프로젝트        | jQuery | BizJS | UI.global | JS 패턴                                          | 패키징 |
| --------------- | ------ | ----- | --------- | ------------------------------------------------ | ------ |
| dino-backoffice | 3.7.1  | -     | -         | 전역 함수 + `customAjax()`                       | WAR    |
| dino-saleoffice | 3.7.1  | 1.0.2 | -         | jQuery 플러그인 + `bizjs.ajax`                   | WAR    |
| dino-webview    | 3.3.1  | 1.0.2 | O         | 객체 리터럴 네임스페이스                         | WAR    |
| dino-portal     | 3.7.1  | 1.0.2 | -         | BizJS 기반                                       | JAR    |
| dino-online-pg  | 3.7.1  | -     | O         | IIFE + `UI` 네임스페이스 + ES6 class             | JAR    |
| dino-lspnoffice | 3.7.1  | 1.0.2 | -         | jQuery 플러그인 + `bizjs.ajax` (saleoffice 패턴) | JAR    |

> **원칙:** 프로젝트별 기술 스택을 혼합하지 않는다. 신규 코드는 해당 프로젝트의 기존 패턴을 따른다.

---

## 2. 정적 리소스 디렉토리 구조

### WAR 프로젝트 (WEB_MVC 유형)

```
src/main/webapp/
  ├── static/
  │   ├── css/
  │   │   ├── common/        ← 공통 스타일
  │   │   └── {domain}/      ← 도메인별 스타일
  │   ├── js/
  │   │   ├── common/        ← 공통 JS (유틸, AJAX 래퍼 등)
  │   │   ├── lib/           ← 외부 라이브러리 (jQuery, BizJS 등)
  │   │   └── {domain}/      ← 도메인별 JS
  │   └── images/
  └── WEB-INF/
      └── templates/         ← Thymeleaf 템플릿 (.html)
          ├── common/
          ├── layout/
          └── {domain}/
```

### JAR 프로젝트 (SPRING_BOOT_WEB 유형)

```
src/main/resources/
  ├── static/
  │   ├── css/
  │   ├── js/
  │   │   ├── common/
  │   │   ├── lib/
  │   │   └── {domain}/
  │   └── images/
  └── templates/             ← Thymeleaf 템플릿 (.html)
      ├── common/
      ├── layout/
      └── {domain}/
```

---

## 3. JavaScript 파일 구성 규칙

### 3-1. 파일 분류

| 디렉토리       | 용도                                          | 수정 허용 |
| -------------- | --------------------------------------------- | --------- |
| `js/lib/`      | 외부 라이브러리 (jQuery, BizJS, UI.global 등) | 금지      |
| `js/common/`   | 프로젝트 공통 유틸, AJAX 래퍼, 공통 UI 처리   | 신중하게  |
| `js/{domain}/` | 도메인별 페이지 JS                            | 자유      |

### 3-2. 파일 명명 패턴

- **소문자 + 하이픈** (kebab-case): `user-list.js`, `payment-detail.js`
- **HTML/JS 1:1 매칭**: Thymeleaf 템플릿과 JS 파일을 동일 경로·동일 이름으로 매칭한다.
  ```
  templates/customer/userList.html  →  js/customer/user-list.js
  templates/payment/payDetail.html  →  js/payment/pay-detail.js
  ```

### 3-3. 외부 라이브러리 수정 금지

`js/lib/` 하위 파일은 직접 수정하지 않는다. 기능 확장이 필요하면 `js/common/` 에 래퍼를 작성한다.

---

## 5. 공통 코딩 규칙

### 5-1. 명명 규칙

| 대상             | 규칙                | 예시                                  |
| ---------------- | ------------------- | ------------------------------------- |
| jQuery 객체 변수 | `$` 접두사          | `$btnSearch`, `$tableBody`            |
| 이벤트 핸들러    | `on` + 동사         | `onClickSearch()`, `onChangeStatus()` |
| Boolean 변수     | `is` / `has` 접두사 | `isValid`, `hasPermission`            |

### 5-2. 변수 선언

```javascript
// ✅ 허용 — const 기본, let 필요시만
const PAGE_SIZE = 10;
const $table = $("#dataTable");
let currentPage = 1;

// ❌ 금지 — var 사용 (신규 코드)
var count = 0;
```

- **`const`** 를 기본으로 사용한다.
- **`let`** 은 재할당이 필요한 경우에만 사용한다.
- **`var`** 는 신규 코드에서 사용하지 않는다. (레거시 코드 유지보수 시에만 허용)

### 5-3. 코드 품질 / 함수 / 비교 / 매직 넘버

- **품질 원칙**: 가독성 우선, KISS / DRY / YAGNI.
- **함수**: 최대 50줄, 중첩 3단계 이하 (early return 활용), 단일 책임.
- **비교 연산자**: `===` / `!==` 엄격 비교 필수 (`==` / `!=` 금지).
- **매직 넘버 금지**: 숫자 리터럴 대신 명명된 상수(`const PAGE_SIZE = 10`)로 정의한다.

---

## 6. AJAX 통신 패턴

### 6-1. 프로젝트별 AJAX 호출 방식

> §1 기술 스택 표와 동기. 신규 프로젝트 추가 시 본 표·§1 표·`workspace.yaml` 함께 갱신.

| 프로젝트        | AJAX 방식                                              | 비고                        |
| --------------- | ------------------------------------------------------ | --------------------------- |
| dino-backoffice | `customAjax(url, method, data, statusCallbacks)`       | `js/common/` 에 정의된 래퍼 |
| dino-saleoffice | `bizjs.ajax.send({ url, type, data, success, error })` | BizJS 라이브러리            |
| dino-webview    | `bizjs.ajax.send({ url, type, data, success, error })` | BizJS 라이브러리            |
| dino-portal     | `bizjs.ajax.send(...)` 또는 `$.ajax(...)`              | BizJS 또는 jQuery           |
| dino-online-pg  | `$.ajax(...)`                                          | jQuery 직접 사용            |
| dino-lspnoffice | `bizjs.ajax.send({ url, type, data, success, error })` | BizJS 라이브러리 (saleoffice 패턴) |

### 6-2. 공통 AJAX 규칙

1. **CSRF 토큰**: POST/PUT/DELETE 요청 시 CSRF 토큰을 반드시 포함한다.
2. **로딩 인디케이터**: 사용자 경험을 위해 AJAX 호출 시 로딩 표시를 한다.
3. **오류 처리 필수**: `error` 콜백 또는 오류 핸들러를 반드시 구현한다.
4. **중복 요청 방지**: 버튼 클릭 시 중복 AJAX 호출을 방지한다.

```javascript
// ✅ 중복 요청 방지 예시
let isSubmitting = false;

function submitForm() {
  if (isSubmitting) {
    return;
  }
  isSubmitting = true;
  $.ajax({
    url: "/api/submit",
    type: "POST",
    data: $("#form").serialize(),
    success(res) {
      // 처리
    },
    error() {
      alert("오류가 발생했습니다.");
    },
    complete() {
      isSubmitting = false;
    },
  });
}
```

---

## 7. 오류 처리 (응답 코드 기반)

> §7-1 (statusCode 기반, backoffice 전용)은 `mvc-pattern.md` 참조.
> §7-3 (try-catch, online-pg 전용)은 `iife-pattern.md` 참조.

### 7-2. 응답 코드 기반 (BizJS 사용 스코프 — §1 표 참조)

```javascript
success: function (res) {
    if (res.resultCode === '0000') {
        // 성공 처리
    } else {
        // res.resultMsg 로 사용자에게 메시지 표시
        alert(res.resultMsg);
    }
},
error: function () {
    alert('서버 오류가 발생했습니다.');
}
```

---

## 8. DOM 조작 규칙

### 8-1. jQuery 셀렉터 캐싱

```javascript
// ❌ 금지 — 반복 셀렉터 사용
$("#dataTable tbody").empty();
$("#dataTable tbody").append(html);
$("#dataTable tbody").show();

// ✅ 권장 — 셀렉터 캐싱
const $tbody = $("#dataTable tbody");
$tbody.empty();
$tbody.append(html);
$tbody.show();
```

### 8-2. 이벤트 위임

동적으로 생성되는 요소에는 이벤트 위임을 사용한다.

```javascript
// ❌ 금지 — 동적 요소에 직접 바인딩 (동작하지 않음)
$(".btn-delete").on("click", deleteItem);

// ✅ 권장 — 이벤트 위임
$("#dataTable").on("click", ".btn-delete", function () {
  const id = $(this).data("id");
  deleteItem(id);
});
```

### 8-3. XSS 방지

- 사용자 입력은 `$.html()` 대신 `$.text()` 로 삽입한다.
- HTML 삽입이 필요한 경우 `document.createTextNode()` 기반 escape 함수로 감싼다.

---

## 9. 공통 라이브러리 사용 원칙

### 9-1. BizJS 모듈 (BizJS 사용 프로젝트 — §1 표 참조)

| 모듈             | 기능                                  |
| ---------------- | ------------------------------------- |
| `bizjs.ajax`     | AJAX 통신 래퍼 (CSRF, 로딩 자동 처리) |
| `bizjs.validate` | 폼 유효성 검사                        |
| `bizjs.format`   | 숫자/날짜/전화번호 포맷팅             |
| `bizjs.util`     | 공통 유틸리티                         |

### 9-2. UI.global 컴포넌트 (UI.global 사용 프로젝트 — §1 표 참조)

| 컴포넌트                 | 기능                                     |
| ------------------------ | ---------------------------------------- |
| `UI.modal` / `commModal` | 모달 다이얼로그 (alert, confirm, custom) |
| `UI.tab`                 | 탭 UI                                    |
| `UI.page`                | 페이지네이션                             |
| `UI.datepicker`          | 날짜 선택기                              |
| `UI.select`              | 셀렉트박스                               |

### 9-3. 사용 원칙

1. **직접 구현 전 기존 라이브러리를 반드시 확인한다.**
2. BizJS 모듈이 제공하는 기능을 중복 구현하지 않는다.
3. UI.global 컴포넌트가 있는 프로젝트에서는 네이티브 `alert()`, `confirm()` 대신 UI 컴포넌트를 사용한다.
4. 외부 라이브러리(`js/lib/`) 파일을 직접 수정하지 않는다.

---

## 10. Thymeleaf 연동 규칙

> WAR(`src/main/webapp/WEB-INF/templates/`)와 JAR(`src/main/resources/templates/`) 모두 동일하게 적용된다.

### 10-1. 서버 데이터 → JavaScript 전달

Thymeleaf `th:inline="javascript"` 를 사용하여 서버 데이터를 JavaScript 변수로 전달한다.

```html
<script th:inline="javascript">
  /*<![CDATA[*/
  const _userId_ = /*[[${userId}]]*/ "";
  const _pageSize_ = /*[[${pageSize}]]*/ 10;
  const _csrfToken_ = /*[[${_csrf.token}]]*/ "";
  /*]]>*/
</script>
<script th:src="@{/static/js/customer/user-list.js}"></script>
```

### 10-2. 전역 변수 명명

서버에서 주입되는 전역 변수는 **`_variableName_`** (언더스코어 감싸기) 패턴을 사용하여 일반 변수와 구분한다.

```javascript
// ✅ 서버 주입 전역 변수
const _userId_ = "...";
const _contextPath_ = "...";
const _csrfToken_ = "...";

// JS 파일에서 사용
function loadUserDetail() {
  bizjs.ajax.send({
    url: _contextPath_ + "/api/user/" + _userId_,
    // ...
  });
}
```

### 10-3. inline 이벤트 핸들러 금지

```html
<!-- ❌ 금지 — inline 이벤트 -->
<button onclick="deleteUser('U001')">삭제</button>

<!-- ✅ 권장 — data 속성 + JS 이벤트 바인딩 -->
<button class="btn-delete" data-user-id="U001">삭제</button>
```

```javascript
// JS 파일에서 이벤트 바인딩
$(".btn-delete").on("click", function () {
  const userId = $(this).data("userId");
  deleteUser(userId);
});
```

### 10-4. Thymeleaf Fragment 활용

공통 레이아웃(헤더, 푸터, 사이드바)은 Fragment로 분리한다.

```html
<!-- layout/header.html -->
<header th:fragment="header">
  <!-- 공통 헤더 -->
</header>

<!-- 페이지에서 사용 -->
<div th:replace="~{layout/header :: header}"></div>
```

---

## 11. CSS 규칙

### 11-1. 디렉토리 구조

```
css/
  ├── common/
  │   ├── reset.css          ← 브라우저 초기화
  │   ├── layout.css         ← 공통 레이아웃
  │   └── common.css         ← 공통 스타일
  ├── lib/                   ← 외부 CSS 라이브러리 (수정 금지)
  └── {domain}/              ← 도메인별 스타일
```

### 11-2. 브랜드별 디렉토리 (멀티 브랜드 프로젝트)

```
css/
  ├── {brand-1}/             ← 브랜드별 스타일 (예: iks/)
  └── {brand-2}/             ← 브랜드별 스타일 (예: tnj/)
```

> 브랜드 코드는 워크스페이스별로 다르다. 현재 워크스페이스의 브랜드 인벤토리는 프로젝트 루트 `CLAUDE.md` 참조.

### 11-3. 명명 규칙

- **클래스명**: kebab-case (소문자 + 하이픈): `btn-primary`, `card-list-item`
- **BEM-like 네이밍** 권장: `block__element--modifier`
  ```css
  .card-list {
  }
  .card-list__item {
  }
  .card-list__item--active {
  }
  ```
- **ID 셀렉터**: camelCase: `#searchForm`, `#dataTable`

### 11-4. 단위

- 폰트 크기: `rem` 단위 사용 권장
- 레이아웃: `px` 또는 `%` 허용
- `!important` 는 최소한으로 사용한다.

### 11-5. CSS 수정 원칙

- `css/lib/` 하위 파일은 직접 수정하지 않는다.
- UI 프레임워크 스타일 오버라이드는 `css/common/` 또는 도메인별 CSS에서 수행한다.

---

## 12. 보안 규칙

### 12-1. CSRF 토큰 (JS 특화)

POST/PUT/DELETE 요청 시 CSRF 토큰을 반드시 포함한다. Thymeleaf 가 주입한 `_csrfToken_` 을 `$.ajaxSetup()` 의 `X-CSRF-TOKEN` 헤더로 설정한다.

### 12-2. 금지 사항 (JS 특화)

- `eval(userInput)`, `new Function(userInput)()` — 임의 코드 실행 금지
- `element.innerHTML = userInput`, `$.html(userInput)` — XSS 위험 (§ 8-3 참조)

---

## 체크리스트

프론트엔드 작업 시 아래 항목을 확인한다:

- [ ] JS 파일이 프로젝트별 정적 리소스 디렉토리 구조를 따르는가
- [ ] JS 파일명이 kebab-case이며 HTML 템플릿과 1:1 매칭되는가
- [ ] 해당 프로젝트의 JS 코딩 패턴(전역 함수 / jQuery 플러그인 / 객체 리터럴 / IIFE)을 따르는가
- [ ] 변수 선언에 `const` 기본, `let` 필요시만 사용하는가 (`var` 금지)
- [ ] `===` / `!==` 엄격 비교를 사용하는가
- [ ] 매직 넘버 대신 명명된 상수를 사용하는가
- [ ] 함수 최대 50줄, 중첩 최대 3단계를 준수하는가
- [ ] AJAX 호출이 프로젝트별 패턴(`customAjax` / `bizjs.ajax.send` / `$.ajax`)을 따르는가
- [ ] AJAX 호출에 오류 처리가 구현되어 있는가
- [ ] 중복 AJAX 요청 방지가 적용되어 있는가
- [ ] jQuery 셀렉터가 캐싱되어 있는가
- [ ] 동적 요소에 이벤트 위임을 사용하는가
- [ ] 사용자 입력을 HTML로 삽입 시 XSS 방지 처리가 되어 있는가
- [ ] 직접 구현 전 BizJS / UI.global 기존 라이브러리를 확인했는가
- [ ] Thymeleaf 전역 변수가 `_variableName_` 패턴을 따르는가
- [ ] inline 이벤트 핸들러(`onclick` 등)를 사용하지 않았는가
- [ ] CSRF 토큰이 POST/PUT/DELETE 요청에 포함되는가
- [ ] JS 코드에 민감 정보(API Key, 비밀번호 등)가 하드코딩되지 않았는가
