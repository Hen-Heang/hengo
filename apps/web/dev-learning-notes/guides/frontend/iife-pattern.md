# 개발 가이드 — 프론트엔드 IIFE 패턴 (`UI.global` 네임스페이스)

> **적용 대상:** IIFE + `UI` 네임스페이스 패턴 적용 `SPRING_BOOT_WEB` 프로젝트
> **단일 출처:** `.claude/config/workspace.yaml` `projects[]` (`common.md` §1 기술 스택 표 참조)
>
> 공통 규칙(디렉토리, AJAX, DOM, 라이브러리, Thymeleaf, CSS, 보안)은 `common.md` 를 참조한다.

---

## 스코프 → 패턴 매핑

| 스코프       | JS 패턴                                       | 적용 섹션 |
| ------------ | --------------------------------------------- | --------- |
| `portal`     | IIFE + `UI` 네임스페이스                      | §4-4 |
| `online-pg`  | IIFE + `UI` 네임스페이스 + ES6 class 허용     | §4-4, §7-3 |

> **구별 기준**: 본 패턴은 단순 IIFE 래핑이 아닌 **`UI.global` 네임스페이스 사용**(`UI.modal.alert(...)` 등)이 핵심이다. `bizjs.*` 만 사용하고 `UI.*` 를 사용하지 않는 프로젝트(saleoffice / lspnoffice 등)는 `mvc-pattern.md` 를 따른다.

---

## 4. JavaScript 코딩 패턴

### 4-4. portal / online-pg 스코프 — IIFE + `UI` 네임스페이스

```javascript
(() => {
  "use strict";

  const PAGE_SIZE = 10;

  /**
   * 페이지 초기화.
   */
  function init() {
    bindEvents();
    loadData();
  }

  /**
   * 이벤트 바인딩.
   */
  function bindEvents() {
    $("#btnSearch").on("click", loadData);
  }

  /**
   * 데이터 조회.
   */
  function loadData() {
    $.ajax({
      url: "/api/payment/list",
      type: "POST",
      data: JSON.stringify({ pageSize: PAGE_SIZE }),
      contentType: "application/json",
      success(res) {
        if (res.resultCode === "0000") {
          renderData(res.data);
        } else {
          UI.modal.alert(res.resultMsg);
        }
      },
      error() {
        UI.modal.alert("서버 오류가 발생했습니다.");
      },
    });
  }

  $(document).ready(init);
})();
```

**online-pg 스코프 ES6 class 패턴** (허용):

```javascript
(() => {
  "use strict";

  /**
   * 결제 처리 클래스.
   */
  class PaymentProcessor {
    /**
     * @param {string} merchantId - 가맹점 ID
     */
    constructor(merchantId) {
      this.merchantId = merchantId;
      this.$form = $("#paymentForm");
    }

    /**
     * 결제 요청을 전송한다.
     */
    submit() {
      const formData = this.$form.serialize();
      $.ajax({
        url: "/api/payment/approve",
        type: "POST",
        data: formData,
        success: (res) => this.handleResponse(res),
        error: () => UI.modal.alert("결제 처리 중 오류가 발생했습니다."),
      });
    }

    /**
     * 응답 처리.
     *
     * @param {Object} res - 서버 응답
     */
    handleResponse(res) {
      if (res.resultCode === "0000") {
        UI.modal.alert("결제가 완료되었습니다.", () => {
          location.href = "/payment/complete";
        });
      } else {
        UI.modal.alert(res.resultMsg);
      }
    }
  }

  $(document).ready(function () {
    const processor = new PaymentProcessor(_merchantId_);
    $("#btnPay").on("click", () => processor.submit());
  });
})();
```

---

## 7. 오류 처리

### 7-3. online-pg 스코프 — try-catch 패턴

```javascript
async function processPayment(paymentData) {
  try {
    const res = await $.ajax({
      url: "/api/payment/process",
      type: "POST",
      data: JSON.stringify(paymentData),
      contentType: "application/json",
    });
    if (res.resultCode === "0000") {
      return res.data;
    }
    UI.modal.alert(res.resultMsg);
    return null;
  } catch (error) {
    UI.modal.alert("결제 처리 중 오류가 발생했습니다.");
    return null;
  }
}
```

> §7-2 응답 코드 기반 오류 처리(portal 적용)는 `common.md` 참조.
