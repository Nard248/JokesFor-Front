import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'

// The first render in a test file pays for module evaluation and the router's
// redirect pass; on shared CI runners that exceeds the 1 s default. A longer
// ceiling only delays tests that would fail anyway.
configure({ asyncUtilTimeout: 5000 })

// React Router's data router builds `new Request(url, { signal })` on every
// navigation (e.g. a <Navigate> redirect). Under jsdom that signal is jsdom's
// AbortSignal, which Node >= 24's built-in Request rejects. Tests never abort
// navigations, so retry without a foreign signal.
const NativeRequest = globalThis.Request
class JsdomSafeRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    let safeInit = init
    if (init?.signal) {
      try {
        new NativeRequest(input, init)
      } catch {
        const { signal: _foreignSignal, ...rest } = init
        safeInit = rest
      }
    }
    super(input, safeInit)
  }
}
globalThis.Request = JsdomSafeRequest as typeof Request
