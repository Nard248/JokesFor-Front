import { useEffect, useState } from 'react'

/**
 * useBreakpoint — the canonical responsive primitive for the JokesFor app.
 *
 * The authenticated app is built with **inline styles** (not CSS classes), so
 * media queries can't drive most layout decisions. This hook is the mechanism:
 * call it in a component and switch inline-style objects on the returned flags.
 *
 * ─── Convention for the per-page responsive sweep (see Docs/RESPONSIVE.md) ───
 *   const { isMobile } = useBreakpoint()
 *   <div style={{
 *     display: 'grid',
 *     gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
 *     gap: isMobile ? 16 : 24,
 *   }}>
 *
 *   • Multi-column grids/flex rows collapse to a single column on mobile.
 *   • Rely on the shell's fluid <main> container for max-width + centering;
 *     don't re-add page-level max-width unless it's NARROWER than the shell cap.
 *   • Interactive targets are ≥ 44px on mobile.
 *   • Test every page at 375 / 768 / 1280px.
 *
 * Breakpoints (px):
 *   mobile   < 640
 *   tablet   640 – 1023
 *   desktop  ≥ 1024
 *
 * SSR / non-DOM safe: with no `window`/`matchMedia` (server render, jsdom
 * without a matchMedia polyfill) it returns desktop defaults so the first
 * render is deterministic. Resize-aware via `matchMedia('change')` plus a
 * `resize` listener; all listeners are removed on unmount.
 */

export const BREAKPOINTS = {
  /** Widths below this are `mobile`. */
  mobile: 640,
  /** Widths at/above this are `desktop`; between the two is `tablet`. */
  desktop: 1024,
} as const

export interface BreakpointState {
  /** Viewport width < 640px. */
  isMobile: boolean
  /** Viewport width 640–1023px. */
  isTablet: boolean
  /** Viewport width ≥ 1024px. */
  isDesktop: boolean
  /** Current viewport width in px (SSR fallback: BREAKPOINTS.desktop). */
  width: number
}

// `- 0.02` keeps the mobile/tablet boundary from overlapping the tablet/desktop
// one on fractional-pixel (zoomed / hi-dpi) viewports.
const MOBILE_QUERY = `(max-width: ${BREAKPOINTS.mobile - 0.02}px)`
const DESKTOP_QUERY = `(min-width: ${BREAKPOINTS.desktop}px)`

function canMatch(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
}

function readState(): BreakpointState {
  if (!canMatch()) {
    return { isMobile: false, isTablet: false, isDesktop: true, width: BREAKPOINTS.desktop }
  }
  const isMobile = window.matchMedia(MOBILE_QUERY).matches
  const isDesktop = window.matchMedia(DESKTOP_QUERY).matches
  return {
    isMobile,
    isTablet: !isMobile && !isDesktop,
    isDesktop,
    width: window.innerWidth,
  }
}

function sameState(a: BreakpointState, b: BreakpointState): boolean {
  return (
    a.isMobile === b.isMobile &&
    a.isTablet === b.isTablet &&
    a.isDesktop === b.isDesktop &&
    a.width === b.width
  )
}

export function useBreakpoint(): BreakpointState {
  const [state, setState] = useState<BreakpointState>(readState)

  useEffect(() => {
    if (!canMatch()) return

    const mobileMql = window.matchMedia(MOBILE_QUERY)
    const desktopMql = window.matchMedia(DESKTOP_QUERY)

    // Only re-render when a value actually changed (avoids churn on every
    // resize pixel that doesn't cross a breakpoint but also doesn't change width).
    const update = () =>
      setState((prev) => {
        const next = readState()
        return sameState(prev, next) ? prev : next
      })

    // Primary mechanism: fire when a breakpoint threshold is crossed.
    mobileMql.addEventListener('change', update)
    desktopMql.addEventListener('change', update)
    // Keep `width` fresh for resizes within a single band.
    window.addEventListener('resize', update)

    // Reconcile in case the viewport changed between render and effect.
    update()

    return () => {
      mobileMql.removeEventListener('change', update)
      desktopMql.removeEventListener('change', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return state
}
