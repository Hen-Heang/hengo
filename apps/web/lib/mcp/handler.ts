// Composition of the authenticated MCP endpoint: bearer gate → MCP handler.
//
// Kept out of the route file so the whole pipeline — including the 401 paths —
// can be driven directly in tests with a real verifier over a locally minted
// key pair, rather than only through a running Next.js server.
import {
  createMcpHandler,
  requireBearerAuth,
  type AuthInfo,
  type OAuthTokenVerifier,
} from "@modelcontextprotocol/server"
import { createHengoMcpServer } from "./server"
import { protectedResourceMetadataUrl } from "./metadata"
import type { McpAuthConfig } from "./config"

export interface AuthenticatedMcpHandler {
  fetch: (request: Request) => Promise<Response>
  close: () => Promise<void>
}

/**
 * Builds the endpoint handler.
 *
 * Every request — including `initialize` and `tools/list` — passes the bearer
 * gate first. There is no public tool and no unauthenticated method: the
 * documented design authenticates the whole endpoint (docs §3, §4), so
 * `get_hengo_server_info` is protected like everything else. An unauthenticated
 * caller learns only that the endpoint exists and where to get a token.
 */
export function createAuthenticatedMcpHandler(
  config: McpAuthConfig,
  verifier: OAuthTokenVerifier,
): AuthenticatedMcpHandler {
  const handler = createMcpHandler(() => createHengoMcpServer())

  // On failure this produces the RFC 9728 challenge:
  //   401 + WWW-Authenticate: Bearer ..., resource_metadata="<url>"
  // which is how ChatGPT discovers the authorization server.
  const gate = requireBearerAuth({
    verifier,
    resourceMetadataUrl: protectedResourceMetadataUrl(config),
  })

  return {
    async fetch(request: Request): Promise<Response> {
      const auth: AuthInfo | Response = await gate(request)
      if (auth instanceof Response) return auth
      // The verified AuthInfo is passed through explicitly; the MCP handler
      // never reads credentials from headers itself.
      return handler.fetch(request, { authInfo: auth })
    },
    close: () => handler.close(),
  }
}
