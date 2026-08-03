import { aiPost } from "./ai-client"

export const translateApi = {
  /** Korean → natural English, used for live voice subtitles. */
  toEnglish: async (korean: string): Promise<string> => {
    const data = await aiPost<{ en: string }>("/translate", { korean })
    return data.en
  },
}
