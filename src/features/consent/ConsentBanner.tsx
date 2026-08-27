import { useEffect, useLayoutEffect, useRef } from 'react'

import { useConsent } from './useConsent'

/** CSS custom property carrying the banner's height while it is on screen.
 *
 *  The banner is `position: fixed` at `bottom: 0` with `z-index: 9999`, and
 *  nothing reserved room for it, so it covered whatever sat at the bottom of
 *  the viewport: onboarding's "Continue" (the last element on a scrolling page,
 *  so scrolling it into view put it directly under the banner) and, at mobile
 *  widths, the whole of `nav.flow-tabbar`. Both were enabled but unclickable —
 *  `elementFromPoint` returned the banner's own button — and both hit only
 *  users who had not dismissed the banner yet, i.e. every new user, on the
 *  activation path.
 *
 *  Publishing the height lets the app shell pad its content and the tab bar sit
 *  above the banner, instead of every layout guessing a magic number.
 */
const CONSENT_HEIGHT_VAR = '--consent-h'

export function ConsentBanner() {
  const { decided, accept, reject } = useConsent()
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = document.documentElement
    if (decided || !ref.current) {
      root.style.setProperty(CONSENT_HEIGHT_VAR, '0px')
      return
    }
    const publish = () => {
      const h = ref.current?.getBoundingClientRect().height ?? 0
      root.style.setProperty(CONSENT_HEIGHT_VAR, `${Math.round(h)}px`)
    }
    publish()
    // The copy wraps at narrow widths, so the height is not a constant.
    const observer =
      typeof ResizeObserver === 'function' ? new ResizeObserver(publish) : null
    if (observer && ref.current) observer.observe(ref.current)
    window.addEventListener('resize', publish)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', publish)
    }
  }, [decided])

  // Never leave the reservation behind if the banner unmounts.
  useEffect(
    () => () => document.documentElement.style.setProperty(CONSENT_HEIGHT_VAR, '0px'),
    [],
  )

  if (decided) return null

  return (
    <div
      ref={ref}
      role="region"
      aria-label="Cookie consent"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#1A1A1A',
        color: '#F9F9F8',
        padding: '14px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '12px',
        justifyContent: 'space-between',
        fontSize: 14,
      }}
    >
      <span>
        We use essential cookies to run the site. With your consent we also use analytics cookies to
        improve your experience.{' '}
        <a
          href="/cookie-policy"
          style={{ color: '#CAFD00', textDecoration: 'underline' }}
        >
          Cookie Policy
        </a>
      </span>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={reject}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: '1px solid #555',
            background: 'transparent',
            color: '#F9F9F8',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Reject
        </button>
        <button
          onClick={accept}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            background: '#CAFD00',
            color: '#1A1A1A',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          Accept
        </button>
      </div>
    </div>
  )
}
