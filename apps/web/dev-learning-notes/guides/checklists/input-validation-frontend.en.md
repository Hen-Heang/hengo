# Frontend Input Validation Check (English Reference)

> English companion of `input-validation-frontend.md`. The original is
> "step 4-1" of the company's automated frontend pipeline. This version
> translates it as a **human checklist**: run it whenever a screen has
> input fields with a fixed format. Adds **💡 Why** notes.

> **Real incident behind this rule:** a phone number input field
> shipped with no format validation at all. This checklist exists to
> stop that from happening again.

💡 **Frontend validation is UX, not security.** Its job is instant
feedback — the user sees "invalid phone number" before submitting, not
after a server round-trip. Security is the backend's job (see
`input-validation-backend.en.md`). You still must do BOTH.

---

## 1. Korean domain fields — required validation

| Field type | HTML5 native | JS regex | Display format |
|------------|--------------|----------|----------------|
| Mobile phone | `type="tel"` `pattern="01[016789]-?\d{3,4}-?\d{4}"` `maxlength="13"` | `/^01[016789]-?\d{3,4}-?\d{4}$/` | `010-1234-5678` |
| Resident registration no. (주민등록번호) | `pattern="\d{6}-?\d{7}"` `maxlength="14"` | `/^\d{6}-?\d{7}$/` (checksum recommended) | `900101-1234567` (back half: secure keypad) |
| Business registration no. (사업자번호) | `pattern="\d{3}-?\d{2}-?\d{5}"` `maxlength="12"` | `/^\d{3}-?\d{2}-?\d{5}$/` (checksum recommended) | `123-45-67890` |
| Corporation no. (법인번호) | `pattern="\d{6}-?\d{7}"` `maxlength="14"` | `/^\d{6}-?\d{7}$/` | `110111-1234567` |
| Postal code | `pattern="\d{5}"` `maxlength="5"` | `/^\d{5}$/` | `12345` |
| Card number | `pattern="[\d-]{16,19}"` `maxlength="19"` | `/^\d{4}-?\d{4}-?\d{4}-?\d{4}$/` | `1234-5678-9012-3456` |
| Email | `type="email"` `maxlength="100"` | `/^[\w.-]+@[\w.-]+\.\w{2,}$/` | `user@example.com` |
| Amount | `inputmode="numeric"` `pattern="[\d,]+"` | extract digits, then validate as integer | `1,000,000` |
| Date | `type="date"` or `pattern="\d{4}-\d{2}-\d{2}"` | `/^\d{4}-\d{2}-\d{2}$/` | `2026-05-06` |

💡 **Reading the phone regex** `^01[016789]-?\d{3,4}-?\d{4}$`:
`01` + one of `0,1,6,7,8,9` (Korean mobile prefixes 010/011/016/017/
018/019), optional dash, 3–4 digits, optional dash, 4 digits. The `-?`
accepts both `01012345678` and `010-1234-5678` — same rule as the
backend, on purpose.

💡 **Why "checksum recommended" for 주민등록번호/사업자번호:** the regex
only checks the *shape*. Both numbers have a check digit formula, so a
typo usually produces an invalid checksum. Format check catches
garbage; checksum catches typos.

💡 **Why `maxlength` even with a regex:** `maxlength` physically stops
typing at the limit — cheapest possible feedback, and it protects the
layout from absurdly long input before any JS runs.

---

## 2. Validation timing — apply all 3 layers

1. **HTML5 native** — browser built-ins: `pattern`, `required`,
   `maxlength`, `minlength`, `type`.
2. **While typing** (`blur` or `input` event) — JS regex check; on
   failure show an inline error message and change the field color.
3. **Just before submit** (`submit` event) — validate ALL fields at
   once; on failure move focus to the first failed field and block
   submission with `event.preventDefault()` or `return false`.

💡 **Why three layers and not one?** Each catches what the others
miss. Native attributes work even before your JS loads (or if it
crashes). Per-field checks give feedback at the moment of typing.
The submit check is the only one that sees the *whole form* — fields
the user never touched skip `blur` entirely, so without the submit
check an empty required field sails through.

---

## 3. Validation library per project (original workspace)

- Projects WITH the in-house BizJS library used its `bizjs.validate`
  module.
- Projects WITHOUT it wrote plain regex validation functions.
- *(The original named specific internal projects — `dino-saleoffice`,
  `dino-backoffice`, etc. The lesson that transfers: check what your
  project already has before writing your own validator, and follow
  `../frontend/common.md` "common library usage" rules.)*

---

## 4. Checklist

| Check | What to verify |
|-------|----------------|
| Format fields validated | phone / email / ID-number fields have `pattern` or JS regex |
| `required` | required fields have `required` attribute or JS check |
| `maxlength` / `minlength` | applied on length-limited fields |
| 3-layer timing | HTML5 native + while-typing + before-submit all present |
| Error messages | failure tells the user WHICH field is wrong, and why |
| Focus move | on submit failure, focus jumps to the first failed field |
| Submit blocked | invalid form cannot be submitted |

If you find a missing validation, include **before/after** in your PR
description.

---

**Related in this repo:** `input-validation-backend.en.md` (the
backend must repeat all of this — defense in depth),
`../frontend/common.md` (common frontend rules).
