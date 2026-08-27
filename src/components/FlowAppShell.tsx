import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Bell, Plus, Home, Compass, Search, Bookmark, User, LogIn, type LucideIcon } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { useStreak } from '@/features/streak'
import { useUnseenSubmissionChange } from '@/features/create/store'
import { useUnreadCount } from '@/features/notifications'
import { DailyReadsNudge } from '@/features/daily-reads'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { ProfileMenu } from './ProfileMenu'
import { NotificationsPanel } from './NotificationsPanel'

/**
 * FlowAppShell — top chrome for the redesigned authenticated experience.
 *
 * Used by /flow-canvas, /explore, /search, /library, … Provides logo + nav +
 * streak + bell + avatar. Replaces the legacy Layout for these pages.
 *
 * Responsive (Phase 1 foundation — see Docs/RESPONSIVE.md):
 *   • Desktop (≥1024): full top nav (all destinations) + streak chip.
 *   • Tablet (640–1023): same top nav, tighter gaps/padding, streak hidden so
 *     the right-side actions never overflow. Wraps cleanly if still tight.
 *   • Mobile (<640): top nav is replaced by a fixed BOTTOM TAB BAR of the
 *     primary destinations; the header keeps the logo + a compact action
 *     cluster. <main> gets bottom padding so content clears the bar.
 *
 * The shell's <main> is the app's fluid content container: centered, capped at
 * CONTENT_MAX_WIDTH, with a small responsive gutter. Global horizontal-scroll
 * protection lives in index.css (`html { overflow-x: hidden }`).
 *
 * Falls back gracefully for anonymous users: default avatar, no streak shown.
 */
export type FlowNavKey = 'today' | 'explore' | 'search' | 'trending' | 'daily' | 'favorites' | 'library'

interface FlowAppShellProps {
  active?: FlowNavKey
  children: React.ReactNode
  /** Hide the streak chip (e.g. for pages where it's irrelevant) */
  hideStreak?: boolean
}

/** Desktop / tablet top nav. */
const NAV_ITEMS: ReadonlyArray<readonly [FlowNavKey, string, string]> = [
  ['today', 'Today', '/flow-canvas'],
  ['explore', 'Explore', '/explore'],
  ['search', 'Search', '/search'],
  ['trending', 'Trending', '/trending'],
  ['daily', 'Daily', '/daily'],
  ['favorites', 'Favorites', '/favorites'],
  ['library', 'Library', '/library'],
]

/** Mobile bottom tab bar — the five primary destinations. The last tab swaps
 *  to "Sign in" for anonymous users (mirrors the desktop header CTA). */
type TabKey = FlowNavKey | 'profile' | 'signin'
interface BottomTab {
  key: TabKey
  label: string
  to: string
  Icon: LucideIcon
}
const BOTTOM_TABS_BASE: ReadonlyArray<BottomTab> = [
  { key: 'today', label: 'Today', to: '/flow-canvas', Icon: Home },
  { key: 'explore', label: 'Explore', to: '/explore', Icon: Compass },
  { key: 'search', label: 'Search', to: '/search', Icon: Search },
  { key: 'library', label: 'Library', to: '/library', Icon: Bookmark },
]
const PROFILE_TAB: BottomTab = { key: 'profile', label: 'Profile', to: '/profile', Icon: User }
const SIGNIN_TAB: BottomTab = { key: 'signin', label: 'Sign in', to: '/login', Icon: LogIn }

/** Desktop cap for the fluid content container. */
const CONTENT_MAX_WIDTH = 1200
/** Height reserved under mobile content so nothing hides behind the tab bar. */
const MOBILE_BOTTOM_CLEARANCE = 'calc(64px + env(safe-area-inset-bottom))'

type OpenMenu = 'profile' | 'notifications' | null

