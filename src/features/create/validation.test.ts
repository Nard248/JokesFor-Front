import { validate, isBlank } from './validation'
import type { FormatRule } from './types'
import type { JokePayload } from '@/components/JokeRenderer'

// ── FormatRule fixtures ──

const onelineRule: FormatRule = {
  id: 1,
  slug: 'oneliner',
  name: 'One-liner',
  description: 'A single witty sentence.',
  required_fields: ['text'],
  forbidden_fields: ['setup', 'punchline', 'lines'],
  constraints: {},
}

const setupRule: FormatRule = {
  id: 2,
  slug: 'setup',
  name: 'Setup → Punchline',
  description: 'Classic two-part joke.',
  required_fields: ['setup', 'punchline'],
  forbidden_fields: ['text', 'lines'],
  constraints: {},
}

const antiRule: FormatRule = {
  id: 5,
  slug: 'anti',
  name: 'Anti-joke',
  description: 'Subverts expectations.',
  required_fields: ['setup', 'punchline'],
  forbidden_fields: ['text', 'lines'],
  constraints: {},
}

const knockRule: FormatRule = {
  id: 3,
  slug: 'knock',
  name: 'Knock-knock',
  description: 'Call-and-response format.',
  required_fields: ['lines'],
  forbidden_fields: ['text', 'setup', 'punchline'],
  constraints: { min_lines: 4, max_lines: 8, max_line_chars: 200 },
}

const storyRule: FormatRule = {
  id: 4,
  slug: 'story',
  name: 'Story',
  description: 'Narrative joke.',
  required_fields: ['text'],
  forbidden_fields: ['setup', 'punchline', 'lines'],
  constraints: { min_text_words: 30 },
}

// ── isBlank ──

test('isBlank returns true for empty string', () => {
  expect(isBlank('')).toBe(true)
})

test('isBlank returns true for whitespace-only string', () => {
  expect(isBlank('   ')).toBe(true)
})

test('isBlank returns false for a non-empty string', () => {
  expect(isBlank('hello')).toBe(false)
})

test('isBlank returns true for null/undefined', () => {
  expect(isBlank(null)).toBe(true)
  expect(isBlank(undefined)).toBe(true)
})

// ── required_fields ──

test('oneliner: missing text → error on "text"', () => {
  const payload: JokePayload = { format: 'oneliner', text: '', setup: '', punchline: '', lines: null }
  const errors = validate(payload, onelineRule)
  expect(errors).toHaveProperty('text')
  expect(Object.keys(errors)).toHaveLength(1)
})

test('setup: missing setup and punchline → errors on both fields', () => {
  const payload: JokePayload = { format: 'setup', text: '', setup: '', punchline: '', lines: null }
  const errors = validate(payload, setupRule)
  expect(errors).toHaveProperty('setup')
  expect(errors).toHaveProperty('punchline')
})

test('anti: missing setup and punchline → errors on both fields', () => {
  const payload: JokePayload = { format: 'anti', text: '', setup: '', punchline: '', lines: null }
  const errors = validate(payload, antiRule)
  expect(errors).toHaveProperty('setup')
  expect(errors).toHaveProperty('punchline')
})

// ── forbidden_fields ──

test('oneliner: forbidden field "setup" present → error', () => {
  const payload: JokePayload = {
    format: 'oneliner',
    text: 'I told my wife she should embrace her mistakes.',
    setup: 'Should not be here',
    punchline: '',
    lines: null,
  }
  const errors = validate(payload, onelineRule)
  expect(errors).toHaveProperty('setup')
})

test('knock: forbidden field "text" present → error', () => {
  const payload: JokePayload = {
    format: 'knock',
    text: 'Should not be here',
    setup: '',
    punchline: '',
    lines: ['Knock knock', "Who's there?", 'Cow', 'Moo'],
  }
  const errors = validate(payload, knockRule)
  expect(errors).toHaveProperty('text')
})

// ── constraints: knock ──

test('knock: too few lines (< 4) → error on "lines"', () => {
  const payload: JokePayload = {
    format: 'knock',
    text: '',
    setup: '',
    punchline: '',
    lines: ['Knock knock', "Who's there?"],
  }
  const errors = validate(payload, knockRule)
  expect(errors).toHaveProperty('lines')
})

test('knock: too many lines (> 8) → error on "lines"', () => {
  const lines = Array.from({ length: 9 }, (_, i) => `line ${i + 1}`)
  const payload: JokePayload = { format: 'knock', text: '', setup: '', punchline: '', lines }
  const errors = validate(payload, knockRule)
  expect(errors).toHaveProperty('lines')
})

