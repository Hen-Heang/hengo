import { getToken } from "@/lib/auth-store"
import { supabase } from "@/lib/supabase"

// Shared with the SSE routes (chat.ts streamMessage, goals.ts coachStream) so
// there's one place that attaches the caller's Supabase access token.
export async function authHeaders(): Promise<Record<string, string>> {
  const cachedToken = getToken()
  if (cachedToken) {
    return { Authorization: `Bearer ${cachedToken}` }
  }

  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Helper for the AI features that used to run on the Spring backend and now
// live in Next.js route handlers under app/api/ai/*. Attaches the Supabase
// access token; the route verifies it before spending AI credits.
export async function aiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/ai${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(body ?? {}),
  })
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error ?? `AI request failed (${res.status})`)
  }
  return (await res.json()) as T
}

