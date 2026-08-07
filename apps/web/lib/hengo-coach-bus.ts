// Cross-component "open Hengo Coach" signal, following the same window-event
// pattern lib/quick-capture-bus.ts uses. The panel is mounted once in
// AppShell; the desktop header button and the mobile floating launcher both
// end up opening the same instance, so there is only ever one Hengo Coach
// surface — never two competing chat windows.

export const HENGO_COACH_OPEN_EVENT = "hengo:coach-open"

export function openHengoCoach() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(HENGO_COACH_OPEN_EVENT))
}
