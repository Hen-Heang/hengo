// RFC 9728 Protected Resource Metadata — bare well-known path.
//
// Served alongside the path-suffixed variant in [...path]/route.ts, because
// clients differ on which they request (docs/chatgpt-mcp-integration.md §3.2).
import { tryLoadMcpAuthConfig } from "@/lib/mcp/config"
import {
  buildProtectedResourceMetadata,
  metadataCorsPreflightResponse,
  metadataJsonResponse,
} from "@/lib/mcp/metadata"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(): Promise<Response> {
  const resolved = tryLoadMcpAuthConfig()
  if ("error" in resolved) {
    return Response.json({ error: "MCP is not configured on this deployment." }, { status: 503 })
  }
  return metadataJsonResponse(buildProtectedResourceMetadata(resolved.config))
}

export async function OPTIONS(): Promise<Response> {
  return metadataCorsPreflightResponse()
}
