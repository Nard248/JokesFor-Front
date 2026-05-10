import { useState } from 'react'
import { Link } from 'react-router'
import { Bell } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { useStreak } from '@/features/streak'
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
export type FlowNavKey = 'today' | 'explore' | 'search' | 'library'

interface FlowAppShellProps {
  active: FlowNavKey
  children: React.ReactNode
  /** Hide the streak chip (e.g. for pages where it's irrelevant) */
  hideStreak?: boolean
}

const NAV_ITEMS: ReadonlyArray<readonly [FlowNavKey, string, string]> = [
  ['today', 'Today', '/flow-canvas'],
  ['explore', 'Explore', '/explore'],
  ['search', 'Search', '/search'],
  ['library', 'Library', '/library'],
]

type OpenMenu = 'profile' | 'notifications' | null

export function FlowAppShell({ active, children, hideStreak }: FlowAppShellProps) {
  const { user, isAuthenticated } = useAuth()
  // Real streak data — only fetched if authenticated (hook handles unauth gracefully).
  const { data: streak } = useStreak()
  const streakDays = streak?.current_count ?? 0
  const initial = (user?.first_name?.[0] ?? user?.username?.[0] ?? 'A').toUpperCase()

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
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
            <span className="streak-chip">
              <span className="dot">🔥</span>
              {streakDays}-day streak
            </span>
          )}
          {isAuthenticated ? (
            <>
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
      <main>{children}</main>

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