export function FlowAppShell({ active, children, hideStreak }: FlowAppShellProps) {
  const { user, isAuthenticated } = useAuth()
  const { isMobile, isTablet, isDesktop } = useBreakpoint()
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

  const showStreak = !hideStreak && isAuthenticated && streakDays > 0 && isDesktop

  const bottomTabs: ReadonlyArray<BottomTab> = [
    ...BOTTOM_TABS_BASE,
    isAuthenticated ? PROFILE_TAB : SIGNIN_TAB,
  ]
  const tabIsActive = (tab: BottomTab): boolean =>
    active === tab.key || pathname === tab.to || pathname.startsWith(`${tab.to}/`)

  return (
    <>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '12px 16px' : isTablet ? '14px 20px' : '18px 32px',
          borderBottom: '1px solid #E9E8E7',
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isDesktop ? 36 : 16, minWidth: 0 }}>
          <Link
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#1A1A1A' }}
          >
            <img src="/Logos/appicon_purple.svg" alt="" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em' }}>
              JokesFor
            </span>
          </Link>
          {/* Desktop / tablet top nav — hidden on mobile (bottom tab bar takes over). */}
          {!isMobile && (
            <nav
              aria-label="Main"
              style={{ display: 'flex', alignItems: 'center', gap: isTablet ? 2 : 4, flexWrap: 'wrap' }}
            >
              {NAV_ITEMS.map(([key, label, to]) => (
                <Link
                  key={key}
                  to={to}
                  aria-current={active === key ? 'page' : undefined}
                  style={{
                    color: active === key ? '#1A1A1A' : '#52525B',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: isTablet ? 13 : 14,
                    textDecoration: 'none',
                    padding: isTablet ? '6px 10px' : '8px 14px',
                    borderRadius: 9999,
                    background: active === key ? '#fff' : 'transparent',
                    border: active === key ? '1px solid #E9E8E7' : '1px solid transparent',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14 }}>
          {showStreak && (
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
                  style={{ height: 44, width: 44, padding: 0, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#1A1A1A' }}
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
                  style={{ height: 44, width: 44, padding: 0, borderRadius: 12 }}
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
                    width: 44,
                    height: 44,
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
            // Anonymous: header CTA on tablet/desktop; on mobile the bottom
            // tab bar carries the "Sign in" tab instead.
            !isMobile && (
              <Link
                to="/login"
                className="btn-flow-primary"
                style={{ textDecoration: 'none', display: 'inline-flex' }}
              >
                Sign in
              </Link>
            )
          )}
        </div>
      </header>

      <main
        key={pathname}
        className="page-enter"
        style={{
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          marginLeft: 'auto',
          marginRight: 'auto',
          boxSizing: 'border-box',
          // Small responsive gutter (≈0 on phones — pages still supply their own
          // horizontal padding until the Phase-2 sweep consolidates it here).
          paddingLeft: 'clamp(0px, 2vw, 24px)',
          paddingRight: 'clamp(0px, 2vw, 24px)',
          // Clear the fixed mobile tab bar.
          paddingBottom: isMobile ? MOBILE_BOTTOM_CLEARANCE : undefined,
        }}
      >
        {children}
      </main>

      {/* Mobile bottom tab bar — real <nav> with labeled links + visible focus. */}
      {isMobile && (
        <nav className="flow-tabbar" aria-label="Primary">
          {bottomTabs.map((tab) => {
            const activeTab = tabIsActive(tab)
            const { Icon } = tab
            return (
              <Link
                key={tab.key}
                to={tab.to}
                className="flow-tab"
                aria-current={activeTab ? 'page' : undefined}
              >
                <Icon size={22} strokeWidth={activeTab ? 2.4 : 2} aria-hidden="true" />
                <span>{tab.label}</span>
              </Link>
            )
          })}
        </nav>
      )}

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

        /* Mobile bottom tab bar. */
        .flow-tabbar {
          /* Sit ABOVE the consent banner rather than under it. The banner is
             fixed at bottom:0 with z-index 9999, so at 375x812 it covered the
             whole tab bar and a first-time visitor could not tap any nav item.
             --consent-h is 0px once consent is decided (see ConsentBanner). */
          position: fixed; left: 0; right: 0; bottom: var(--consent-h, 0px); z-index: 40;
          display: flex; align-items: stretch; justify-content: space-around;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid #E9E8E7;
          padding-bottom: env(safe-area-inset-bottom);
        }
        .flow-tab {
          flex: 1 1 0; min-width: 0; min-height: 44px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 3px; padding: 8px 4px 6px;
          text-decoration: none; color: #6B7280;
          font-family: var(--font-display); font-weight: 600; font-size: 11px;
          transition: color 0.12s ease;
        }
        .flow-tab[aria-current="page"] { color: #6A1CF6; }
        .flow-tab:focus-visible {
          outline: 2px solid #6A1CF6; outline-offset: -2px; border-radius: 10px;
        }
      `}</style>
    </>
  )
}
