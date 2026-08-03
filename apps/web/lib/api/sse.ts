// Shared low-level SSE line-reader for the app's two streaming endpoints
// (chat.ts streamMessage, goals.ts coachStream). Only handles framing —
// splitting the response body into `event:`/`data:` lines — and hands each
// complete event to the caller. JSON parsing and per-event behavior (what
// counts as fatal vs. ignorable) stay with the caller, since the two streams
// disagree on that.
export async function readSseStream(
  response: Response,
  onEvent: (event: string, data: string) => void,
): Promise<void> {
  if (!response.body) throw new Error("No response body")

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let eventName = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim()
      } else if (line.startsWith("data:")) {
        onEvent(eventName, line.slice(5).trim())
        eventName = ""
      }
    }
  }
}
