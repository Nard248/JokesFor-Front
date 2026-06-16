/**
 * Returns true only when dob is a valid ISO date string (YYYY-MM-DD) that
 * represents a birthday that is >= 18 full years before today.
 * null / undefined / invalid / malformed / non-YYYY-MM-DD / future dates / under-18 => false.
 *
 * The comparison is done entirely in calendar integers to avoid the UTC-vs-local
 * timezone skew that `new Date('YYYY-MM-DD')` introduces (it parses at UTC midnight,
 * while `.getFullYear()` etc. return local-time components).
 */
export function isAdult(dob?: string | null): boolean {
  if (!dob) return false

  // Require strict YYYY-MM-DD format
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob)
  if (!match) return false

  const dobYear = parseInt(match[1], 10)
  const dobMonth = parseInt(match[2], 10)  // 1-12
  const dobDay = parseInt(match[3], 10)

  // Validate calendar values (catches 2007-13-40, etc.)
  if (
    dobMonth < 1 || dobMonth > 12 ||
    dobDay < 1 || dobDay > 31
  ) return false

  // Use a Date only to validate that the calendar date actually exists
  // (e.g. Feb 30 would roll over). Parse as local time by passing parts.
  const dateCheck = new Date(dobYear, dobMonth - 1, dobDay)
  if (
    dateCheck.getFullYear() !== dobYear ||
    dateCheck.getMonth() !== dobMonth - 1 ||
    dateCheck.getDate() !== dobDay
  ) return false

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
  ) return false

  // Pure calendar comparison — no Date arithmetic
  const yearDiff = todayYear - dobYear
  if (yearDiff > 18) return true
  if (yearDiff < 18) return false
  // yearDiff === 18: check whether the birthday has occurred yet this year
  if (todayMonth > dobMonth) return true
  if (todayMonth < dobMonth) return false
  // same month: adult on or after the exact birthday day
  return todayDay >= dobDay
}
