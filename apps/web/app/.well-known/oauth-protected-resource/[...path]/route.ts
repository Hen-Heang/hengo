// RFC 9728 Protected Resource Metadata — path-suffixed form.
//
// RFC 9728 inserts the well-known segment ahead of the resource's path, so a
// resource at https://host/mcp is described at
// /.well-known/oauth-protected-resource/mcp. This handler answers that shape.
//
// The requested suffix must match the configured resource path: answering any
// path with the same document would let a client believe some other endpoint
// on this origin is a protected resource it is not.
import { tryLoadMcpAuthConfig } from "@/lib/mcp/config"
import {
  buildProtectedResourceMetadata,
  metadataCorsPreflightResponse,
  metadataJsonResponse,
} from "@/lib/mcp/metadata"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function normalise(path: string): string {
  return `/${path.split("/").filter(Boolean).join("/")}`
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const resolved = tryLoadMcpAuthConfig()
  if ("error" in resolved) {
    return Response.json({ error: "MCP is not configured on this deployment." }, { status: 503 })
  }

  const { path } = await context.params
  if (normalise(path.join("/")) !== normalise(resolved.config.resourceUrl.pathname)) {
    return Response.json({ error: "Unknown protected resource." }, { status: 404 })
  }

  return metadataJsonResponse(buildProtectedResourceMetadata(resolved.config))
}

export async function OPTIONS(): Promise<Response> {
  return metadataCorsPreflightResponse()
}
