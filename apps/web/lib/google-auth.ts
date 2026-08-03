import { authApi } from "@/lib/api"

const GIS_SRC = "https://accounts.google.com/gsi/client"

let scriptPromise: Promise<void> | null = null

/** Loads the Google Identity Services script once and resolves when ready. */
export function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    const script = document.createElement("script")
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"))
    document.head.appendChild(script)
  })
  return scriptPromise
}

/**
 * Produces a nonce pair for the Google One Tap flow. Google is initialized with the
 * SHA-256 hash; the raw value can be forwarded to the backend to confirm they match
 * (replay protection).
 */
export async function makeNonce(): Promise<{ nonce: string; hashedNonce: string }> {
  const random = crypto.getRandomValues(new Uint8Array(32))
  const nonce = btoa(String.fromCharCode(...random)).replace(/[+/=]/g, "")
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(nonce))
  const hashedNonce = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  return { nonce, hashedNonce }
}

export interface GoogleSessionResult {
  userId: string
  email: string
}

/**
 * Establishes a Supabase session from a Google credential (ID token). Google was
 * initialized with the SHA-256 hash of `rawNonce`; Supabase re-hashes the raw
 * value to verify they match (replay protection). The Google provider with this
 * client ID must be enabled under Supabase Auth > Providers.
 */
export async function handleGoogleCredential(
  credential: string,
  rawNonce: string,
): Promise<GoogleSessionResult> {
  return authApi.loginWithGoogle(credential, rawNonce)
}
