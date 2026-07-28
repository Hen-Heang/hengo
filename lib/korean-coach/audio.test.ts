import { describe, expect, it } from "vitest"

import {
  KOREAN_COACH_MAX_AUDIO_BYTES,
  isSupportedAudioMimeType,
  preferredRecorderMimeType,
  validateAudioInput,
} from "./audio"

describe("Korean Coach audio validation", () => {
  it("accepts supported browser and OpenAI transcription formats", () => {
    for (const type of ["audio/webm;codecs=opus", "audio/mp4", "audio/mpeg", "audio/wav", "audio/ogg"]) {
      expect(isSupportedAudioMimeType(type)).toBe(true)
    }
    expect(isSupportedAudioMimeType("audio/aac")).toBe(false)
    expect(isSupportedAudioMimeType("video/webm")).toBe(false)
  })

  it("rejects empty, too-short, too-large, and unsupported recordings", () => {
    expect(validateAudioInput({ size: 0, type: "audio/webm" }).code).toBe("empty_audio")
    expect(
      validateAudioInput({ size: 5_000, type: "audio/webm", durationMs: 200 }).code,
    ).toBe("recording_too_short")
    expect(
      validateAudioInput({ size: KOREAN_COACH_MAX_AUDIO_BYTES + 1, type: "audio/webm" }).code,
    ).toBe("audio_too_large")
    expect(validateAudioInput({ size: 5_000, type: "video/webm" }).code).toBe(
      "unsupported_audio_format",
    )
  })

  it("chooses the first compatible recorder MIME type", () => {
    expect(preferredRecorderMimeType((type) => type === "audio/mp4")).toBe("audio/mp4")
    expect(preferredRecorderMimeType(() => false)).toBeNull()
  })
})

