// Auth state, backed by the Supabase session (supabase-js persists it in
// localStorage under SUPABASE_STORAGE_KEY). The exported function names are kept
// from the Spring-JWT era so callers don't change; user ids are now Supabase
// auth UUIDs (string), not numeric backend ids.
import { supabase, SUPABASE_STORAGE_KEY } from "@/lib/supabase"

type StoredSession = {
  access_token?: string
  refresh_token?: string
  user?: { id?: string; email?: string }
}

// Synchronous session read for render-time guards (supabase.auth.getSession()
// is async). supabase-js keeps this key in sync on login/refresh/logout.
function readSession(): StoredSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(SUPABASE_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredSession) : null
  } catch {
    return null
  }
}

export function getToken(): string | null {
  return readSession()?.access_token ?? null
}

export function getUserId(): string | null {
  return readSession()?.user?.id ?? null
}

export function getUserEmail(): string | null {
  return readSession()?.user?.email ?? null
}

export function isAuthenticated(): boolean {
  return Boolean(getToken())
}

/** getUserId(), but throws instead of returning null — the common case in lib/api/*.ts writes. */
export function requireUserId(): string {
  const userId = getUserId()
  if (!userId) throw new Error("Not signed in")
  return userId
}

export async function clearAuth() {
  await supabase.auth.signOut()
}

/* ── Spring backend implementation (kept for later restore) ──────────────────
const TOKEN_KEY = "token"
const REFRESH_TOKEN_KEY = "refreshToken"
const USER_ID_KEY = "userId"
const EMAIL_KEY = "userEmail"

export function setAuth(token: string, refreshToken: string, userId: number, email: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  localStorage.setItem(USER_ID_KEY, String(userId))
  localStorage.setItem(EMAIL_KEY, email)
}

export function setTokens(token: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(EMAIL_KEY)
}

export function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null
}

export function getRefreshToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(REFRESH_TOKEN_KEY) : null
}

export function getUserId(): number | null {
  const id = typeof window !== "undefined" ? localStorage.getItem(USER_ID_KEY) : null
  return id ? Number(id) : null
}

export function isAuthenticated(): boolean {
  return Boolean(getToken())
}
────────────────────────────────────────────────────────────────────────────── */
