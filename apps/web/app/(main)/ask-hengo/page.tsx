import { redirect } from "next/navigation"

// Ask Hengo is merged into AI Coach as a "My Data" mode — same chat shell,
// same header switcher (Coach/Analyze/Write/Review/My Data), so it belongs
// there rather than as its own page. Kept as a redirect stub so old
// bookmarks and links still work — same pattern as /mistakes.
export default function AskHengoRedirect() {
  redirect("/chat?mode=memory")
}
