import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { Bell, Check, Sparkles, UserPlus, ShieldAlert } from 'lucide-react'
import { useNotifications, useMarkAllRead } from '@/features/notifications'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { AppealButton } from '@/components/AppealButton'
import type { NotificationDTO } from '@/lib/api'

/** Appeal affordance for a notice: either a direct takedown appeal (we know
 * the joke id) or, for a rejection notice, a link to the creator hub — the
 * `joke_rejected` notification carries no submission id to appeal directly
 * from the inbox (rejected submissions aren't Jokes), so the CTA routes the
 * creator to where they CAN appeal (the rejected SubmissionDetailPage). */
type AppealAction = { kind: 'joke'; jokeId: number } | { kind: 'review' }

type PanelItem = {
  icon: React.ReactNode
  title: string
  sub: string
  tone: 'purple' | 'lime' | 'amber'
  appeal?: AppealAction
}

/** slug/verb string -> "Title Case" for the reason shown in the removal notice. */
function prettify(value: string): string {
  return value
    .split(/[-_]/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

function formatDeadline(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function mapNotification(n: NotificationDTO): PanelItem {
  const data = n.data ?? {}
  switch (n.verb) {
    case 'followed_you':
      return { icon: <UserPlus size={15} />, title: `${n.actor?.name ?? 'Someone'} followed you`, sub: n.actor?.username ?? '', tone: 'purple' }
    case 'joke_published':
      return { icon: <Sparkles size={15} />, title: 'Your joke was published', sub: n.joke?.preview ?? '', tone: 'lime' }
    case 'joke_removed': {
      // Richer notice (statement of reasons): most-common report reason +
      // appeal deadline, when present. Graceful — older notifications carry
      // no `data`, so fall back to the original copy.
      const reason = typeof data.reason === 'string' ? data.reason : undefined
      const deadline = typeof data.appeal_deadline === 'string' ? formatDeadline(data.appeal_deadline) : null
      const sub = reason
        ? `Reason: ${prettify(reason)}.${deadline ? ` Appeal by ${deadline}.` : ''}`
        : n.joke?.preview ?? 'It broke our guidelines.'
      return {
        icon: <ShieldAlert size={15} />,
        title: 'A joke was removed',
        sub,
        tone: 'amber',
        appeal: n.joke ? { kind: 'joke', jokeId: n.joke.id } : undefined,
      }
    }
    case 'joke_rejected': {
      const reason = typeof data.rejection_reason === 'string' ? data.rejection_reason : ''
      return {
        icon: <ShieldAlert size={15} />,
        title: 'Your submission was rejected',
        sub: reason || 'It did not meet our guidelines.',
        tone: 'amber',
        appeal: { kind: 'review' },
      }
    }
    case 'appeal_resolved': {
      const reversed = data.outcome === 'reversed'
      return {
        icon: <Sparkles size={15} />,
        title: reversed ? 'Your appeal was approved' : 'Your appeal was reviewed',
        sub: reversed ? 'The decision was reversed.' : 'The original decision stands.',
        tone: reversed ? 'lime' : 'purple',
      }
    }
    default:
      return { icon: <Sparkles size={15} />, title: 'Notification', sub: '', tone: 'purple' }
  }
}

/**
 * NotificationsPanel — dropdown shown when the user clicks the bell in
 * FlowAppShell. Wired to the real in-app inbox (`/notifications/`): new
 * followers, joke publishes, and moderation takedowns.
 */
export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const { isMobile } = useBreakpoint()
  const { data: notifications = [] } = useNotifications()
  const markAllRead = useMarkAllRead()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    const t = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
      document.addEventListener('keydown', handleKey)
    }, 0)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const items: PanelItem[] = notifications.map(mapNotification)

  // Mobile: a fixed-width dropdown anchored to the bell overflows a phone
  // (the bell sits near the right edge). Pin it to the viewport instead —
  // near-full-width, gutters both sides, so it never runs off-screen.
  const positioned: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: 'calc(64px + env(safe-area-inset-top, 0px))',
        left: 12,
        right: 12,
        width: 'auto',
      }
    : {
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: 320,
      }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Notifications"
      className="dropdown-enter"
      style={{
        ...positioned,
        zIndex: 50,
        background: '#fff',
        border: '1px solid #E9E8E7',
        borderRadius: 18,
        boxShadow: '0 16px 40px rgba(15, 14, 18, 0.14)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FBFAF7',
          borderBottom: '1px solid #E9E8E7',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={14} color="#6A1CF6" />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 14,
              color: '#1A1A1A',
              letterSpacing: '-0.005em',
            }}
          >
            Notifications
          </span>
        </div>
        <button
          type="button"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending || items.length === 0}
          data-testid="mark-all-read"
          style={{
            background: 'none',
            border: 0,
            cursor: items.length === 0 ? 'default' : 'pointer',
            color: '#52525B',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            opacity: items.length === 0 ? 0.5 : 1,
          }}
          aria-label="Mark all read"
        >
          <Check size={11} /> All read
        </button>
      </div>

      {/* Body */}
      {items.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: isMobile ? 'calc(100vh - 180px)' : 360, overflowY: 'auto' }}>
          {items.map((it, i) => (
            <li
              key={i}
              style={{
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                borderBottom: i < items.length - 1 ? '1px solid #F1EFEC' : '0',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background:
                    it.tone === 'lime' ? '#CAFD00' : it.tone === 'amber' ? '#FFC965' : '#F2E9FF',
                  color: it.tone === 'lime' ? '#3A4A00' : it.tone === 'amber' ? '#5F4200' : '#6A1CF6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {it.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#1A1A1A' }}>
                  {it.title}
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2, lineHeight: 1.4 }}>{it.sub}</div>
                {it.appeal && (
                  <div style={{ marginTop: 6 }}>
                    {it.appeal.kind === 'joke' ? (
                      <AppealButton jokeId={it.appeal.jokeId} label="Appeal" compact />
                    ) : (
                      <Link
                        to="/create"
                        style={{ fontSize: 12, fontWeight: 700, color: '#6A1CF6', textDecoration: 'none' }}
                      >
                        Review &amp; appeal
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: '#F2E9FF',
              color: '#6A1CF6',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div
            style={{
              marginTop: 14,
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 16,
              color: '#1A1A1A',
              letterSpacing: '-0.01em',
            }}
          >
            You're all <em className="wink">caught up.</em>
          </div>
          <p style={{ marginTop: 6, fontSize: 12, color: '#6B7280', maxWidth: 240, marginLeft: 'auto', marginRight: 'auto' }}>
            We'll ping you here when someone follows you, or when one of your jokes is
            published or removed.
          </p>
        </div>
      )}
    </div>
  )
}
