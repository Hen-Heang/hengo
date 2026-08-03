// Explicit state machine for a realtime voice session's lifecycle, separate
// from the per-turn `phase` (listening/thinking/speaking). Pure and table-
// driven so the transitions are unit tested and the hook never has to encode
// them inline.

export type VoiceSessionStatus =
  | "idle"
  | "starting"
  | "active"
  | "reconnecting"
  | "ending"
  | "summarizing"
  | "completed"
  | "failed"

export type VoiceSessionEvent =
  | "start"
  | "connected"
  | "disconnect"
  | "end"
  | "summarize"
  | "summaryReady"
  | "fail"
  | "reset"

const TRANSITIONS: Record<VoiceSessionStatus, Partial<Record<VoiceSessionEvent, VoiceSessionStatus>>> = {
  idle: { start: "starting" },
  starting: { connected: "active", end: "ending", fail: "failed" },
  active: { disconnect: "reconnecting", end: "ending", fail: "failed" },
  reconnecting: { connected: "active", end: "ending", fail: "failed" },
  ending: { summarize: "summarizing", summaryReady: "completed", fail: "failed" },
  // Report building is best-effort: a failed summary still completes the session.
  summarizing: { summaryReady: "completed", fail: "completed" },
  completed: { reset: "idle", start: "starting" },
  failed: { reset: "idle", start: "starting" },
}

/** Returns the next status for an event, or the current status when the event
 *  isn't valid from here (ignored transitions never throw). */
export function nextSessionStatus(
  current: VoiceSessionStatus,
  event: VoiceSessionEvent,
): VoiceSessionStatus {
  return TRANSITIONS[current][event] ?? current
}

// Connected and exchanging audio (a transient reconnect still counts as live).
export function isLiveStatus(status: VoiceSessionStatus): boolean {
  return status === "active" || status === "reconnecting"
}

export function isTerminalStatus(status: VoiceSessionStatus): boolean {
  return status === "completed" || status === "failed"
}
