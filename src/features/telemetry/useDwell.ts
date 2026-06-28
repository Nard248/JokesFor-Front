import { useEffect, useRef } from 'react'
import { trackDwell, type TelemetrySource } from '@/lib/telemetry'

/**
 * Phase-2 read-time telemetry. Measures how long a joke is actually visible to
 * the reader and (for long/story content) the max scroll depth they reached,
 * then flushes one `dwell` event via `trackDwell`.
 *
 * Mechanics:
 *   - An IntersectionObserver (≥50% visible) starts/stops an accumulation
 *     timer. Time only counts while the element is on screen.
 *   - `visibilitychange → hidden` pauses accumulation (tab switch / minimise).
 *   - Accumulated ms is FLUSHED when the element leaves the viewport, on
 *     unmount, and on `pagehide`. Only flushed if ≥ ~1s (short blips aren't a
 *     read); capped at 600000ms in the telemetry client.
 *   - Scroll depth: while visible, the max scroll % reached *within* the
 *     element's own content is tracked and sent as `scroll_pct`. For content
 *     that doesn't overflow (short jokes) the element never scrolls, so 0 is
 *     reported — pass `trackScroll: false` to omit scroll entirely.
 *
 * Composes with `useImpression` on the same card: attach both refs (or merge),
 * they observe independently and never interfere.
 *
 * Gating (auth + consent + adult + real-API) lives entirely in the telemetry
 * client. This hook never throws.
 *
 *   const ref = useDwell(joke.id, 'feed')
 *   return <article ref={ref}>…</article>
 */
const VISIBLE_RATIO = 0.5

interface UseDwellOptions<T extends HTMLElement> {
  /** Provide an existing ref to share with another hook (e.g. useImpression). */
  ref?: React.RefObject<T | null>
  /**
   * Track max scroll depth within the element's scrollable content and send it
   * as scroll_pct. Defaults to true; set false for short, non-scrolling cards.
   */
  trackScroll?: boolean
}

export function useDwell<T extends HTMLElement = HTMLElement>(
  jokeId: number | undefined,
  source: TelemetrySource,
  options: UseDwellOptions<T> = {},
) {
  const { trackScroll = true } = options
  const internalRef = useRef<T>(null)
  const ref = options.ref ?? internalRef

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof jokeId !== 'number' || !Number.isFinite(jokeId) || jokeId <= 0) return

    // Accumulated visible time and the running clock for the current visible
    // span. `startedAt === null` means "not currently counting".
    let accumulatedMs = 0
    let startedAt: number | null = null
    let visibleInViewport = false
    let maxScrollPct = 0
    let scrollSeen = false

    const now = () =>
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now()

    const isPageVisible = () =>
      typeof document === 'undefined' || document.visibilityState !== 'hidden'

    // Begin counting if conditions allow (in viewport AND tab visible).
    const resume = () => {
      if (startedAt === null && visibleInViewport && isPageVisible()) {
        startedAt = now()
      }
    }

    // Stop counting, banking elapsed time into the accumulator.
    const pause = () => {
      if (startedAt !== null) {
        accumulatedMs += now() - startedAt
        startedAt = null
      }
    }

    // Capture the deepest scroll point the reader reached through the content.
    // Two modes:
    //   1. The element itself overflows and scrolls internally (e.g. a story
    //      card with its own scrollbar) → use scrollTop/scrollHeight.
    //   2. The element is taller than the viewport and the *page* scrolls past
    //      it (e.g. the detail page) → use how far its bottom has risen toward
    //      the top of the viewport.
    const sampleScroll = () => {
      if (!trackScroll) return
      try {
        const internal = el.scrollHeight - el.clientHeight
        if (internal > 0) {
          scrollSeen = true
          const pct = (el.scrollTop / internal) * 100
          if (pct > maxScrollPct) maxScrollPct = pct
          return
        }
        if (typeof window === 'undefined' || typeof el.getBoundingClientRect !== 'function') return
        const rect = el.getBoundingClientRect()
        const viewportH = window.innerHeight || document.documentElement.clientHeight || 0
        const overflow = rect.height - viewportH
        if (overflow > 0) {
          // 0% when the element's top is at the viewport top; 100% when its
          // bottom reaches the viewport bottom (the reader scrolled all the way
          // through). -rect.top is how far we've scrolled into the element.
          scrollSeen = true
          const pct = (-rect.top / overflow) * 100
          if (pct > maxScrollPct) maxScrollPct = Math.max(0, Math.min(100, pct))
        }
      } catch {
        /* never throw */
      }
    }

    // Flush the accumulated read-time as a single dwell event, then reset so a
    // later re-entry starts a fresh sample.
    const flushDwell = () => {
      pause()
      const ms = accumulatedMs
      accumulatedMs = 0
      const scrollPct = trackScroll && scrollSeen ? maxScrollPct : undefined
      maxScrollPct = 0
      scrollSeen = false
      trackDwell(jokeId, source, ms, scrollPct)
    }

    const onVisibilityChange = () => {
      if (isPageVisible()) resume()
      else pause()
    }

    let observer: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== 'undefined') {
      try {
        observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              const visible =
                entry.isIntersecting && entry.intersectionRatio >= VISIBLE_RATIO
              if (visible && !visibleInViewport) {
                visibleInViewport = true
                sampleScroll()
                resume()
              } else if (!visible && visibleInViewport) {
                visibleInViewport = false
                // Left the viewport → bank and ship this read sample.
                flushDwell()
              }
            }
          },
          { threshold: [VISIBLE_RATIO] },
        )
        observer.observe(el)
      } catch {
        observer = null
      }
    }

    try {
      document.addEventListener('visibilitychange', onVisibilityChange)
      window.addEventListener('pagehide', flushDwell)
      if (trackScroll) {
        el.addEventListener('scroll', sampleScroll, { passive: true })
        // The detail page scrolls the window past a tall element, so also
        // sample on window scroll (passive — never blocks the UI).
        window.addEventListener('scroll', sampleScroll, { passive: true })
      }
    } catch {
      /* never throw */
    }

    return () => {
      try {
        observer?.disconnect()
      } catch {
        /* noop */
      }
      try {
        document.removeEventListener('visibilitychange', onVisibilityChange)
        window.removeEventListener('pagehide', flushDwell)
        if (trackScroll) {
          el.removeEventListener('scroll', sampleScroll)
          window.removeEventListener('scroll', sampleScroll)
        }
      } catch {
        /* noop */
      }
      // Unmount: ship whatever we accumulated.
      flushDwell()
    }
  }, [jokeId, source, trackScroll, ref])

  return ref
}
