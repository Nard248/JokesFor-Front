import { useState } from 'react'
import type { AxiosError } from 'axios'
import { Link, useNavigate } from 'react-router'
import { User, Bell, Shield, Palette, AlertTriangle, LogOut, CreditCard, UserX, Download, KeyRound } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { PublicIdentityEditor } from '@/components/PublicIdentityEditor'
import { BlockedUsersList } from '@/components/BlockedUsersList'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { useAuth, useLogout, usePasswordChange, useDeleteAccount, useDataExport } from '@/features/auth'
import { usePreferences, useUpdatePreferences } from '@/features/preferences'

/** Flatten a DRF field-error body ({ field: ["msg"] } or { detail: "msg" }) to one message. */
function firstApiError(err: unknown, fallback: string): string {
  const data = (err as AxiosError)?.response?.data as Record<string, unknown> | string | undefined
  if (typeof data === 'string') return data || fallback
  if (data && typeof data === 'object') {
    if (typeof data.detail === 'string') return data.detail
    for (const value of Object.values(data)) {
      if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
      if (typeof value === 'string') return value
    }
  }
  return fallback
}

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
  const { toast } = useToast()
  const { isMobile } = useBreakpoint()
  const { user } = useAuth()
  const { data: prefs } = usePreferences()
  const updatePrefs = useUpdatePreferences()
  const logout = useLogout()
  const passwordChange = usePasswordChange()
  const deleteAccount = useDeleteAccount()
  const dataExport = useDataExport()

  const [theme, setTheme] = useState(prefs?.theme ?? 'light')

  // Change-password modal
  const [pwOpen, setPwOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword1, setNewPassword1] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [pwError, setPwError] = useState<string | null>(null)

  // Delete-account modal
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const resetPwForm = () => {
    setOldPassword('')
    setNewPassword1('')
    setNewPassword2('')
    setPwError(null)
  }

  const submitPasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)
    if (!oldPassword || !newPassword1 || !newPassword2) {
      setPwError('All fields are required.')
      return
    }
    if (newPassword1 !== newPassword2) {
      setPwError('New passwords do not match.')
      return
    }
    if (newPassword1.length < 8) {
      setPwError('New password must be at least 8 characters.')
      return
    }
    passwordChange.mutate(
      { old_password: oldPassword, new_password1: newPassword1, new_password2: newPassword2 },
      {
        onSuccess: () => {
          toast({ message: 'Password changed.', variant: 'success' })
          setPwOpen(false)
          resetPwForm()
        },
        onError: (err) => setPwError(firstApiError(err, 'Could not change password.')),
      },
    )
  }

  const submitDeleteAccount = () => {
    if (confirmText !== 'DELETE') return
    setDeleteError(null)
    // Send both re-auth signals — the backend uses whichever its branch needs
    // (password for usable-password accounts, confirm=DELETE for OAuth ones).
    const payload: { confirm: string; password?: string } = { confirm: 'DELETE' }
    if (deletePassword) payload.password = deletePassword
    deleteAccount.mutate(payload, {
      onSuccess: () => {
        // Auth state was cleared by the hook; drop to a logged-out page.
        setDeleteOpen(false)
        navigate('/login', { replace: true })
      },
      onError: (err) => setDeleteError(firstApiError(err, 'Could not delete account.')),
    })
  }

  const handleExport = () => {
    dataExport.mutate(undefined, {
      onSuccess: () => toast({ message: 'Your data export is downloading.', variant: 'success' }),
      onError: () => toast({ message: 'Could not export your data. Please try again.', variant: 'error' }),
    })
  }

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

  // Tap-target height: ≥44px on mobile (RESPONSIVE.md rule 3), the 40px
  // ghost/secondary height on larger screens.
  const btnH = isMobile ? 44 : 40
  const modalInputStyle: React.CSSProperties = { ...baseModalInputStyle, height: isMobile ? 44 : 40 }

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell active="library">
        {/* Horizontal padding comes from the shell's fluid container; only vertical
            padding here (RESPONSIVE.md rule 2). Cap stays narrower than the shell. */}
        <div style={{ padding: '40px 0', maxWidth: 880, margin: '0 auto' }}>
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
              <Link to="/profile" className="btn-flow-primary" style={{ height: btnH, fontSize: 13, textDecoration: 'none' }}>
                Edit profile
              </Link>
              <button
                type="button"
                className="btn-flow-ghost"
                style={{ height: btnH, fontSize: 13 }}
                onClick={() => {
                  resetPwForm()
                  setPwOpen(true)
                }}
              >
                Change password
              </button>
            </div>
          </SettingsSection>

          {/* Public identity */}
          <SettingsSection icon={<User size={18} />} title="Public identity" subtitle="Your creator handle and display name.">
            <PublicIdentityEditor />
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
                style={{ height: btnH, fontSize: 13, textDecoration: 'none' }}
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

          {/* Your data (GDPR) */}
          <SettingsSection icon={<Download size={18} />} title="Your data" subtitle="Download everything we hold about you.">
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
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>Export my data</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  A ZIP of your account, saves, collections, and activity as JSON.
                </div>
              </div>
              <button
                type="button"
                onClick={handleExport}
                disabled={dataExport.isPending}
                className="btn-flow-ghost"
                style={{ height: btnH, fontSize: 13 }}
              >
                <Download size={14} /> {dataExport.isPending ? 'Preparing…' : 'Export my data'}
              </button>
            </div>
          </SettingsSection>

          {/* Blocked users */}
          <SettingsSection icon={<UserX size={18} />} title="Blocked users" subtitle="People you've blocked can't appear in your feed or see your profile.">
            <BlockedUsersList />
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
                style={{ height: btnH, fontSize: 13 }}
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
                onClick={() => {
                  setConfirmText('')
                  setDeletePassword('')
                  setDeleteError(null)
                  setDeleteOpen(true)
                }}
                style={{
                  height: btnH,
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

      {/* Change-password modal */}
      <Modal
        open={pwOpen}
        onClose={() => {
          setPwOpen(false)
          resetPwForm()
        }}
        title="Change password"
        footer={
          <>
            <button
              type="button"
              className="btn-flow-ghost"
              style={{ height: btnH, fontSize: 13 }}
              onClick={() => {
                setPwOpen(false)
                resetPwForm()
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="change-password-form"
              className="btn-flow-primary"
              style={{ height: btnH, fontSize: 13 }}
              disabled={passwordChange.isPending}
            >
              <KeyRound size={14} /> {passwordChange.isPending ? 'Saving…' : 'Save password'}
            </button>
          </>
        }
      >
        <form id="change-password-form" onSubmit={submitPasswordChange} style={{ display: 'grid', gap: 12 }}>
          <ModalField label="Current password">
            <input
              type="password"
              autoComplete="current-password"
              aria-label="Current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              style={modalInputStyle}
            />
          </ModalField>
          <ModalField label="New password">
            <input
              type="password"
              autoComplete="new-password"
              aria-label="New password"
              value={newPassword1}
              onChange={(e) => setNewPassword1(e.target.value)}
              style={modalInputStyle}
            />
          </ModalField>
          <ModalField label="Confirm new password">
            <input
              type="password"
              autoComplete="new-password"
              aria-label="Confirm new password"
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              style={modalInputStyle}
            />
          </ModalField>
          {pwError && (
            <div role="alert" style={{ fontSize: 13, color: '#A02B16' }}>
              {pwError}
            </div>
          )}
        </form>
      </Modal>

      {/* Delete-account modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete account"
        footer={
          <>
            <button
              type="button"
              className="btn-flow-ghost"
              style={{ height: btnH, fontSize: 13 }}
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitDeleteAccount}
              disabled={confirmText !== 'DELETE' || deleteAccount.isPending}
              style={{
                height: btnH,
                padding: '0 16px',
                background: confirmText === 'DELETE' && !deleteAccount.isPending ? '#A02B16' : '#E5B8AE',
                color: '#fff',
                border: 0,
                borderRadius: 9999,
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: 13,
                cursor: confirmText === 'DELETE' && !deleteAccount.isPending ? 'pointer' : 'not-allowed',
              }}
            >
              {deleteAccount.isPending ? 'Deleting…' : 'Delete forever'}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: '#52525B', marginBottom: 14 }}>
          This permanently removes your account, saves, drafts, and history. This{' '}
          <strong style={{ color: '#A02B16' }}>cannot be undone</strong>.
        </p>
        <ModalField label={'Type DELETE to confirm'}>
          <input
            type="text"
            aria-label="Type DELETE to confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            autoComplete="off"
            style={modalInputStyle}
          />
        </ModalField>
        <div style={{ marginTop: 12 }}>
          <ModalField label="Current password (if you sign in with a password)">
            <input
              type="password"
              autoComplete="current-password"
              aria-label="Current password for account deletion"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              style={modalInputStyle}
            />
          </ModalField>
        </div>
        {deleteError && (
          <div role="alert" style={{ marginTop: 12, fontSize: 13, color: '#A02B16' }}>
            {deleteError}
          </div>
        )}
      </Modal>
    </div>
  )
}

const baseModalInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0 14px',
  borderRadius: 12,
  border: '1px solid #E9E8E7',
  background: '#fff',
  color: '#1A1A1A',
  fontSize: 14,
  fontFamily: 'var(--font-sans)',
  outline: 'none',
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          display: 'block',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#52525B',
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      {children}
    </label>
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
