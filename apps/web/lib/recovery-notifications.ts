import type { RecoveryPrivacySettings } from "./types"

export const DEFAULT_RECOVERY_NOTIFICATION_TEXT = "Your Hengo check-in is ready."

/** Never includes a target label; custom wording is an explicit user choice. */
export function recoveryNotificationText(settings: RecoveryPrivacySettings): string {
  return settings.customNotificationText?.trim() || DEFAULT_RECOVERY_NOTIFICATION_TEXT
}
