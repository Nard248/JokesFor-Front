/**
 * Full completed years between `dob` and today, or null when `dob` is missing,
 * malformed, not strict YYYY-MM-DD, an impossible calendar date, or in the future.
 *
 * The comparison is done entirely in calendar integers to avoid the UTC-vs-local
 * timezone skew that `new Date('YYYY-MM-DD')` introduces (it parses at UTC midnight,
 * while `.getFullYear()` etc. return local-time components).
 */
function fullYearsSince(dob?: string | null): number | null {
  if (!dob) return null

  // Require strict YYYY-MM-DD format
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob)
  if (!match) return null

  const dobYear = parseInt(match[1], 10)
  const dobMonth = parseInt(match[2], 10)  // 1-12
  const dobDay = parseInt(match[3], 10)

  // Validate calendar values (catches 2007-13-40, etc.)
  if (
    dobMonth < 1 || dobMonth > 12 ||
    dobDay < 1 || dobDay > 31
  ) return null

  // Use a Date only to validate that the calendar date actually exists
  // (e.g. Feb 30 would roll over). Parse as local time by passing parts.
  const dateCheck = new Date(dobYear, dobMonth - 1, dobDay)
  if (
    dateCheck.getFullYear() !== dobYear ||
    dateCheck.getMonth() !== dobMonth - 1 ||
    dateCheck.getDate() !== dobDay
  ) return null

  // Get today's LOCAL calendar components — never touch the DOB Date object
  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth() + 1  // 1-12
  const todayDay = today.getDate()

  // Reject future dates
  if (
    dobYear > todayYear ||
    (dobYear === todayYear && dobMonth > todayMonth) ||
    (dobYear === todayYear && dobMonth === todayMonth && dobDay > todayDay)
  ) return null

  // Pure calendar comparison — no Date arithmetic. Subtract a year when this
  // year's birthday hasn't occurred yet.
  let years = todayYear - dobYear
  if (todayMonth < dobMonth || (todayMonth === dobMonth && todayDay < dobDay)) {
    years -= 1
  }
  return years
}

/**
 * True only when dob is a valid YYYY-MM-DD that is >= 18 full years before today.
 * null / undefined / invalid / malformed / future / under-18 => false.
 */
export function isAdult(dob?: string | null): boolean {
  const years = fullYearsSince(dob)
  return years !== null && years >= 18
}

/**
 * True only when dob is a valid YYYY-MM-DD that is >= 13 full years before today.
 * Mirrors the backend COPPA minimum (the email signup path rejects under-13).
 * Used to gate "Continue with Google" before initiating OAuth so we never burn
 * a single-use auth code on an under-13 rejection.
 */
export function isAtLeast13(dob?: string | null): boolean {
  const years = fullYearsSince(dob)
  return years !== null && years >= 13
}
