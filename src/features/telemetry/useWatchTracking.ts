import { useEffect } from 'react'
import { trackWatch, flush as flushTelemetry, type TelemetrySource } from '@/lib/telemetry'
import { getTelemetrySession, subscribeTelemetrySession } from './session'

/** Measure visible, elapsed playing time, never the seek position or a cumulative total. */
export function useWatchTracking<T extends HTMLMediaElement = HTMLMediaElement>(
  ref: React.RefObject<T | null>,
  jokeId: number | undefined,
  source: TelemetrySource | undefined,
): void {
  useEffect(() => {
    const el = ref.current
    if (!el || !source || typeof jokeId !== 'number' || !Number.isFinite(jokeId) || jokeId <= 0) return
    let playing = !el.paused && !el.seeking && el.readyState >= 3
    let startedAt: number | null = null
    let elapsed = 0
    const resume = () => {
      if (playing && startedAt === null && document.visibilityState !== 'hidden' && getTelemetrySession().eligible) {
        startedAt = performance.now()
      }
    }
    const pause = () => {
      if (startedAt !== null) {
        elapsed += Math.max(0, performance.now() - startedAt)
        startedAt = null
      }
    }
    const send = () => {
      pause()
      if (elapsed >= 500) {
        // Coverage is unknown: currentTime and played ranges may include seeks
        // or playback before this account/consent session. Omit watch_pct.
        trackWatch(jokeId, source, Math.round(elapsed))
        elapsed = 0
      }
    }
    const onPlaying = () => { playing = true; resume() }
    const onStopped = () => { playing = false; send() }
    const onPageHide = () => { send(); flushTelemetry() }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') onPageHide()
      else resume()
    }
    const unsubscribe = subscribeTelemetrySession(() => {
      startedAt = null
      elapsed = 0
      resume()
    })
    resume()
    el.addEventListener('playing', onPlaying)
    const stopEvents = ['pause', 'ended', 'waiting', 'seeking', 'emptied']
    stopEvents.forEach((name) => el.addEventListener(name, onStopped))
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      unsubscribe()
      el.removeEventListener('playing', onPlaying)
      stopEvents.forEach((name) => el.removeEventListener(name, onStopped))
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      send()
    }
  }, [ref, jokeId, source])
}
