// Cross-component "open the Quick Capture dialog" signal, following the same
// window-event pattern lib/speech-audio.ts uses for SPEECH_AUDIO_START_EVENT.
// The dialog is mounted once in AppShell (like the shared QuickSwitcher
// instance); the ⌘K palette action, the desktop header button, and the
// mobile FAB all just dispatch this event instead of each owning their own
// dialog state.

export const QUICK_CAPTURE_OPEN_EVENT = "hengo:quick-capture-open"

export function openQuickCapture() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(QUICK_CAPTURE_OPEN_EVENT))
}
