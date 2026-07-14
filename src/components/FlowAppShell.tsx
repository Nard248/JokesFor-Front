import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Bell, Plus } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { useStreak } from '@/features/streak'
import { useUnseenSubmissionChange } from '@/features/create/store'
import { useUnreadCount } from '@/features/notifications'
import { DailyReadsNudge } from '@/features/daily-reads'
import { ProfileMenu } from './ProfileMenu'
import { NotificationsPanel } from './NotificationsPanel'

/**
 * FlowAppShell — top chrome for the redesigned authenticated experience.
 *
 * Used by /flow-canvas, /explore, /search. Provides logo + nav + streak
 * + bell + avatar. Replaces the legacy Layout for these pages.
 *
 * Falls back gracefully for anonymous users: default avatar, no streak
 * shown. Streak chip pulls real data from /users/me/streak/.
 */
export type FlowNavKey = 'today' | 'explore' | 'search' | 'trending' | 'daily' | 'favorites' | 'library'

interface FlowAppShellProps {
  active?: FlowNavKey
  children: React.ReactNode
  /** Hide the streak chip (e.g. for pages where it's irrelevant) */
  hideStreak?: boolean
}

const NAV_ITEMS: ReadonlyArray<readonly [FlowNavKey, string, string]> = [
  ['today', 'Today', '/flow-canvas'],
  ['explore', 'Explore', '/explore'],
  ['search', 'Search', '/search'],
  ['trending', 'Trending', '/trending'],
  ['daily', 'Daily', '/daily'],
  ['favorites', 'Favorites', '/favorites'],
  ['library', 'Library', '/library'],
]

type OpenMenu = 'profile' | 'notifications' | null

