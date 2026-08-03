// Shared error formatter for the API layer. Errors come from supabase-js
// (PostgrestError / AuthError, both Error subclasses) or from fetch-based
// routes (plain Error thrown by aiPost / streamMessage).
export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string" &&
    (error as { message: string }).message.trim()
  ) {
    return (error as { message: string }).message
  }
  return fallback
}
