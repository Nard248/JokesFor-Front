/**
 * usePrefersReducedMotion tests — same matchMedia-stub approach as
 * useBreakpoint.test.ts.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

function setReducedMotion(reduced: boolean) {
  const mql = {
    matches: reduced,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }
  window.matchMedia = vi.fn().mockReturnValue(mql)
  return mql
}

afterEach(() => {
  vi.restoreAllMocks()
  // @ts-expect-error — remove the stub so tests stay isolated.
  delete window.matchMedia
})

describe('usePrefersReducedMotion', () => {
  it('reports false when the OS has no reduced-motion preference', () => {
    setReducedMotion(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })

  it('reports true when the OS prefers reduced motion', () => {
    setReducedMotion(true)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })

  it('falls back to false when matchMedia is unavailable (SSR-safe default)', () => {
    // No matchMedia installed (afterEach deleted it).
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })

  it('subscribes to change and removes the listener on unmount', () => {
    const mql = setReducedMotion(false)
    const { unmount } = renderHook(() => usePrefersReducedMotion())
    expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    unmount()
    expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})
