const LOCK_STORAGE_KEY = "hengo-recovery-lock-v1"
const UNLOCK_SESSION_KEY = "hengo-recovery-unlocked"
const ITERATIONS = 120_000

type StoredLock = { salt: string; verifier: string }

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function derive(pin: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"])
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: ITERATIONS }, key, 256)
  return bytesToBase64(new Uint8Array(bits))
}

function readStoredLock(): StoredLock | null {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem(LOCK_STORAGE_KEY) ?? "null") as StoredLock | null } catch { return null }
}

export function hasRecoveryLockCredential(): boolean { return Boolean(readStoredLock()) }
export function isRecoveryUnlocked(): boolean { return typeof window !== "undefined" && sessionStorage.getItem(UNLOCK_SESSION_KEY) === "true" }
export function lockRecovery(): void { if (typeof window !== "undefined") sessionStorage.removeItem(UNLOCK_SESSION_KEY) }
export function clearRecoveryLock(): void { if (typeof window !== "undefined") { localStorage.removeItem(LOCK_STORAGE_KEY); sessionStorage.removeItem(UNLOCK_SESSION_KEY) } }

export async function setRecoveryPin(pin: string): Promise<void> {
  if (!/^\d{4,8}$/.test(pin)) throw new Error("Use a 4–8 digit PIN.")
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const verifier = await derive(pin, salt)
  localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify({ salt: bytesToBase64(salt), verifier }))
  sessionStorage.setItem(UNLOCK_SESSION_KEY, "true")
}

export async function unlockRecovery(pin: string): Promise<boolean> {
  const stored = readStoredLock()
  if (!stored) return false
  const verifier = await derive(pin, base64ToBytes(stored.salt))
  if (verifier !== stored.verifier) return false
  sessionStorage.setItem(UNLOCK_SESSION_KEY, "true")
  return true
}
