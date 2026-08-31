// OAuth discovery documents this MCP server publishes as a resource server.
//
// Two documents, both derived from lib/mcp/config.ts:
//
//  - RFC 9728 Protected Resource Metadata — tells a client which authorization
//    server issues tokens for this resource. Required by ChatGPT, which reads
//    it from the `WWW-Authenticate` header on a 401.
//  - RFC 8414 Authorization Server Metadata — normally the AS's own job. It is
//    mirrored here because the Supabase project does not serve one (see
//    docs/chatgpt-mcp-integration.md §3.2 and the deployment notes): Supabase
//    publishes only OIDC discovery, so a client that probes for RFC 8414
//    metadata gets a 404. The SDK supports exactly this mirroring.
import {
  buildOAuthProtectedResourceMetadata,
  getOAuthProtectedResourceMetadataUrl,
  type AuthMetadataOptions,
  type OAuthMetadata,
  type OAuthProtectedResourceMetadata,
} from "@modelcontextprotocol/server"
import { MCP_SERVER_TITLE } from "./server"
import type { McpAuthConfig } from "./config"

/**
 * Supabase's authorization-server metadata, transcribed from the project's
 * live OIDC discovery document.
 *
 * `registration_endpoint` is deliberately absent: dynamic client registration
 * is off, and advertising it would invite clients to self-register against a
 * Supabase project shared with another app (docs §3.5). Clients are
 * pre-registered by hand instead.
 */
export function buildAuthorizationServerMetadata(config: McpAuthConfig): OAuthMetadata {
  return {
    issuer: config.issuer,
    authorization_endpoint: config.authorizationEndpoint,
    token_endpoint: config.tokenEndpoint,
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    // Supabase issues only the standard OIDC scope set — there are no custom
    // read/write scopes to advertise (docs §4.2).
    scopes_supported: ["openid", "profile", "email", "offline_access"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post", "none"],
    // OAuth 2.1 requires PKCE; "plain" is not advertised even though the
    // upstream document lists it, so clients pick S256.
    code_challenge_methods_supported: ["S256"],
    // Supabase does not implement Client ID Metadata Documents yet.
    client_id_metadata_document_supported: false,
  }
}

export function authMetadataOptions(config: McpAuthConfig): AuthMetadataOptions {
  return {
    oauthMetadata: buildAuthorizationServerMetadata(config),
    resourceServerUrl: config.resourceUrl,
    resourceName: MCP_SERVER_TITLE,
    scopesSupported: ["openid"],
  }
}

/** The RFC 9728 document served at the well-known path. */
export function buildProtectedResourceMetadata(
  config: McpAuthConfig,
): OAuthProtectedResourceMetadata {
  return buildOAuthProtectedResourceMetadata(authMetadataOptions(config))
}

/**
 * Absolute URL of the protected-resource metadata for this server, advertised
 * in `WWW-Authenticate` on every 401.
 *
 * RFC 9728 inserts the well-known segment ahead of the resource path, so for a
 * resource at `https://host/mcp` this is
 * `https://host/.well-known/oauth-protected-resource/mcp` — not the bare
 * `/.well-known/oauth-protected-resource`. Both are served (see the route
 * handlers) because clients differ on which they request.
 */
export function protectedResourceMetadataUrl(config: McpAuthConfig): string {
  return getOAuthProtectedResourceMetadataUrl(config.resourceUrl)
}

/** Shared JSON response, CORS-enabled: discovery is read cross-origin. */
export function metadataJsonResponse(body: unknown): Response {
  return Response.json(body, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, MCP-Protocol-Version",
      "Cache-Control": "public, max-age=300",
    },
  })
}

export function metadataCorsPreflightResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, MCP-Protocol-Version",
      "Access-Control-Max-Age": "86400",
    },
  })
}
