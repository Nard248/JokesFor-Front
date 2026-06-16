/**
 * Returns true only when dob is a valid ISO date string (YYYY-MM-DD) that
 * represents a birthday that is >= 18 full years before today.
 * null / undefined / invalid / under-18 => false.
 */
export function isAdult(dob?: string | null): boolean {
  if (!dob) return false

  const parsed = new Date(dob)
  // new Date('not-a-date') => Invalid Date; also catches empty string
  if (isNaN(parsed.getTime())) return false

  const today = new Date()
  // Compute age using calendar date math (not just year subtraction)
  let age = today.getFullYear() - parsed.getFullYear()
  const monthDiff = today.getMonth() - parsed.getMonth()
  const dayDiff = today.getDate() - parsed.getDate()

  // If the birthday hasn't occurred yet this year, subtract one
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1
  }

  return age >= 18
}
