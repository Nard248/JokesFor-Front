import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import { User as UserIcon, Settings, Bookmark, LogOut, ChevronRight } from 'lucide-react'
import { useAuth, useLogout } from '@/features/auth'

/**
 * ProfileMenu — dropdown shown when the user clicks their avatar in
 * FlowAppShell's top nav. Boilerplate account actions: view profile,
 * settings, library, sign out.
 *
 * Pure presentation — open/close state is owned by the parent
 * (FlowAppShell), which mutually-excludes this with NotificationsPanel.
 *
 * Closes on:
 *  - outside click (mousedown anywhere not inside this panel)
 *  - Escape key
 *  - any link click (because navigation unmounts)
 *  - sign-out completion
 */
export function ProfileMenu({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const logout = useLogout()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  // Outside click + Escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    // Defer one tick so the opening click doesn't fire close immediately.
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

  const displayName = user?.first_name || user?.username || 'You'
  const email = user?.email ?? ''
  const handle = user?.username ? `@${user.username}` : ''
  const initial = displayName[0]?.toUpperCase() ?? 'U'

  const handleSignOut = () => {
    logout.mutate(undefined, {
      onSettled: () => {
        onClose()
        navigate('/', { replace: true })
      },
    })
  }

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Account"
      className="dropdown-enter"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        zIndex: 50,
        width: 280,
        background: '#fff',
        border: '1px solid #E9E8E7',
        borderRadius: 18,
        boxShadow: '0 16px 40px rgba(15, 14, 18, 0.14)',
        overflow: 'hidden',
      }}
    >
      {/* Identity header */}
      <div style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12, background: '#FBFAF7' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#6A1CF6',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 14,
              color: '#1A1A1A',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#6B7280',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
            }}
            title={email}
          >
            {handle || email}
          </div>
        </div>
      </div>

      {/* Items */}
      <nav style={{ padding: 8, display: 'flex', flexDirection: 'column' }}>
        <MenuLink to="/profile" onClick={onClose} icon={<UserIcon size={16} />}>
          View profile
        </MenuLink>
        <MenuLink to="/library" onClick={onClose} icon={<Bookmark size={16} />}>
          Your library
        </MenuLink>
        <MenuLink to="/settings" onClick={onClose} icon={<Settings size={16} />}>
          Settings
        </MenuLink>
      </nav>

      {/* Divider + sign out */}
      <div style={{ borderTop: '1px solid #E9E8E7', padding: 8 }}>
        <button
          type="button"
          role="menuitem"
          onClick={handleSignOut}
          disabled={logout.isPending}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            padding: '10px 12px',
            background: 'transparent',
            border: 0,
            borderRadius: 10,
            cursor: logout.isPending ? 'wait' : 'pointer',
            color: '#A02B16',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: 14,
            textAlign: 'left',
            transition: 'background 0.12s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(214, 67, 43, 0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={16} />
          {logout.isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  )
}

function MenuLink({
  to,
  onClick,
  icon,
  children,
}: {
  to: string
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      role="menuitem"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 10,
        textDecoration: 'none',
        color: '#1A1A1A',
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        fontSize: 14,
        transition: 'background 0.12s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#F4F2EE')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ color: '#6A1CF6', display: 'inline-flex' }}>{icon}</span>
      <span style={{ flex: 1 }}>{children}</span>
      <ChevronRight size={14} color="#6B7280" />
    </Link>
  )
}
