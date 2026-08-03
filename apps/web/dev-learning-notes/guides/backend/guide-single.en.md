# Dev Guide — Single Service (Excel) (English Reference)

> English companion of `guide-single.md`. The Korean file is the original
> company rule. This version translates it, adds **💡 Why** explanations,
> and replaces workspace-only references with notes.
>
> **Applies to:** `SINGLE_SERVICE` type projects — Spring Boot services
> that create/process Excel files with Apache POI.
> *(The original pointed to `.claude/config/workspace.yaml`. That file is
> not in this repo.)*

💡 **Why does a fintech company have a dedicated Excel service?**
Settlement and accounting teams live in Excel. "Download all card
payments for May as .xlsx" is a daily request. Generating a 500,000-row
Excel file inside the main API service would eat its memory and slow
down real payments. So Excel work is isolated into its own small
service that can be slow or restarted without touching payments.

---

## 1. Package structure

Base package is `{{config.basePackagePattern}}.excel` (template
placeholder — in practice e.g. `com.company.excel`). Organized by
processing type:

```
com.company.excel
  ├── ExcelApplication.java
  ├── config/          ← Spring, Security settings
  ├── constants/       ← ResultCode, Constants (defined inside this module)
  ├── handler/         ← global exception handler (if REST endpoints exist)
  ├── model/           ← request/response models
  ├── service/         ← business logic (simple cases: plain @Service)
  ├── processor/       ← Excel data processing (read / write / transform)
  └── template/        ← Excel template definitions (sheet structure, styles)
```

💡 **Why separate `processor/` from `template/`?** The *template* says
what the file looks like (columns, headers, styles). The *processor*
says how data flows into it (query, transform, write rows). When the
settlement team asks "add a column," you touch only the template. When
the file is too slow, you touch only the processor. Separation = each
change has one place to go.

---

## 2. Class naming rules

| Role | Pattern | Example |
|------|---------|---------|
| Processor | `{Domain}ExcelProcessor` | `CardListExcelProcessor` |
| Template | `{Domain}ExcelTemplate` | `PaymentExcelTemplate` |
| Service | `{Domain}ExcelService` | `CardExcelService` |

---

## 3. Service method naming

Name methods by function:

```
process{Entity}{Action}()   e.g. processCardListExport()
read{Entity}Excel()         e.g. readMerchantDataExcel()
generate{Entity}Report()    e.g. generatePaymentReport()
```

💡 **Why a verb pattern?** With a fixed verb set (process / read /
generate) you can guess a method's behavior without opening it. This
matters in a codebase with hundreds of mappers and services.

---

## 4. Apache POI coding rules

- POI resources (`Workbook`, `Sheet`, streams) MUST be closed —
  use `try-with-resources` or a `finally` block.
- For large files, use `SXSSFWorkbook` (streaming mode) to avoid
  memory overload.

```java
// ✅ recommended — try-with-resources
try (Workbook workbook = new XSSFWorkbook()) {
    Sheet sheet = workbook.createSheet("data");
    // ...
} catch (IOException e) {
    log.error("Excel creation error :: {}", LogUtil.getStackTrace(e));
    throw new ExcelException(ResultCode.ERROR_EXCEL_CREATE);
}

// ✅ large files — SXSSFWorkbook with a 1000-row window
try (SXSSFWorkbook workbook = new SXSSFWorkbook(1000)) {
    // ...
}
```

💡 **Why `SXSSFWorkbook`?** The normal `XSSFWorkbook` keeps EVERY row
in memory as Java objects. 500,000 rows × many cells = `OutOfMemoryError`
and the whole service dies. `SXSSFWorkbook(1000)` keeps only the last
1000 rows in memory and flushes older rows to a temp file on disk.
Memory stays flat no matter how big the file gets.

💡 **Why must POI resources be closed?** `SXSSFWorkbook` writes temp
files to disk. If you do not close/dispose it, temp files accumulate
until the disk is full — a classic slow-burn production incident
(nothing fails for weeks, then everything fails at once).

---

## 5. Response template

- If the module exposes REST endpoints, define its own
  `ResponseTemplate` inside the module.
- Do NOT share `ResponseTemplate` from the REST_API `common` module or
  any other module.

💡 **Why?** Same reason as the proxy guide: independent deploys. See
`guide-proxy.en.md` §3.

---

## 6. Factory pattern

Apply only when multiple Excel template types are needed. A single
type does not need a factory.

💡 **Why this warning exists:** juniors often add a Factory "for the
future." A factory with one product is pure overhead — more files, no
benefit. Add it at the moment you have a second template type, not
before. (This is the YAGNI principle: You Aren't Gonna Need It.)

---

## Checklist

- [ ] Package structure contains `processor/` and `template/`
- [ ] `ResultCode` / `Constants` defined inside the module (no `common` reference)
- [ ] POI resources closed via `try-with-resources` or `finally`
- [ ] `SXSSFWorkbook` used for large files
- [ ] REST endpoints (if any) use the module's own `ResponseTemplate`

---

**Related in this repo:** `guide-batch.md` (large data processing in
chunks — same memory thinking), `incident-antipatterns.md` (IW02 —
resource accumulation).