export function FlowAppShell({ active, children, hideStreak }: FlowAppShellProps) {
  const { user, isAuthenticated } = useAuth()
  // Real streak data — only fetched if authenticated (hook handles unauth gracefully).
  const { data: streak } = useStreak()
  const streakDays = streak?.current_count ?? 0
  const initial = (user?.first_name?.[0] ?? user?.username?.[0] ?? 'A').toUpperCase()
  // Always call unconditionally (hooks rules); hook is safe when no drafts exist.
  const hasUnseenChange = useUnseenSubmissionChange()
  const { data: unreadCount = 0 } = useUnreadCount()

  // Pathname becomes the React key for <main>. When the user navigates between
  // FlowAppShell-wrapped pages, React would normally reuse the <main> element
  // (same parent, same tag) and only diff its children — meaning the .page-enter
  // animation wouldn't re-fire. Keying by pathname forces a fresh mount per
  // route, which restarts the CSS animation. Costs ~one extra mount/unmount.
  const { pathname } = useLocation()

  // Mutually-exclusive dropdown state. Click bell or avatar → open one,
  // close the other. Outside-click + Escape closes (handled by each panel).
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const toggle = (which: Exclude<OpenMenu, null>) =>
    setOpenMenu((prev) => (prev === which ? null : which))

  return (
    <>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 32px',
          borderBottom: '1px solid #E9E8E7',
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <Link
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#1A1A1A' }}
          >
            <img src="/Logos/appicon_purple.svg" alt="" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em' }}>
              JokesFor
            </span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            {NAV_ITEMS.map(([key, label, to]) => (
              <Link
                key={key}
                to={to}
                style={{
                  color: active === key ? '#1A1A1A' : '#52525B',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  padding: '8px 14px',
                  borderRadius: 9999,
                  background: active === key ? '#fff' : 'transparent',
                  border: active === key ? '1px solid #E9E8E7' : '1px solid transparent',
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {!hideStreak && isAuthenticated && streakDays > 0 && (
            <span className="streak-chip streak-chip-enter">
              <span className="dot">🔥</span>
              {streakDays}-day streak
            </span>
          )}
          {isAuthenticated ? (
            <>
              {/* Create / submit a joke */}
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <Link
                  to="/create"
                  className="btn-flow-ghost"
                  aria-label="Submit a joke"
                  title="Submit a joke"
                  style={{ height: 40, width: 40, padding: 0, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#1A1A1A' }}
                >
                  <Plus size={16} />
                </Link>
                {isAuthenticated && hasUnseenChange && (
                  <span
                    data-testid="creator-dot"
                    aria-label="New submission status update"
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#6A1CF6',
                      border: '1.5px solid #fff',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>

              {/* Notifications */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="btn-flow-ghost"
                  aria-label="Notifications"
                  aria-haspopup="dialog"
                  aria-expanded={openMenu === 'notifications'}
                  onClick={() => toggle('notifications')}
                  style={{ height: 40, width: 40, padding: 0, borderRadius: 12 }}
                >
                  <Bell size={16} />
                </button>
                {unreadCount > 0 && (
                  <span
                    aria-label={`${unreadCount} unread notifications`}
                    data-testid="unread-badge"
                    style={{
                      position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16,
                      padding: '0 4px', borderRadius: 8, background: '#6A1CF6', color: '#fff',
                      fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', pointerEvents: 'none',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                {openMenu === 'notifications' && (
                  <NotificationsPanel onClose={() => setOpenMenu(null)} />
                )}
              </div>

              {/* Profile / account */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  aria-label="Account menu"
                  aria-haspopup="menu"
                  aria-expanded={openMenu === 'profile'}
                  onClick={() => toggle('profile')}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: '#6A1CF6',
                    color: '#fff',
                    border: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    transition: 'box-shadow 0.12s ease, transform 0.12s ease',
                    boxShadow: openMenu === 'profile' ? '0 0 0 4px #F2E9FF' : 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 0 0 4px #F2E9FF')}
                  onMouseLeave={(e) => {
                    if (openMenu !== 'profile') e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {initial}
                </button>
                {openMenu === 'profile' && <ProfileMenu onClose={() => setOpenMenu(null)} />}
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="btn-flow-primary"
              style={{ textDecoration: 'none', display: 'inline-flex' }}
            >
              Sign in
            </Link>
          )}
        </div>
      </header>
      <main key={pathname} className="page-enter">{children}</main>

      {/* One-time freemium nudge — shown once the first moment the user crosses
          the free daily-reads cap. Silent (and network-free) when uncapped. */}
      {isAuthenticated && <DailyReadsNudge />}

      {/* Local button styles — duplicated across Flow* pages, kept here so
          the shell renders cleanly even if a page forgot to inline them. */}
      <style>{`
        .btn-flow-primary {
          height: 48px; padding: 0 24px; border: 0; border-radius: 9999px;
          font-family: var(--font-sans); font-weight: 700; font-size: 15px;
          background: #6A1CF6; color: #fff; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          transition: background 0.12s ease, transform 0.12s ease;
        }
        .btn-flow-primary:hover { background: #5D00E4; }
        .btn-flow-primary:active { transform: translateY(1px); }
        .btn-flow-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-flow-ghost {
          height: 40px; padding: 0 16px; border: 1px solid #E9E8E7; border-radius: 9999px;
          font-family: var(--font-sans); font-weight: 600; font-size: 13px;
          background: transparent; color: #1A1A1A; cursor: pointer;
          display: inline-flex; align-items: center; gap: 6px;
          transition: background 0.12s ease;
        }
        .btn-flow-ghost:hover { background: #F4F2EE; }

        .btn-flow-reward {
          height: 52px; padding: 0 24px; border: 0; border-radius: 9999px;
          font-family: var(--font-sans); font-weight: 700; font-size: 15px;
          background: #1A1A1A; color: #CAFD00; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          transition: background 0.12s ease, transform 0.12s ease;
        }
        .btn-flow-reward:hover { background: #000; }
        .btn-flow-reward:active { transform: translateY(1px); }
      `}</style>
    </>
  )
}
