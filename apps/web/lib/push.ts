// Browser Web Push helpers. Registers the service worker, manages the
// PushManager subscription, and syncs it with the backend (pushApi).

import { pushApi, type WebPushSubscriptionJSON } from "@/lib/api"

export type WebPushState = "unsupported" | "denied" | "enabled" | "disabled"

/** Web Push needs a service worker, PushManager, and a secure context (https/localhost). */
export function isWebPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    window.isSecureContext
  )
}

// VAPID public keys are base64url; the PushManager wants a Uint8Array.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register("/sw.js", { scope: "/" })
}

/** Current state without prompting: is there an active push subscription? */
export async function getWebPushState(): Promise<WebPushState> {
  if (!isWebPushSupported()) return "unsupported"
  if (Notification.permission === "denied") return "denied"
  try {
    const reg = await navigator.serviceWorker.getRegistration("/")
    const sub = await reg?.pushManager.getSubscription()
    return sub ? "enabled" : "disabled"
  } catch {
    return "disabled"
  }
}

/**
 * Request permission, subscribe via the backend's VAPID key, and persist the
 * subscription. Returns the resulting state. Throws on unexpected failures so the
 * caller can surface a toast.
 */
export async function enableWebPush(): Promise<WebPushState> {
  if (!isWebPushSupported()) return "unsupported"

  const permission = await Notification.requestPermission()
  if (permission !== "granted") return permission === "denied" ? "denied" : "disabled"

  const reg = await registerServiceWorker()
  await navigator.serviceWorker.ready

  const { publicKey } = await pushApi.vapidPublicKey()
  if (!publicKey) throw new Error("Web Push is not configured on the server.")

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // Cast: the helper returns a fresh ArrayBuffer-backed view, but TS widens
      // the buffer type to ArrayBufferLike. PushManager accepts a BufferSource.
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    })
  }

  await pushApi.webSubscribe(sub.toJSON() as WebPushSubscriptionJSON)
  return "enabled"
}

/** Unsubscribe locally and remove the subscription from the backend. */
export async function disableWebPush(): Promise<WebPushState> {
  if (!isWebPushSupported()) return "unsupported"
  try {
    const reg = await navigator.serviceWorker.getRegistration("/")
    const sub = await reg?.pushManager.getSubscription()
    if (sub) {
      await pushApi.webUnsubscribe(sub.endpoint).catch(() => {})
      await sub.unsubscribe()
    }
  } catch {
    /* ignore */
  }
  return "disabled"
}
