import { redirect } from "next/navigation"

// Foundations is merged into the Phrasebook hub as a "Foundations" mode —
// same hub route, same mode switcher (Phrases/Reading/Foundations) — so it
// belongs there rather than as its own page. Kept as a redirect stub so old
// bookmarks and links still work — same pattern as /ask-hengo and /reading.
export default function FoundationsRedirect() {
  redirect("/phrasebook?mode=foundations")
}
