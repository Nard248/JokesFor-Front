import { useEffect } from 'react'
import { trackWatch, flush as flushTelemetry, type TelemetrySource } from '@/lib/telemetry'

/**
 * Wave-2 watch-time telemetry. Attaches native listeners to a `<video>`/
 * `<audio>` element (via `ref`) and reports how much of it was actually
 * played, mirroring `useDwell`'s read-time mechanics for media playback:
 *
 *   - `timeupdate` tracks the max `currentTime` reached — a monotonically
 *     increasing high-water mark (re-watching an earlier part doesn't lower
 *     it), not a running total of visible spans like dwell's.
 *   - `pause` / `ended` send the accumulated watch time via `trackWatch`.
 *   - unmount and `pagehide` send only if there's >=500ms of unsent (new)
 *     progress, so a player that mounts/unmounts without meaningfully playing
 *     doesn't spam a garbage sample — mirrors the backend's WATCH_MIN_MS
 *     floor. `pagehide` matters because React cleanup does NOT run on
 *     tab-close/hard-nav (same reason `useDwell` binds it): without it,
 *     "watch then close the tab" — the common pattern — would never send.
 *   - The same accumulated value is never sent twice (tracked via
 *     `lastSentMs`): a `pause` fired with no new `timeupdate` since the last
 *     send is a no-op.
 *
 * Dedup: unlike impression/reveal, watch events are NOT deduped by the
 * telemetry client's per-session seen-set — `trackWatch` bypasses it via
 * `enqueue(event, false)`, the same mechanism `trackDwell` uses, because a
 * reader can legitimately re-watch a clip and each sample is real signal.
 * Auth/consent/adult/real-API gating lives entirely in the telemetry client;
 * this hook never throws.
 *
 * No-ops entirely when `jokeId`/`source` is undefined (mirrors `useDwell`'s
 * signature conventions). JokeRenderer only supplies both once the payoff is
 * revealed and a player actually exists — passing `undefined` beforehand
 * doubles as the signal that re-triggers this effect at the exact render
 * where the media element mounts (the dependency array changes from
 * `undefined` to a real id at that point).
 *
 *   const ref = useRef<HTMLVideoElement>(null)
 *   useWatchTracking(ref, jokeId, source)
 *   return <video ref={ref} .../>
 */
export function useWatchTracking<T extends HTMLMediaElement = HTMLMediaElement>(
  ref: React.RefObject<T | null>,
  jokeId: number | undefined,
  source: TelemetrySource | undefined,
): void {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof jokeId !== 'number' || !Number.isFinite(jokeId) || jokeId <= 0) return
    if (!source) return

    // Max currentTime (seconds) reached so far this mount.
    let maxReachedS = 0
    // watch_ms value already sent — guards against resending an identical
    // accumulated value (e.g. two `pause` events with no progress between).
    let lastSentMs = 0

    const watchPct = (): number | undefined => {
      const duration = el.duration
      if (!Number.isFinite(duration) || duration <= 0) return undefined
      const pct = (maxReachedS / duration) * 100
      return Math.max(0, Math.min(100, Math.round(pct)))
    }

    const trySend = (minDeltaMs: number) => {
      const watchMs = Math.round(maxReachedS * 1000)
      const delta = watchMs - lastSentMs
      if (delta <= 0 || delta < minDeltaMs) return
      trackWatch(jokeId, source, watchMs, watchPct())
      lastSentMs = watchMs
    }

    const onTimeUpdate = () => {
      const t = el.currentTime
      if (Number.isFinite(t) && t > maxReachedS) maxReachedS = t
    }
    const onPauseOrEnded = () => trySend(0)

    // Tab-close / hard navigation: React cleanup never runs, so ship the
    // sample from `pagehide` (delta-gated like unmount). ORDERING CAVEAT: the
    // telemetry client's own `pagehide → flush()` listener was registered on
    // the first enqueue of the page-session (bindPageHideListeners), i.e.
    // almost certainly BEFORE this one — and listeners on the same target run
    // in registration order regardless of the capture flag when the event is
    // dispatched AT the target (window). So by the time this handler enqueues
    // the watch event, the module's flush has already run and the sample
    // would die in the queue at unload. Hence the explicit `flushTelemetry()`
    // right after enqueueing — it rides out on a sendBeacon, which survives
    // unload. (`lastSentMs` inside trySend also guarantees a later unmount
    // cleanup can't double-send the same accumulated value.)
    const onPageHide = () => {
      trySend(500)
      flushTelemetry()
    }

    try {
      el.addEventListener('timeupdate', onTimeUpdate)
      el.addEventListener('pause', onPauseOrEnded)
      el.addEventListener('ended', onPauseOrEnded)
      window.addEventListener('pagehide', onPageHide)
    } catch {
      /* never throw */
    }

    return () => {
      try {
        el.removeEventListener('timeupdate', onTimeUpdate)
        el.removeEventListener('pause', onPauseOrEnded)
        el.removeEventListener('ended', onPauseOrEnded)
        window.removeEventListener('pagehide', onPageHide)
      } catch {
        /* noop */
      }
      // Unmount: ship any unsent progress ≥500ms.
      trySend(500)
    }
  }, [ref, jokeId, source])
}
