import type { AuthedRequest } from "@/lib/server/ai"
import { requireUser } from "@/lib/server/ai"
import type { CoachErrorCode, SafeCoachError } from "./errors"

export function coachErrorResponse(error: SafeCoachError): Response {
  return Response.json(
    {
      error: {
        code: error.code,
        message: error.message,
        retryable: error.retryable,
      },
    },
    { status: error.status },
  )
}

export function simpleCoachError(
  code: CoachErrorCode,
  message: string,
  status: number,
  retryable = false,
): Response {
  return coachErrorResponse({ code, message, status, retryable })
}

export function coachDataResponse<T>(data: T, mode: "live" | "mock" = "live", init?: ResponseInit): Response {
  return Response.json({ data, meta: { mode } }, init)
}

export async function requireCoachUser(req: Request): Promise<AuthedRequest | Response> {
  const auth = await requireUser(req)
  if (!(auth instanceof Response)) return auth
  const status = auth.status === 401 ? 401 : 500
  const hadBearerToken = req.headers.has("authorization")
  return simpleCoachError(
    status === 401
      ? hadBearerToken
        ? "SESSION_EXPIRED"
        : "AUTH_REQUIRED"
      : "INTERNAL_ERROR",
    status === 401
      ? hadBearerToken
        ? "Your session expired. Sign in again, then retry."
        : "Please sign in to use Korean Coach."
      : "The request could not be completed.",
    status,
    status >= 500,
  )
}
