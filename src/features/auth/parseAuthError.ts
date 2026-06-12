import type { AxiosError } from 'axios'

interface AuthErrorBody {
  detail?: string
  code?: string[]
  non_field_errors?: string[]
  email?: string[]
}

/** Reads both server error shapes — `{ code: [...] }` field errors and
 *  `{ detail: "..." }` flow errors — and returns a friendly message + status.
 *  Never distinguishes wrong-code vs unknown-email (anti-enumeration). */
export function parseAuthError(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): { message: string; status?: number } {
  const ax = err as AxiosError<AuthErrorBody>
  const status = ax.response?.status
  const data = ax.response?.data
  const message =
    data?.detail ||
    data?.code?.[0] ||
    data?.non_field_errors?.[0] ||
    data?.email?.[0] ||
    fallback
  return { message, status }
}
