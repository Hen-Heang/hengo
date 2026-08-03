// Shared option types + metadata for the voice practice setup sheet, live
// captions, and the ChatWindow that ties them together. No React here so both
// the sheet and the panel can import it without a cycle.

import type { CorrectionPolicy } from "./correction-policy"
import type { SpeakingPace } from "./session-context"

export type VoicePracticeMode = "free" | "workplace" | "developer" | "scenario" | "shadow"

// How much English caption support to give. Learning-first modes (Korean-only,
// tap-to-reveal) are preferred over always-on English.
export type CaptionMode = "ko" | "tap" | "ko_en" | "none"

export interface VoicePracticeOptions {
  mode: VoicePracticeMode
  correctionPolicy: CorrectionPolicy
  pace: SpeakingPace
  captionMode: CaptionMode
}

export const DEFAULT_PRACTICE_MODE: VoicePracticeMode = "free"
export const DEFAULT_PACE: SpeakingPace = "clear"
export const DEFAULT_CAPTION_MODE: CaptionMode = "tap"

export interface Option<T extends string> {
  value: T
  label: string
  description: string
}

export const PRACTICE_MODE_OPTIONS: Option<VoicePracticeMode>[] = [
  { value: "free", label: "Free conversation", description: "Chat about anything, your pace." },
  { value: "workplace", label: "Workplace conversation", description: "Everyday office Korean." },
  { value: "developer", label: "Developer meeting", description: "Standups, reviews, technical Korean." },
  { value: "shadow", label: "Repeat & shadow", description: "Listen and repeat target sentences." },
]

export const CORRECTION_POLICY_OPTIONS: Option<CorrectionPolicy>[] = [
  { value: "fluency", label: "Fluency", description: "No interruptions — corrections after." },
  { value: "balanced", label: "Balanced", description: "One gentle correction now and then." },
  { value: "accuracy", label: "Accuracy", description: "Flag important mistakes right away." },
]

export const PACE_OPTIONS: Option<SpeakingPace>[] = [
  { value: "slow", label: "Slow", description: "Extra clear, easier to follow." },
  { value: "clear", label: "Clear", description: "Slightly slower than natural." },
  { value: "natural", label: "Natural", description: "Real conversational speed." },
]

export const CAPTION_OPTIONS: Option<CaptionMode>[] = [
  { value: "ko", label: "Korean only", description: "Best for listening practice." },
  { value: "tap", label: "Tap to show English", description: "Reveal English when you need it." },
  { value: "ko_en", label: "Korean + English", description: "Both, always visible." },
  { value: "none", label: "No captions", description: "Pure listening, no text." },
]

// Whether English can be shown at all for a caption mode ("tap" gates it behind
// a reveal; the panel handles that).
export function englishAllowed(mode: CaptionMode): boolean {
  return mode === "ko_en" || mode === "tap"
}

export function koreanCaptionsVisible(mode: CaptionMode): boolean {
  return mode !== "none"
}
