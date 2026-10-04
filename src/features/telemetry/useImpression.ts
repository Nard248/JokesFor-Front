import { useEffect, useRef } from 'react'
import { trackImpression, type TelemetrySource } from '@/lib/telemetry'
import { getTelemetrySession, subscribeTelemetrySession } from './session'

/** A one-second visible impression within the current eligible account session. */
export function useImpression<T extends HTMLElement = HTMLElement>(jokeId: number | undefined, source: TelemetrySource) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof jokeId !== 'number' || !Number.isFinite(jokeId) || jokeId <= 0 || typeof IntersectionObserver === 'undefined') return
    let fired = false
    let visible = false
    let timer: ReturnType<typeof setTimeout> | null = null
    const clear = () => { if (timer !== null) clearTimeout(timer); timer = null }
    const eligible = () => visible && document.visibilityState !== 'hidden' && getTelemetrySession().eligible
    const schedule = () => {
      if (fired || timer !== null || !eligible()) return
      timer = setTimeout(() => {
        clear()
        if (!eligible()) return
        fired = true
        trackImpression(jokeId, source)
      }, 1000)
    }
    const unsubscribe = subscribeTelemetrySession(() => { clear(); fired = false; schedule() })
    const onVisibility = () => { clear(); schedule() }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        visible = entry.isIntersecting && entry.intersectionRatio >= 0.5
        if (visible) schedule()
        else clear()
      }
    }, { threshold: [0.5] })
    observer.observe(el)
    document.addEventListener('visibilitychange', onVisibility)
    return () => { unsubscribe(); clear(); observer.disconnect(); document.removeEventListener('visibilitychange', onVisibility) }
  }, [jokeId, source])
  return ref
}
