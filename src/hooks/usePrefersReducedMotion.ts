import { useEffect, useState } from 'react'

/**
 * usePrefersReducedMotion — mirrors useBreakpoint's matchMedia+listener
 * pattern for the OS-level `prefers-reduced-motion` preference.
 *
 * Used by JokeRenderer's GIF-video branch: a `is_gif` media item normally
 * autoplays muted+looped on reveal, but a reader who has asked their OS to
 * reduce motion gets a poster + tap-to-play `<video controls>` instead —
 * same accessibility rationale as the `.punch-blur` reduced-motion carve-out
 * in index.css.
 *
 * SSR / non-DOM safe: with no `window`/`matchMedia` it defaults to `false`
 * (motion allowed) so the first render is deterministic.
 */

const QUERY = '(prefers-reduced-motion: reduce)'

function canMatch(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
}

function readState(): boolean {
  if (!canMatch()) return false
  return window.matchMedia(QUERY).matches
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(readState)

  useEffect(() => {
    if (!canMatch()) return

    const mql = window.matchMedia(QUERY)
    const update = () => setReduced(mql.matches)

    mql.addEventListener('change', update)
    // Reconcile in case the preference changed between render and effect.
    update()

    return () => mql.removeEventListener('change', update)
  }, [])

  return reduced
}
