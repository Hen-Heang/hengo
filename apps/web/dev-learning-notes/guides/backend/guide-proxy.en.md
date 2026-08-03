# Dev Guide — Proxy / Router (English Reference)

> English companion of `guide-proxy.md`. The Korean file is the original
> company rule. This version translates it, adds **💡 Why** explanations,
> and replaces workspace-only references with notes.
>
> **Applies to:** `PROXY` type projects — Spring Boot based proxy/routing
> services.
> *(The original pointed to `.claude/config/workspace.yaml` for the project
> list. That file belongs to the original workspace and is not in this repo.)*

💡 **What is a proxy service?** A small server that sits between a client
and a real backend. It does not contain business logic. It receives a
request, checks it (auth, logging, rate limit), and forwards it to the
right backend. In a bank: a gateway that receives card-network requests
and routes them to the internal payment service.

---

## 1. Package structure

The base package is `{{config.basePackagePattern}}.{project}`
(placeholder from the original template system — in practice something
like `com.company.gateway`). Structure is built around routing and
proxy logic:

```
com.company.{project}
  ├── {Project}Application.java
  ├── config/          ← Spring, Security, Route settings
  ├── constants/       ← ResultCode, Constants (defined inside this module)
  ├── filter/          ← request/response filters
  ├── handler/         ← global exception handler
  └── model/           ← request/response models (only if needed)
```

💡 **Why no `service/` or `repository/` package?** A proxy does not own
business data. If you find yourself adding a Service layer with real
logic, the logic probably belongs in the backend behind the proxy, not
in the proxy itself. Keeping the proxy thin makes it easy to reason
about and safe to restart.

💡 **Why filters?** In Spring, a `Filter` runs before the controller for
every request. A proxy's main jobs (check token, log the request,
forward it) are cross-cutting — they apply to ALL routes — so filters
are the natural home for them.

---

## 2. Class naming rules

Name classes by their role:

| Role | Pattern | Example |
|------|---------|---------|
| Filter | `{Domain}Filter` | `AuthFilter`, `RequestLoggingFilter` |
| Handler | `{Domain}Handler` | `GlobalExceptionHandler`, `RouteHandler` |
| Config | `{Domain}Config` | `RouteConfig`, `SecurityConfig` |

💡 **Why role-based names?** When an incident happens at 2 AM, the
on-call engineer must find the right class fast. `AuthFilter` says
exactly what it is and where it runs. A vague name like `AuthManager`
does not.

---

## 3. Characteristics

- **Routing/proxy centered** — the Service layer is missing or very
  light.
- **No Factory pattern by default** — a single routing flow is normal.
  Apply Factory only when the proxy must branch between multiple
  backends.
- Does NOT share `ResponseTemplate` / `ResponseCode` from the REST_API
  project's `common` module.

💡 **Why not share the common module?** Sharing a library couples the
proxy's deploy cycle to the API project. If the API team changes
`ResponseCode`, the proxy would need a rebuild too. A proxy must stay
independently deployable — it is often the first thing you restart
during an incident. This is the "shared library coupling" trade-off:
share only what is stable, copy what is small.

---

## 4. Response template

Define `ResponseTemplate` and `ResultCode` inside the module:

```java
// defined inside this module, not imported from common
public class ResponseTemplate {
    private String resultCode;   // e.g. "0000" = success
    private String resultMsg;    // human-readable message
    private Object data;         // payload (null on error)
    // getters, static factory methods like ok(), fail(code) ...
}
```

💡 **Why a fixed envelope?** Clients of a gateway (mobile apps, partner
banks) parse `resultCode` first. If every service returned a different
error shape, every client would need custom parsing per service. One
envelope = one parsing rule.

---

## Checklist

- [ ] Package structure follows the standard layout
- [ ] `ResponseTemplate` / `ResultCode` are defined inside the module
      (not imported from `common`)

💡 **Extra things a senior would also check** (not in the original, but
standard for proxies):

- [ ] Timeouts are set for calls to the backend (connect + read).
      A proxy without timeouts passes a backend hang to every client.
- [ ] The proxy does not log full request bodies (card numbers, tokens).
- [ ] Health check endpoint exists so the load balancer can detect a
      dead instance.

---

**Related in this repo:** `guide-api.md` (the REST API services this
proxy routes to), `incident-antipatterns.md` (IW02 — what happens when
async/forwarding queues accumulate failures).
