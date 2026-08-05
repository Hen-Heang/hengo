// RFC 8414 Authorization Server Metadata, mirrored at this origin.
//
// This is normally the authorization server's own document. It is mirrored
// here because the Supabase project serves OIDC discovery but returns 404 for
// the RFC 8414 path, so a client that probes the resource origin (or the AS
// origin) for RFC 8414 metadata would otherwise find nothing. The document
// describes Supabase's endpoints — it does not make this app an authorization
// server. See docs/chatgpt-mcp-integration.md §3.2.
import { tryLoadMcpAuthConfig } from "@/lib/mcp/config"
import {
  buildAuthorizationServerMetadata,
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
  return metadataJsonResponse(buildAuthorizationServerMetadata(resolved.config))
}

export async function OPTIONS(): Promise<Response> {
  return metadataCorsPreflightResponse()
}
