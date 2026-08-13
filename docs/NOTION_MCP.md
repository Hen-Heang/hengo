# Notion MCP workflow

Hengo uses Notion for project planning and delivery notes without making
Notion part of the deployed application. Codex is the bridge: it can read a
task or document from Notion, change and validate this repository, then write
the implementation result back to Notion.

## Connection boundaries

| Connection | Purpose | Runtime effect |
| --- | --- | --- |
| Notion MCP | Let Codex read and update Hengo plans, tasks, and documentation in Notion | None; Hengo does not depend on Notion at runtime |
| Hengo MCP (`apps/web/app/mcp`) | Let approved AI clients use Hengo's bounded goal, task, and learning tools | Serves the deployed `/mcp` endpoint |
| Direct Hengo-to-Notion sync | Not configured | Avoids duplicated product data and unnecessary access to user data |

These are separate MCP connections. The Notion server is not a proxy for the
Hengo server, and Hengo's Supabase data is not copied into Notion.

## Project configuration

The public, project-scoped server definition is in `.codex/config.toml`:

```toml
[mcp_servers.notion]
url = "https://mcp.notion.com/mcp"
oauth_resource = "https://mcp.notion.com"
enabled = true
required = false
default_tools_approval_mode = "writes"
```

OAuth credentials are stored by Codex outside the repository. Never add a
Notion token, cookie, authorization header, or environment secret to this file.

From the repository root, verify or restore the local connection with:

```powershell
codex.cmd mcp list
codex.cmd mcp login notion
```

Open a new local Codex session after configuration if the Notion tools are not
visible in the current one. In the terminal UI, `/mcp` shows active servers.

## Notion workspace

- [Hengo Project Hub](https://app.notion.com/p/3b9acd8b74508151ac22ecff24718832?pvs=204)
- [Hengo Tasks](https://app.notion.com/p/40f87d1d3cc34199a198b8e260b309b9)

Use the native Notion task database instead of building a project-management
screen in Hengo. A normal delivery loop is:

1. Create or select a task in **Hengo Tasks**.
2. Ask Codex to read the task through Notion MCP and implement it in this repo.
3. Run the relevant lint, tests, and build checks.
4. Update the task with changed files, validation evidence, blockers, and the
   pull request or commit link.

## Data rules

- Git is the source of truth for code and implementation documentation.
- Supabase is the source of truth for Hengo web user data and authentication.
- Notion is the source of truth for plans, task status, decisions, and delivery
  notes.
- Do not copy credentials, environment values, private user data, recovery
  records, or journal content into Notion.
- Keep `apps/web` independent from `apps/api` unless a task explicitly changes
  that repository boundary.
- Any future automated or bulk synchronization needs its own data mapping,
  conflict policy, security review, and explicit approval.
