# Backend Input Validation Check (English Reference)

> English companion of `input-validation-backend.md`. The original is
> "step 4-2" of the company's automated dev pipeline. This version
> translates it as a **human checklist**: run it whenever a Controller
> or Service receives outside input (HTTP parameters, external API
> responses, batch job input). Adds **💡 Why** notes.

> **Real incident behind this rule:** the frontend forgot to validate a
> phone number field, and bad data reached the server. Backend Bean
> Validation is the **last line of defense** against requests that
> bypass the frontend — so the backend must repeat every check the
> frontend does.

💡 **Why never trust the frontend?** The frontend runs on the user's
machine. Anyone can skip it entirely — curl, Postman, a modified app —
and hit your API directly. Frontend validation is for user experience
(fast feedback). Backend validation is for security and data
integrity. You need both; only the backend one is a guarantee.

---

## 1. `@Valid` on every Controller input

Every `@RequestBody` / `@ModelAttribute` DTO must have `@Valid`.
Catch failures with `BindingResult` and return the standard response:

```java
@PostMapping("/api/farmer/apply")
public ResponseTemplate apply(@Valid @RequestBody FarmerApplyIn in, BindingResult result) {
    if (result.hasErrors()) {
        return ResponseTemplate.fail(ResponseCode.INVALID_PARAM, result);
    }
    // ...
}
```

💡 **Why `@Valid` is easy to forget:** the annotations on the DTO
(`@NotBlank`, `@Pattern`...) do NOTHING by themselves. They only run
when something triggers validation — and in a controller, that trigger
is `@Valid` on the parameter. A DTO full of constraints with no
`@Valid` validates nothing. This is the #1 validation bug in code
review.

💡 **`BindingResult` position rule:** it must come **immediately
after** the `@Valid` parameter. If you omit `BindingResult` entirely,
Spring throws `MethodArgumentNotValidException` instead — then you
handle it in a `@RestControllerAdvice` handler. Both patterns are
valid; this company chose explicit `BindingResult`.

---

## 2. Bean Validation annotations for DTOs

| Annotation | Use | Example |
|------------|-----|---------|
| `@NotNull` | block null | `@NotNull private String userId;` |
| `@NotBlank` | block null / empty / whitespace-only string | `@NotBlank private String name;` |
| `@NotEmpty` | block null / empty collection | `@NotEmpty private List<String> items;` |
| `@Size(min, max)` | string/collection length | `@Size(max = 100) private String email;` |
| `@Pattern(regexp)` | regex match | `@Pattern(regexp = "^01[016789]\\d{7,8}$") private String phone;` |
| `@Email` | email format | `@Email private String email;` |
| `@Min(N)` `@Max(N)` | number range | `@Min(0) @Max(999) private Integer age;` |
| `@Positive` `@PositiveOrZero` | > 0 / >= 0 | `@Positive private Long amount;` |

💡 **`@NotNull` vs `@NotBlank` vs `@NotEmpty` — interview favorite:**

- `@NotNull` — only rejects null. `""` and `"   "` pass.
- `@NotEmpty` — rejects null and empty. `"   "` (spaces) still passes.
  Also works on collections.
- `@NotBlank` — strings only: rejects null, empty, AND whitespace-only.
- For required text fields, `@NotBlank` is almost always what you want.

💡 **Why `@Positive` on amounts matters in fintech:** a transfer API
that accepts `amount = -50000` without validation just *reversed the
direction of the money*. Negative-amount bugs are real, famous, and
expensive. Every money field gets `@Positive` (or `@PositiveOrZero`
when zero is legal) plus a `@Max` sanity cap.

---

## 3. Korean domain field regex (must match the frontend)

These regexes must be **identical** to the frontend's
(see `input-validation-frontend.en.md` §1):

| Field | `@Pattern` regex |
|-------|------------------|
| Mobile phone | `^01[016789]-?\\d{3,4}-?\\d{4}$` |
| Business registration no. | `^\\d{3}-?\\d{2}-?\\d{5}$` |
| Corporation no. | `^\\d{6}-?\\d{7}$` |
| Postal code | `^\\d{5}$` |
| Card number | `^\\d{4}-?\\d{4}-?\\d{4}-?\\d{4}$` |

💡 **Why "identical to frontend" is a rule:** if frontend allows
`010-1234-5678` (with dashes) but backend only accepts `01012345678`,
every legitimate user gets rejected by the backend — an outage caused
by validation drift. The `-?` in these patterns accepts both forms;
normalize (strip dashes) in one agreed place before saving.

---

## 4. Checklist

| Check | What to verify |
|-------|----------------|
| Controller `@Valid` | every method receiving outside input has `@Valid` |
| DTO annotations | required / length / format constraints all declared as annotations |
| Korean domain regex | phone, business no. etc. have `@Pattern`, identical to the frontend regex |
| `BindingResult` handling | validation failure returns the standard `ResponseTemplate` (e.g. `INVALID_PARAM`) |
| Frontend-bypass defense | backend repeats every frontend check (defense in depth) |

If you find a missing validation, include **before/after** in your PR
description.

> *Original-workspace note:* the original file said the Bean Validation
> section was missing from `guide-api.md` and a teammate was adding it;
> after that, this checklist would just reference the guide. That
> migration belongs to the original workspace — in this repo, this file
> is the reference.

---

**Related in this repo:** `input-validation-frontend.en.md` (the
matching frontend checks), `../backend/guide-api.md` (REST API
structure this plugs into).
