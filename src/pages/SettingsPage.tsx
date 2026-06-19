import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { User, Bell, Shield, Palette, AlertTriangle, LogOut, CreditCard } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { useAuth, useLogout } from '@/features/auth'
import { usePreferences, useUpdatePreferences } from '@/features/preferences'

/**
 * SettingsPage — redesigned for iteration 4.
 *
 * Sections (each in its own card):
 *   1. Account (read-only display from useAuth)
 *   2. Notifications (toggle switches)
 *   3. Privacy (toggle switches)
 *   4. Appearance (theme picker)
 *   5. Danger zone (logout, delete account)
 */
export function SettingsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: prefs } = usePreferences()
  const updatePrefs = useUpdatePreferences()
  const logout = useLogout()

  const [theme, setTheme] = useState(prefs?.theme ?? 'light')

  const updateNotifications = (key: 'dailyJoke' | 'trendingAlerts' | 'collectionUpdates' | 'emailDigest', value: boolean) => {
    if (!prefs) return
    updatePrefs.mutate({
      notifications: { ...prefs.notifications, [key]: value },
    })
  }

  const updatePrivacy = (key: 'publicProfile' | 'showActivity' | 'shareAnalytics', value: boolean) => {
    if (!prefs) return
    updatePrefs.mutate({
      privacy: { ...prefs.privacy, [key]: value },
    })
  }

  const updateTheme = (next: 'light' | 'dark' | 'system') => {
    setTheme(next)
    updatePrefs.mutate({ theme: next })
  }

  const handleLogout = () => {
    logout.mutate()
    navigate('/', { replace: true })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell active="library">
        <div style={{ padding: '40px clamp(24px, 4vw, 56px)', maxWidth: 880, margin: '0 auto' }}>
          {/* Hero */}
          <div>
            <span className="eyebrow-mono">Settings</span>
            <h2
              style={{
                marginTop: 8,
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
                letterSpacing: '-0.02em',
                color: '#1A1A1A',
                lineHeight: 1.05,
              }}
            >
              Make it <em className="wink">yours.</em>
            </h2>
            <p style={{ marginTop: 6, fontSize: 18, color: '#52525B' }}>
              Account, notifications, privacy. Set once, change anytime.
            </p>
          </div>

          {/* Account */}
          <SettingsSection icon={<User size={18} />} title="Account" subtitle="Identity and login.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <Field label="Email" value={user?.email ?? '—'} />
              <Field label="Username" value={user?.username ?? '—'} />
              <Field label="Display name" value={`${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || '—'} />
            </div>
            <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link to="/profile" className="btn-flow-primary" style={{ height: 40, fontSize: 13, textDecoration: 'none' }}>
                Edit profile
              </Link>
              <button type="button" className="btn-flow-ghost" style={{ height: 40, fontSize: 13 }}>
                Change password
              </button>
            </div>
          </SettingsSection>

          {/* Billing */}
          <SettingsSection icon={<CreditCard size={18} />} title="Billing &amp; Plans" subtitle="Manage your subscription and entitlements.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>Subscription</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  View plans, upgrade, or manage your billing.
                </div>
              </div>
              <Link
                to="/settings/billing"
                className="btn-flow-primary"
                style={{ height: 40, fontSize: 13, textDecoration: 'none' }}
              >
                Manage billing
              </Link>
            </div>
          </SettingsSection>

          {/* Notifications */}
          <SettingsSection icon={<Bell size={18} />} title="Notifications" subtitle="What and when we ping you.">
            <Toggle
              label="Daily joke"
              description="One push per day at your chosen ritual time."
              checked={prefs?.notifications?.dailyJoke ?? true}
              onChange={(v) => updateNotifications('dailyJoke', v)}
            />
            <Toggle
              label="Trending alerts"
              description="When something blows up in the community."
              checked={prefs?.notifications?.trendingAlerts ?? false}
              onChange={(v) => updateNotifications('trendingAlerts', v)}
            />
            <Toggle
              label="Collection updates"
              description="When jokes you saved get shared by others."
              checked={prefs?.notifications?.collectionUpdates ?? true}
              onChange={(v) => updateNotifications('collectionUpdates', v)}
            />
            <Toggle
              label="Email digest"
              description="Weekly recap of the best of the week."
              checked={prefs?.notifications?.emailDigest ?? false}
              onChange={(v) => updateNotifications('emailDigest', v)}
            />
          </SettingsSection>

          {/* Privacy */}
          <SettingsSection icon={<Shield size={18} />} title="Privacy" subtitle="What others can see.">
            <Toggle
              label="Public profile"
              description="Let anyone view your profile and saves."
              checked={prefs?.privacy?.publicProfile ?? true}
              onChange={(v) => updatePrivacy('publicProfile', v)}
            />
            <Toggle
              label="Show activity"
              description="Surface your recent activity on your profile."
              checked={prefs?.privacy?.showActivity ?? true}
              onChange={(v) => updatePrivacy('showActivity', v)}
            />
            <Toggle
              label="Share analytics"
              description="Help us improve recommendations with anonymous usage data."
              checked={prefs?.privacy?.shareAnalytics ?? false}
              onChange={(v) => updatePrivacy('shareAnalytics', v)}
            />
          </SettingsSection>

          {/* Appearance */}
          <SettingsSection icon={<Palette size={18} />} title="Appearance" subtitle="Light, dark, or whatever your system says.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {(['light', 'dark', 'system'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateTheme(option)}
                  aria-pressed={theme === option}
                  style={{
                    padding: '16px 12px',
                    borderRadius: 14,
                    border: `1px solid ${theme === option ? '#6A1CF6' : '#E9E8E7'}`,
                    background: theme === option ? '#F2E9FF' : '#fff',
                    color: '#1A1A1A',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </SettingsSection>

          {/* Danger zone */}
          <SettingsSection icon={<AlertTriangle size={18} />} title="Danger zone" subtitle="Irreversible actions." accent="danger">
            <div
              style={{
                padding: 18,
                background: '#FBFAF7',
                border: '1px solid #E9E8E7',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>Sign out everywhere</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Ends your session on this device.</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={logout.isPending}
                className="btn-flow-ghost"
                style={{ height: 40, fontSize: 13 }}
              >
                <LogOut size={14} /> {logout.isPending ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
            <div
              style={{
                marginTop: 12,
                padding: 18,
                background: 'rgba(214, 67, 43, 0.08)',
                border: '1px solid rgba(214, 67, 43, 0.2)',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#A02B16' }}>
                  Delete account
                </div>
                <div style={{ fontSize: 12, color: '#A02B16', opacity: 0.85, marginTop: 2 }}>
                  Permanently removes your account, saves, drafts, and history.
                </div>
              </div>
              <button
                type="button"
                style={{
                  height: 40,
                  padding: '0 16px',
                  background: 'transparent',
                  color: '#A02B16',
                  border: '1px solid #A02B16',
                  borderRadius: 9999,
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Delete my account
              </button>
            </div>
          </SettingsSection>
        </div>
      </FlowAppShell>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Section wrapper
// ──────────────────────────────────────────────────────────────────────────

function SettingsSection({
  icon,
  title,
  subtitle,
  accent,
  children,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  accent?: 'danger'
  children: React.ReactNode
}) {
  const headerColor = accent === 'danger' ? '#A02B16' : '#1A1A1A'
  return (
    <section
      style={{
        marginTop: 32,
        padding: 'clamp(24px, 3vw, 32px)',
        background: '#fff',
        border: '1px solid #E9E8E7',
        borderRadius: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: accent === 'danger' ? 'rgba(214, 67, 43, 0.12)' : '#F2E9FF',
            color: accent === 'danger' ? '#A02B16' : '#6A1CF6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 22,
              color: headerColor,
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}
          >
            {title}
          </h3>
          <p style={{ marginTop: 2, fontSize: 13, color: '#6B7280' }}>{subtitle}</p>
        </div>
      </div>
      <div>{children}</div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Field (read-only)
// ──────────────────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="eyebrow-mono">{label}</div>
      <div style={{ marginTop: 6, fontSize: 15, color: '#1A1A1A', fontFamily: 'var(--font-sans)' }}>{value}</div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Toggle switch
// ──────────────────────────────────────────────────────────────────────────

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 0',
        borderBottom: '1px solid #F1EFEC',
        cursor: 'pointer',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>{label}</div>
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{description}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: checked ? '#6A1CF6' : '#E9E8E7',
          position: 'relative',
          transition: 'background 0.2s ease',
          flexShrink: 0,
          border: 0,
          cursor: 'pointer',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: 10,
            background: '#fff',
            transition: 'left 0.2s ease',
          }}
        />
      </button>
    </label>
  )
}
