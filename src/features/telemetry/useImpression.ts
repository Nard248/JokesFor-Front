import { useEffect, useRef } from 'react'
import { trackImpression, type TelemetrySource } from '@/lib/telemetry'

/**
 * Fire a single real `impression` event when a joke card has been at least
 * ~50% visible for ~1 second. The telemetry buffer dedupes per (joke, source)
 * for the page-session, so this is also safe across remounts.
 *
 * Returns a ref to attach to the card's root element:
 *
 *   const ref = useImpression(joke.id, 'feed')
 *   return <article ref={ref}>…</article>
 *
 * Gating (auth + consent + adult + real-API) lives entirely in the telemetry
 * client — this hook just observes visibility and never throws.
 */
const VISIBLE_RATIO = 0.5
const DWELL_MS = 1000

export function useImpression<T extends HTMLElement = HTMLElement>(
  jokeId: number | undefined,
  source: TelemetrySource,
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof jokeId !== 'number' || !Number.isFinite(jokeId) || jokeId <= 0) return
    if (typeof IntersectionObserver === 'undefined') return

    let fired = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const clear = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }

    let observer: IntersectionObserver
    try {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (fired) return
            if (entry.isIntersecting && entry.intersectionRatio >= VISIBLE_RATIO) {
              if (!timer) {
                timer = setTimeout(() => {
                  fired = true
                  clear()
                  observer.disconnect()
                  trackImpression(jokeId, source)
                }, DWELL_MS)
              }
            } else {
              clear()
            }
          }
        },
        { threshold: [VISIBLE_RATIO] },
      )
      observer.observe(el)
    } catch {
      return
    }

    return () => {
      clear()
      try {
        observer.disconnect()
      } catch {
        /* noop */
      }
    }
  }, [jokeId, source])

  return ref
}
