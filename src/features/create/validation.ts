import type { JokePayload } from '@/components/JokeRenderer'
import type { FormatRule } from './types'

/**
 * Returns true if a value is considered blank:
 *   - null or undefined
 *   - a string that is empty or whitespace-only
 *   - an array that is null/undefined (a non-array is never "blank" here)
 */
export function isBlank(v: unknown): boolean {
  if (v === null || v === undefined) return true
  if (typeof v === 'string') return v.trim() === ''
  return false
}

/**
 * Validates a JokePayload against a FormatRule.
 *
 * Returns a map of `{ fieldName: errorMessage }`.
 * An empty object means the payload is valid.
 *
 * Rules applied in order:
 *   1. required_fields — any blank field → error
 *   2. forbidden_fields — any non-blank field → error
 *   3. constraints:
 *      - min_lines / max_lines — checked against lines.length
 *      - max_line_chars — checked per individual line
 *      - min_text_words — word count of text
 */
export function validate(payload: JokePayload, rule: FormatRule): Record<string, string> {
  const errors: Record<string, string> = {}

  // 1. Required fields
  for (const field of rule.required_fields) {
    const value = (payload as unknown as Record<string, unknown>)[field]

    if (field === 'lines') {
      // lines is an array; it's blank when null/undefined or empty
      if (!value || (Array.isArray(value) && (value as unknown[]).length === 0)) {
        errors[field] = `${field} is required`
      }
    } else {
      if (isBlank(value)) {
        errors[field] = `${field} is required`
      }
    }
  }

  // 2. Forbidden fields
  for (const field of rule.forbidden_fields) {
    const value = (payload as unknown as Record<string, unknown>)[field]

    if (field === 'lines') {
      if (value && Array.isArray(value) && (value as unknown[]).length > 0) {
        errors[field] = `${field} must not be set for this format`
      }
    } else {
      if (!isBlank(value)) {
        errors[field] = `${field} must not be set for this format`
      }
    }
  }

  // 3. Constraints
  const { min_lines, max_lines, max_line_chars, min_text_words } = rule.constraints

  // knock-style: line count + per-line length
  if (min_lines !== undefined || max_lines !== undefined || max_line_chars !== undefined) {
    const lines = Array.isArray(payload.lines) ? payload.lines : []

    if (min_lines !== undefined && lines.length < min_lines) {
      errors['lines'] = `At least ${min_lines} lines are required`
    } else if (max_lines !== undefined && lines.length > max_lines) {
      errors['lines'] = `No more than ${max_lines} lines are allowed`
    } else if (max_line_chars !== undefined) {
      const tooLong = lines.some((l) => l.length > max_line_chars!)
      if (tooLong) {
        errors['lines'] = `Each line must be at most ${max_line_chars} characters`
      }
    }
  }

  // story-style: word count on text
  if (min_text_words !== undefined) {
    const text = typeof payload.text === 'string' ? payload.text : ''
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
    if (wordCount < min_text_words) {
      errors['text'] = `Text must be at least ${min_text_words} words`
    }
  }

  return errors
}
