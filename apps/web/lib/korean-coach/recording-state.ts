export type RecordingPhase =
  "idle" | "requesting-permission" | "recording" | "recorded" | "processing" | "success" | "error"

export interface RecordingState {
  phase: RecordingPhase
  durationMs: number
  error: string | null
}

export type RecordingAction =
  | { type: "REQUEST_PERMISSION" }
  | { type: "START" }
  | { type: "TICK"; durationMs: number }
  | { type: "STOP" }
  | { type: "PROCESS" }
  | { type: "SUCCESS" }
  | { type: "FAIL"; message: string }
  | { type: "RESET" }

export const INITIAL_RECORDING_STATE: RecordingState = {
  phase: "idle",
  durationMs: 0,
  error: null,
}

export function recordingReducer(state: RecordingState, action: RecordingAction): RecordingState {
  switch (action.type) {
    case "REQUEST_PERMISSION":
      return { phase: "requesting-permission", durationMs: 0, error: null }
    case "START":
      return { phase: "recording", durationMs: 0, error: null }
    case "TICK":
      return state.phase === "recording" ? { ...state, durationMs: action.durationMs } : state
    case "STOP":
      return state.phase === "recording" ? { ...state, phase: "recorded" } : state
    case "PROCESS":
      return state.phase === "recorded" ? { ...state, phase: "processing", error: null } : state
    case "SUCCESS":
      return { ...state, phase: "success", error: null }
    case "FAIL":
      return { ...state, phase: "error", error: action.message }
    case "RESET":
      return INITIAL_RECORDING_STATE
  }
}
