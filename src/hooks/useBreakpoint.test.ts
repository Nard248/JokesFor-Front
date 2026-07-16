/**
 * useBreakpoint tests.
 *
 * jsdom has no layout engine and no `window.matchMedia`, so we install a
 * controllable `matchMedia` stub that resolves `(max-width …)` / `(min-width …)`
 * queries against a fixed viewport width. This lets us assert the three bands
 * (mobile / tablet / desktop) and that listeners are cleaned up on unmount.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useBreakpoint, BREAKPOINTS } from './useBreakpoint'

function matches(query: string, width: number): boolean {
  const max = query.match(/max-width:\s*([\d.]+)px/)
  if (max) return width <= parseFloat(max[1])
  const min = query.match(/min-width:\s*([\d.]+)px/)
  if (min) return width >= parseFloat(min[1])
  return false
}

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: matches(query, width),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

afterEach(() => {
  vi.restoreAllMocks()
  // @ts-expect-error — remove the stub so tests stay isolated.
  delete window.matchMedia
})

describe('useBreakpoint', () => {
  it('exports the documented breakpoint constants', () => {
    expect(BREAKPOINTS.mobile).toBe(640)
    expect(BREAKPOINTS.desktop).toBe(1024)
  })

  it('reports mobile below 640px', () => {
    setViewport(375)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toMatchObject({ isMobile: true, isTablet: false, isDesktop: false, width: 375 })
  })

  it('reports tablet between 640 and 1023px', () => {
    setViewport(768)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toMatchObject({ isMobile: false, isTablet: true, isDesktop: false, width: 768 })
  })

  it('treats exactly 640px as tablet (mobile is strictly < 640)', () => {
    setViewport(640)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toMatchObject({ isMobile: false, isTablet: true, isDesktop: false })
  })

  it('reports desktop at 1024px and above', () => {
    setViewport(1280)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toMatchObject({ isMobile: false, isTablet: false, isDesktop: true, width: 1280 })
  })

  it('falls back to desktop defaults when matchMedia is unavailable', () => {
    // No matchMedia installed (afterEach deleted it).
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toMatchObject({ isMobile: false, isTablet: false, isDesktop: true, width: BREAKPOINTS.desktop })
  })

  it('subscribes to resize and removes the listener on unmount', () => {
    setViewport(1280)
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useBreakpoint())
    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    unmount()
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
