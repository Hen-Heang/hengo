// Typed builders for the OpenAI Realtime **client → server** events we send
// over the WebRTC data channel, plus the pure helpers that decide how to
// bootstrap a session from prior conversation history.
//
// Kept dependency-free and side-effect-free so the event logic can be unit
// tested without a real RTCPeerConnection, microphone, or network.
//
// Content-part types differ by role (confirmed against OpenAI's Realtime docs):
//   - a user history item uses   { type: "input_text", text }
//   - an assistant history item uses { type: "text", text }

export type RealtimeBootstrapRole = "user" | "assistant"

export interface RealtimeBootstrapMessage {
  id: string
  role: RealtimeBootstrapRole
  text: string
}

export interface ConversationItemCreateEvent {
  type: "conversation.item.create"
  item: {
    type: "message"
    role: RealtimeBootstrapRole
    content: Array<{ type: "input_text" | "text"; text: string }>
  }
}

export interface ResponseCreateEvent {
  type: "response.create"
}

export type RealtimeClientEvent = ConversationItemCreateEvent | ResponseCreateEvent

// How many recent messages to replay into a new realtime context. The task
// calls for "roughly the last 8-12 relevant messages" rather than the whole
// conversation, to keep the injected context small and cheap.
export const MAX_BOOTSTRAP_MESSAGES = 12

export function contentTypeForRole(role: RealtimeBootstrapRole): "input_text" | "text" {
  return role === "user" ? "input_text" : "text"
}

export function conversationItemCreate(
  role: RealtimeBootstrapRole,
  text: string,
): ConversationItemCreateEvent {
  return {
    type: "conversation.item.create",
    item: {
      type: "message",
      role,
      content: [{ type: contentTypeForRole(role), text }],
    },
  }
}

export function responseCreate(): ResponseCreateEvent {
  return { type: "response.create" }
}

// Trim/normalize each message, drop empties, and keep only the last N — so a
// long conversation still bootstraps a new session with a small, relevant tail.
export function limitBootstrapHistory(
  messages: RealtimeBootstrapMessage[],
  max: number = MAX_BOOTSTRAP_MESSAGES,
): RealtimeBootstrapMessage[] {
  const cleaned = messages
    .map((message) => ({ ...message, text: message.text.replace(/\s+/g, " ").trim() }))
    .filter((message) => message.text.length > 0)
  return max >= 0 ? cleaned.slice(-max) : cleaned
}

export function hasMeaningfulHistory(messages: RealtimeBootstrapMessage[]): boolean {
  return messages.some((message) => message.text.trim().length > 0)
}

// The assistant should speak first only when it is genuinely its turn:
//   - no history at all  → greet the learner
//   - the last message was the learner's → answer the pending user message
// If the last thing said was the assistant's, we wait for the learner to speak
// instead of making the coach talk twice in a row.
export function shouldCreateInitialResponse(messages: RealtimeBootstrapMessage[]): boolean {
  if (messages.length === 0) return true
  return messages[messages.length - 1].role === "user"
}

export function buildBootstrapEvents(
  messages: RealtimeBootstrapMessage[],
): ConversationItemCreateEvent[] {
  return messages.map((message) => conversationItemCreate(message.role, message.text))
}
