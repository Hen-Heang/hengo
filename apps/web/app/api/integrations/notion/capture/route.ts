import { requireUser } from "@/lib/server/ai"

const NOTION_API_URL = "https://api.notion.com/v1/pages"
const NOTION_VERSION = "2026-03-11"

interface CaptureBody {
  title?: unknown
  content?: unknown
  tags?: unknown
  itemType?: unknown
}

function normalizeTitle(value: unknown, content: string): string {
  if (typeof value === "string" && value.trim()) return value.trim().slice(0, 200)
  const firstLine = content.split("\n").find((line) => line.trim())?.trim()
  return (firstLine || "Hengo capture").slice(0, 200)
}

export async function POST(req: Request) {
  const authed = await requireUser(req)
  if (authed instanceof Response) return authed

  const notionToken = process.env.NOTION_API_KEY
  const parentPageId = process.env.NOTION_CAPTURE_PARENT_PAGE_ID
  if (!notionToken || !parentPageId) {
    return Response.json(
      {
        error:
          "Notion capture is not configured. Add NOTION_API_KEY and NOTION_CAPTURE_PARENT_PAGE_ID in Vercel.",
        code: "notion_not_configured",
      },
      { status: 503 }
    )
  }

  let body: CaptureBody
  try {
    body = (await req.json()) as CaptureBody
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 })
  }

  const content = typeof body.content === "string" ? body.content.trim() : ""
  if (!content) return Response.json({ error: "Capture content is required." }, { status: 400 })
  if (content.length > 4000) {
    return Response.json({ error: "Capture content is too long for this export." }, { status: 400 })
  }

  const title = normalizeTitle(body.title, content)
  const tags = Array.isArray(body.tags)
    ? body.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 20)
    : []
  const itemType = typeof body.itemType === "string" ? body.itemType : "note"

  const metadata = [
    `Type: ${itemType}`,
    tags.length > 0 ? `Tags: ${tags.join(", ")}` : null,
    "Source: Hengo Quick Capture",
  ]
    .filter(Boolean)
    .join("\n")

  const markdown = `${content}\n\n---\n${metadata}`

  const res = await fetch(NOTION_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      parent: { page_id: parentPageId },
      properties: {
        title: {
          title: [{ type: "text", text: { content: title } }],
        },
      },
      markdown,
    }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => null)
    console.error("Notion capture export failed", {
      status: res.status,
      code: typeof error?.code === "string" ? error.code : undefined,
    })
    return Response.json(
      { error: "Hengo saved the capture, but Notion sync failed." },
      { status: 502 }
    )
  }

  const page = (await res.json()) as { url?: string | null }
  return Response.json({ url: page.url ?? null })
}
