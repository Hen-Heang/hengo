// Sanitized error surface for tool calls.
//
// A thrown error's message never reaches the client verbatim — even the
// hand-written ones in tools/*.ts, since a future edit could accidentally
// introduce one that leaks a table or column name. The real error (with
// its stack) goes to the server console keyed by requestId; the client gets
// one fixed, internals-free sentence plus that same id so a report can be
// matched back to the log line that explains it.
export function sanitizeToolError(err: unknown, requestId: string): string {
  console.error(`[mcp:${requestId}]`, err)
  return `Something went wrong handling this request (reference: ${requestId}).`
}
