/**
 * Daily-joke rotation timing.
 *
 * The backend rotates the daily editorial joke — and resets the free
 * daily-reads cap — at MIDNIGHT UTC, NOT at 9 AM local time. These helpers
 * compute the countdown to that correct instant.
 *
 * Prefer the server-provided `reset_at` (from GET /jokes/daily-reads/) when it
 * is available; otherwise fall back to computing the next 00:00:00 UTC.
 * `now` is injectable so the countdown is deterministically testable.
 */

/** The next daily-reset instant (next midnight UTC, or the server's `reset_at`). */
export function nextDailyResetInstant(resetAt?: string | null, now: Date = new Date()): Date {
  if (resetAt) {
    const parsed = new Date(resetAt)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  // Next 00:00:00.000 UTC — Date.UTC handles month/year rollover.
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0),
  )
}

/** Whole hours + minutes remaining until the next daily reset. Never negative. */
export function timeUntilDailyReset(
  resetAt?: string | null,
  now: Date = new Date(),
): { h: number; m: number } {
  const target = nextDailyResetInstant(resetAt, now).getTime()
  const totalMinutes = Math.max(0, Math.round((target - now.getTime()) / 60000))
  return { h: Math.floor(totalMinutes / 60), m: totalMinutes % 60 }
}

/**
 * Local-time label for the next reset instant, e.g. "8:00 PM".
 * The countdown targets a UTC instant but is shown in the user's local time.
 */
export function dailyResetLocalLabel(resetAt?: string | null, now: Date = new Date()): string {
  return nextDailyResetInstant(resetAt, now).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}
