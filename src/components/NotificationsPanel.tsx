import { useEffect, useRef } from 'react'
import { Bell, Check, Sparkles } from 'lucide-react'

/**
 * NotificationsPanel — dropdown shown when the user clicks the bell in
 * FlowAppShell. No /notifications/ endpoint exists in the backend yet, so
 * this is a placeholder panel with an empty state and a couple of
 * brand-friendly ambient items (today's joke ready, streak reminder)
 * that are derived from existing UI state — not from a real notifications
 * inbox.
 *
 * When the backend ships /users/me/notifications/, swap the static items
 * for `useNotifications()` data — the visual treatment stays the same.
 */
export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

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

  // Placeholder items — swap for /users/me/notifications/ when backend lands.
  const items: { icon: React.ReactNode; title: string; sub: string; tone: 'purple' | 'lime' | 'amber' }[] = []

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Notifications"
      className="dropdown-enter"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        zIndex: 50,
        width: 320,
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
          onClick={onClose}
          style={{
            background: 'none',
            border: 0,
            cursor: 'pointer',
            color: '#52525B',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
          aria-label="Mark all read"
        >
          <Check size={11} /> All read
        </button>
      </div>

      {/* Body */}
      {items.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 360, overflowY: 'auto' }}>
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
            We'll ping you here when there's something worth your attention — daily-joke
            arrivals, streak reminders, replies to your submissions.
          </p>
        </div>
      )}
    </div>
  )
}
