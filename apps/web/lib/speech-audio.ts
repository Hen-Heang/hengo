// Coordinates spoken prompts with microphone capture. TTS/replay audio
// registers here so opening the microphone can stop playback first, preventing
// the examiner's own voice from being recognized as the candidate's answer.

type ActiveSpeechAudio = {
  audio: HTMLAudioElement
  finish: () => void
}

const activeAudio = new Set<ActiveSpeechAudio>()
export const SPEECH_AUDIO_START_EVENT = "koriai:speech-audio-start"

export function registerSpeechAudio(
  audio: HTMLAudioElement,
  onFinish?: () => void
): () => void {
  stopSpeechAudio()
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SPEECH_AUDIO_START_EVENT))
  }

  let active = true
  const entry: ActiveSpeechAudio = {
    audio,
    finish: () => {
      if (!active) return
      active = false
      audio.removeEventListener("ended", entry.finish)
      audio.removeEventListener("error", entry.finish)
      activeAudio.delete(entry)
      onFinish?.()
    },
  }

  activeAudio.add(entry)
  audio.addEventListener("ended", entry.finish, { once: true })
  audio.addEventListener("error", entry.finish, { once: true })

  return () => {
    if (!active) return
    try {
      audio.pause()
      audio.currentTime = 0
    } catch {
      // Metadata may not be loaded yet; cleanup still must run.
    }
    entry.finish()
  }
}

export function stopSpeechAudio() {
  for (const entry of [...activeAudio]) {
    try {
      entry.audio.pause()
      entry.audio.currentTime = 0
    } catch {
      // A failed/blocked audio element is still safe to unregister.
    }
    entry.finish()
  }
}
