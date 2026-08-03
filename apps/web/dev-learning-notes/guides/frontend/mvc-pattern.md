# 개발 가이드 — 프론트엔드 MVC 패턴 (전역 함수 / jQuery 플러그인 / 객체 리터럴)

> **적용 대상:** `WEB_MVC` 패키징(WAR) 프로젝트 + saleoffice 패턴 적용 `SPRING_BOOT_WEB` 프로젝트
> **단일 출처:** `.claude/config/workspace.yaml` `projects[]` (`common.md` §1 기술 스택 표 참조)
>
> 공통 규칙(디렉토리, AJAX, DOM, 라이브러리, Thymeleaf, CSS, 보안)은 `common.md` 를 참조한다.

---

## 스코프 → 패턴 매핑

| 스코프            | JS 패턴                                          | 적용 섹션 |
| ----------------- | ------------------------------------------------ | --------- |
| `backoffice`      | 전역 함수 + `customAjax()`                       | §4-1, §7-1 |
| `saleoffice`      | jQuery 플러그인 + `bizjs.ajax.send()`            | §4-2 |
| `webview`         | 객체 리터럴 네임스페이스 + BizJS + `commModal`   | §4-3 |
| `lspnoffice`      | jQuery 플러그인 + `bizjs.ajax.send()` (saleoffice 패턴) | §4-2 |

> **lspnoffice 주의**: SB Web 환경(JAR 패키징)이지만 JS 패턴은 §4-2 (saleoffice 패턴)을 따른다. `bizjs.*` 만 사용하며 `UI.global` 네임스페이스는 사용하지 않으므로 `iife-pattern.md`(portal/online-pg)와는 구별된다. §4-1(`customAjax`) / §4-3(객체 리터럴) 패턴은 lspnoffice에 적용하지 않는다.

---

## 4. JavaScript 코딩 패턴 (프로젝트별)

### 4-1. backoffice 스코프 — 전역 함수 + `customAjax()`

```javascript
$(document).ready(function () {
  initPage();
  bindEvents();
});

/**
 * 페이지 초기화 처리.
 */
function initPage() {
  // 초기 데이터 로드, UI 상태 설정
}

/**
 * 이벤트 바인딩 처리.
 */
function bindEvents() {
  $("#btnSearch").on("click", function () {
    searchList();
  });
}

/**
 * 목록 조회 AJAX 호출.
 */
function searchList() {
  customAjax("/api/user/list", "POST", $("#searchForm").serialize(), {
    200: function (data) {
      renderList(data);
    },
    422: function (data) {
      alert(data.message);
    },
    500: function () {
      alert("서버 오류가 발생했습니다.");
    },
  });
}
```

### 4-2. saleoffice / lspnoffice 스코프 — jQuery 플러그인 + `bizjs.ajax.send()`

```javascript
(function ($) {
  "use strict";

  /**
   * 페이지 초기화.
   */
  $(document).ready(function () {
    initPage();
    bindEvents();
  });

  function initPage() {
    // 초기화 로직
  }

  function bindEvents() {
    $("#btnSearch").on("click", searchList);
  }

  /**
   * 목록 조회.
   */
  function searchList() {
    bizjs.ajax.send({
      url: "/api/merchant/list",
      type: "POST",
      data: $("#searchForm").serialize(),
      success: function (res) {
        if (res.resultCode === "0000") {
          renderList(res.data);
        } else {
          alert(res.resultMsg);
        }
      },
      error: function () {
        alert("서버 오류가 발생했습니다.");
      },
    });
  }
})(jQuery);
```

### 4-3. webview 스코프 — 객체 리터럴 네임스페이스 + BizJS + `commModal`

```javascript
/**
 * 사용자 목록 페이지 모듈.
 */
const userList = {
  /**
   * 초기화.
   */
  init() {
    this.bindEvents();
    this.loadList();
  },

  /**
   * 이벤트 바인딩.
   */
  bindEvents() {
    $("#btnSearch").on("click", () => this.loadList());
    $("#btnRegister").on("click", () => this.openRegisterModal());
  },

  /**
   * 목록 조회.
   */
  loadList() {
    bizjs.ajax.send({
      url: "/api/user/list",
      type: "POST",
      data: $("#searchForm").serialize(),
      success: (res) => {
        if (res.resultCode === "0000") {
          this.renderList(res.data);
        } else {
          commModal.alert(res.resultMsg);
        }
      },
      error: () => {
        commModal.alert("서버 오류가 발생했습니다.");
      },
    });
  },

  /**
   * 목록 렌더링.
   *
   * @param {Array} list - 조회된 목록 데이터
   */
  renderList(list) {
    // DOM 렌더링 로직
  },
};

$(document).ready(function () {
  userList.init();
});
```

---

## 7. 오류 처리

### 7-1. backoffice 스코프 — statusCode 기반

```javascript
customAjax("/api/action", "POST", data, {
  200: function (data) {
    // 성공 처리
  },
  422: function (data) {
    alert(data.message || "입력 값을 확인해 주세요.");
  },
  500: function () {
    alert("서버 오류가 발생했습니다.");
  },
});
```

> §7-2 응답 코드 기반 오류 처리(saleoffice / webview / portal / lspnoffice 적용)는 `common.md` 참조.
