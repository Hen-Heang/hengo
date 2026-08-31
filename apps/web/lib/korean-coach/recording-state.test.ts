import { describe, expect, it } from "vitest"

import { INITIAL_RECORDING_STATE, recordingReducer } from "./recording-state"

describe("recording state transitions", () => {
  it("moves through permission, recording, recorded, processing, and success", () => {
    let state = recordingReducer(INITIAL_RECORDING_STATE, { type: "REQUEST_PERMISSION" })
    expect(state.phase).toBe("requesting-permission")
    state = recordingReducer(state, { type: "START" })
    state = recordingReducer(state, { type: "TICK", durationMs: 1_250 })
    expect(state).toMatchObject({ phase: "recording", durationMs: 1_250 })
    state = recordingReducer(state, { type: "STOP" })
    expect(state.phase).toBe("recorded")
    state = recordingReducer(state, { type: "PROCESS" })
    expect(state.phase).toBe("processing")
    state = recordingReducer(state, { type: "SUCCESS" })
    expect(state.phase).toBe("success")
  })

  it("preserves a helpful error and supports retry reset", () => {
    const failed = recordingReducer(INITIAL_RECORDING_STATE, {
      type: "FAIL",
      message: "Microphone permission denied",
    })
    expect(failed).toMatchObject({ phase: "error", error: "Microphone permission denied" })
    expect(recordingReducer(failed, { type: "RESET" })).toEqual(INITIAL_RECORDING_STATE)
  })

  it("ignores invalid stop and processing transitions", () => {
    expect(recordingReducer(INITIAL_RECORDING_STATE, { type: "STOP" })).toEqual(
      INITIAL_RECORDING_STATE,
    )
    expect(recordingReducer(INITIAL_RECORDING_STATE, { type: "PROCESS" })).toEqual(
      INITIAL_RECORDING_STATE,
    )
  })
})
