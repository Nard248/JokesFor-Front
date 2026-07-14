import { Link } from 'react-router'
import { Sparkles, X } from 'lucide-react'
import { useDailyReads } from './api'
import { useDailyReadsStore } from './store'

/**
 * One-time "you've hit your free daily jokes" nudge.
 *
 * Mounted once (in FlowAppShell) so it appears a SINGLE time the first moment
 * the user crosses the free cap in a session — not on every locked card. Once
 * dismissed (or the user taps upgrade) it stays gone for the rest of the
 * session. Silent when the cap is inactive (graceful degradation).
 */
export function DailyReadsNudge() {
  const { over } = useDailyReads()
  const dismissed = useDailyReadsStore((s) => s.nudgeDismissed)
  const dismissNudge = useDailyReadsStore((s) => s.dismissNudge)

  if (!over || dismissed) return null

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="daily-reads-nudge"
      className="dropdown-enter"
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        maxWidth: 'min(440px, calc(100vw - 32px))',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderRadius: 16,
        background: '#1A1A1A',
        color: '#fff',
        boxShadow: '0 16px 40px rgba(26,26,26,0.35)',
      }}
    >
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          width: 34,
          height: 34,
          borderRadius: 10,
          background: '#6A1CF6',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Sparkles size={16} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, lineHeight: 1.25 }}>
          You've enjoyed your 10 free jokes today
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
          Go unlimited with Supporter.
        </div>
      </div>
      <Link
        to="/settings/billing"
        data-testid="daily-reads-nudge-upgrade"
        onClick={dismissNudge}
        style={{
          flexShrink: 0,
          height: 34,
          padding: '0 14px',
          borderRadius: 9999,
          background: '#CAFD00',
          color: '#1A1A1A',
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: 13,
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        Upgrade
      </Link>
      <button
        type="button"
        aria-label="Dismiss"
        data-testid="daily-reads-nudge-dismiss"
        onClick={dismissNudge}
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: 8,
          background: 'transparent',
          color: 'rgba(255,255,255,0.6)',
          border: 0,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={16} />
      </button>
    </div>
  )
}