test('knock: a line exceeding max_line_chars → error on "lines"', () => {
  const longLine = 'a'.repeat(201)
  const payload: JokePayload = {
    format: 'knock',
    text: '',
    setup: '',
    punchline: '',
    lines: ['Knock knock', "Who's there?", 'Cow', longLine],
  }
  const errors = validate(payload, knockRule)
  expect(errors).toHaveProperty('lines')
})

test('knock: valid 4 lines each ≤ 200 chars → no error', () => {
  const payload: JokePayload = {
    format: 'knock',
    text: '',
    setup: '',
    punchline: '',
    lines: ['Knock knock', "Who's there?", 'Cow', 'Moo — I interrupted you!'],
  }
  const errors = validate(payload, knockRule)
  expect(errors).not.toHaveProperty('lines')
  expect(Object.keys(errors)).toHaveLength(0)
})

// ── constraints: story ──

test('story: text with fewer than 30 words → error on "text"', () => {
  const payload: JokePayload = {
    format: 'story',
    text: 'This is a short text with only a few words here.',
    setup: '',
    punchline: '',
    lines: null,
  }
  const errors = validate(payload, storyRule)
  expect(errors).toHaveProperty('text')
})

test('story: text with 30+ words → no error', () => {
  const words = Array.from({ length: 30 }, (_, i) => `word${i + 1}`).join(' ')
  const payload: JokePayload = { format: 'story', text: words, setup: '', punchline: '', lines: null }
  const errors = validate(payload, storyRule)
  expect(Object.keys(errors)).toHaveLength(0)
})

// ── fully-valid payloads → empty error object ──

test('oneliner: valid payload → no errors', () => {
  const payload: JokePayload = {
    format: 'oneliner',
    text: 'I told my wife she should embrace her mistakes. She gave me a hug.',
    setup: '',
    punchline: '',
    lines: null,
  }
  expect(validate(payload, onelineRule)).toEqual({})
})

test('setup: valid payload → no errors', () => {
  const payload: JokePayload = {
    format: 'setup',
    text: '',
    setup: "Why don't scientists trust atoms?",
    punchline: 'Because they make up everything!',
    lines: null,
  }
  expect(validate(payload, setupRule)).toEqual({})
})

// ── observ format ──

const observRule: FormatRule = {
  id: 6,
  slug: 'observ',
  name: 'Observational',
  description: "A wry observation about everyday life.",
  required_fields: ['text'],
  forbidden_fields: ['setup', 'punchline', 'lines'],
  constraints: {},
}

test('observ: valid payload with text → no errors', () => {
  const payload: JokePayload = {
    format: 'observ',
    text: 'Have you ever noticed how airports have moving walkways but everyone still sprints?',
    setup: '',
    punchline: '',
    lines: null,
  }
  expect(validate(payload, observRule)).toEqual({})
})

test('observ: blank text → error on "text"', () => {
  const payload: JokePayload = {
    format: 'observ',
    text: '',
    setup: '',
    punchline: '',
    lines: null,
  }
  const errors = validate(payload, observRule)
  expect(errors).toHaveProperty('text')
})

// ── forbidden-field for setup format ──

test('setup: payload with text populated (forbidden) → error on "text"', () => {
  const payload: JokePayload = {
    format: 'setup',
    text: 'This text should not be here',
    setup: "Why don't scientists trust atoms?",
    punchline: 'Because they make up everything!',
    lines: null,
  }
  const errors = validate(payload, setupRule)
  expect(errors).toHaveProperty('text')
})

// ── message precedence: required wins over constraint ──

test('knock: null lines → "required" message wins over constraint message', () => {
  const payload: JokePayload = {
    format: 'knock',
    text: '',
    setup: '',
    punchline: '',
    lines: null,
  }
  const errors = validate(payload, knockRule)
  expect(errors).toHaveProperty('lines')
  expect(errors['lines']).toMatch(/required/)
  // constraint message should NOT overwrite the required message
  expect(errors['lines']).not.toMatch(/at least 4 lines/i)
})

test('story: empty text → "required" message wins over min_text_words constraint', () => {
  const payload: JokePayload = {
    format: 'story',
    text: '',
    setup: '',
    punchline: '',
    lines: null,
  }
  const errors = validate(payload, storyRule)
  expect(errors).toHaveProperty('text')
  expect(errors['text']).toMatch(/required/)
  expect(errors['text']).not.toMatch(/30 words/i)
})
