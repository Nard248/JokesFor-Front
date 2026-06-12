import { parseAuthError } from './parseAuthError'

test('reads field-error shape { code: [...] }', () => {
  const e = { response: { status: 400, data: { code: ['Incorrect code.'] } } }
  expect(parseAuthError(e)).toEqual({ message: 'Incorrect code.', status: 400 })
})

test('reads flow-error shape { detail }', () => {
  const e = { response: { status: 400, data: { detail: 'This email is already verified. Please log in.' } } }
  expect(parseAuthError(e).message).toMatch(/already verified/)
})

test('surfaces 429 status', () => {
  const e = { response: { status: 429, data: { detail: 'Too many attempts. Request a new code.' } } }
  expect(parseAuthError(e).status).toBe(429)
})

test('falls back when no response (network error)', () => {
  expect(parseAuthError(new Error('Network Error')).message).toMatch(/something went wrong/i)
})
