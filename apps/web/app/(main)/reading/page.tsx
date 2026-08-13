import { redirect } from "next/navigation"

// Reading is merged into Phrasebook as a "Reading" mode — same hub route,
// same mode switcher (Phrases/Reading) — so it belongs there rather than as
// its own page. Kept as a redirect stub so old bookmarks and links still
// work — same pattern as /ask-hengo.
export default function ReadingRedirect() {
  redirect("/phrasebook?mode=reading")
}
