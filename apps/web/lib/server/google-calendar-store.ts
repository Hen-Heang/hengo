// Server-only storage for the Google Calendar integration (kori_google_calendar_integrations).
//
// This is the one place in the app that deliberately uses the Supabase
// service-role key instead of a per-request JWT client (contrast
// lib/server/ai.ts::requireUser, which is RLS-scoped by design). That's
// unavoidable here: the requirement is that even the *owning* user's own
// valid JWT must never be able to read their access/refresh token — RLS
// can't express that, since RLS only restricts which rows a role sees, not
// whether a column is ever readable via PostgREST. The migration additionally
// revokes column-level SELECT on the ciphertext columns from `authenticated`,
// so this module is the only path to them even from inside Postgres.
//
// Token values are further encrypted (AES-256-GCM) before being written, so a
// database dump or ad hoc SQL access doesn't expose them either.
import { createClient } from "@supabase/supabase-js"
import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

import { SUPABASE_URL, supabase } from "@/lib/supabase"

const TABLE = "kori_google_calendar_integrations"

// Typed via `typeof supabase` (an already-inferred, untyped-schema client)
// rather than `ReturnType<typeof createClient>` — the latter forces an
// isolated generic-default resolution that collapses table row types to
// `never`, unlike inference from a real call expression.
let cachedClient: typeof supabase | null = null

function serviceRoleClient(): typeof supabase {
  if (cachedClient) return cachedClient
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.")
  cachedClient = createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cachedClient
}

function encryptionKey(): Buffer {
  const encoded = process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY
  if (!encoded) throw new Error("GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY is not configured.")
  const key = Buffer.from(encoded, "base64")
  if (key.length !== 32) {
    throw new Error("GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY must decode to 32 bytes (AES-256).")
  }
  return key
}

function encrypt(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64")
}

function decrypt(payload: string): string {
  const raw = Buffer.from(payload, "base64")
  const iv = raw.subarray(0, 12)
  const authTag = raw.subarray(12, 28)
  const ciphertext = raw.subarray(28)
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
}

export interface StoredGoogleCalendarTokens {
  accessToken: string
  refreshToken: string | null
  expiresAt: string
}

// Upserts the connection for `userId`. When Google doesn't return a new
// refresh token (it only does on first consent), `refreshToken` is null here
// and the previously stored one is preserved rather than overwritten.
export async function storeGoogleCalendarTokens(params: {
  userId: string
  accountEmail: string
  accessToken: string
  refreshToken: string | null
  expiresAt: Date
  scopes: string
}): Promise<void> {
  const db = serviceRoleClient()
  const { error } = await db.from(TABLE).upsert(
    {
      user_id: params.userId,
      provider_account_email: params.accountEmail,
      access_token_ciphertext: encrypt(params.accessToken),
      access_token_expires_at: params.expiresAt.toISOString(),
      granted_scopes: params.scopes,
      status: "active",
      updated_at: new Date().toISOString(),
      ...(params.refreshToken ? { refresh_token_ciphertext: encrypt(params.refreshToken) } : {}),
    },
    { onConflict: "user_id" },
  )
  if (error) throw new Error("Could not store Google Calendar connection.")
}

// Server-only read of the decrypted tokens — never call this from anything
// that forwards the result to the browser. Used by the callback (to check
// whether a refresh token already exists) and, later, by the Phase 5 token
// refresh helper.
export async function getGoogleCalendarTokens(
  userId: string,
): Promise<StoredGoogleCalendarTokens | null> {
  const db = serviceRoleClient()
  const { data, error } = await db
    .from(TABLE)
    .select("access_token_ciphertext, refresh_token_ciphertext, access_token_expires_at")
    .eq("user_id", userId)
    .maybeSingle()
  if (error) throw new Error("Could not read Google Calendar connection.")
  if (!data) return null

  return {
    accessToken: decrypt(data.access_token_ciphertext as string),
    refreshToken: data.refresh_token_ciphertext
      ? decrypt(data.refresh_token_ciphertext as string)
      : null,
    expiresAt: data.access_token_expires_at as string,
  }
}

// Called after a successful refresh (lib/server/google-calendar-token.ts).
// `refreshToken` is only passed when Google returned a new one — otherwise
// the existing stored refresh token is left untouched.
export async function updateGoogleCalendarAccessToken(params: {
  userId: string
  accessToken: string
  refreshToken: string | null
  expiresAt: Date
}): Promise<void> {
  const db = serviceRoleClient()
  const { error } = await db
    .from(TABLE)
    .update({
      access_token_ciphertext: encrypt(params.accessToken),
      access_token_expires_at: params.expiresAt.toISOString(),
      status: "active",
      updated_at: new Date().toISOString(),
      ...(params.refreshToken ? { refresh_token_ciphertext: encrypt(params.refreshToken) } : {}),
    })
    .eq("user_id", params.userId)
  if (error) throw new Error("Could not update Google Calendar connection.")
}

// Google's refresh token grant was rejected (revoked/expired) — the user
// must reconnect. Token columns are left in place (harmless ciphertext) so
// there is no partial-write race with a concurrent refresh attempt; only the
// status flips, which is what the Settings UI reads.
export async function markGoogleCalendarIntegrationError(userId: string): Promise<void> {
  const db = serviceRoleClient()
  const { error } = await db
    .from(TABLE)
    .update({ status: "error", updated_at: new Date().toISOString() })
    .eq("user_id", userId)
  if (error) throw new Error("Could not update Google Calendar connection.")
}

// Called after a successful events/freeBusy fetch (lib/server/google-calendar-client.ts)
// so Settings can show "Last synced ...".
export async function recordGoogleCalendarSync(userId: string): Promise<void> {
  const db = serviceRoleClient()
  const { error } = await db
    .from(TABLE)
    .update({ last_synced_at: new Date().toISOString() })
    .eq("user_id", userId)
  if (error) throw new Error("Could not update Google Calendar connection.")
}

// Phase 9 disconnect: removes Hengo's stored credentials entirely (not just
// a status flag) — matches "remove connection metadata", not "mark inactive".
export async function deleteGoogleCalendarIntegration(userId: string): Promise<void> {
  const db = serviceRoleClient()
  const { error } = await db.from(TABLE).delete().eq("user_id", userId)
  if (error) throw new Error("Could not remove the Google Calendar connection.")
}
