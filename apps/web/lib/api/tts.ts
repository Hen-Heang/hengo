import { supabase } from "@/lib/supabase"

export type TtsOptions = {
  instructions?: string
  speed?: number
  signal?: AbortSignal
}

// TTS — audio comes from the app/api/ai/tts route (OpenAI TTS behind the
// server key); returns an object URL for <audio>.
export const ttsApi = {
  speak: async (text: string, voice = "marin", options: TtsOptions = {}): Promise<string> => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    const res = await fetch("/api/ai/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        text,
        voice,
        instructions: options.instructions,
        speed: options.speed,
      }),
      signal: options.signal,
    })
    if (!res.ok) throw new Error(`TTS failed (${res.status})`)
    return URL.createObjectURL(await res.blob())
  },
}
