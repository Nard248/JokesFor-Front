import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router'
import { ArrowRight, Loader2, Flame } from 'lucide-react'
import type { AxiosError } from 'axios'
import { useLogin } from '@/features/auth'
import { getGoogleAuthUrl, clearSignupDob } from '@/features/auth/google-oauth'

/**
 * LoginPage — split-canvas redesign per
 * Docs/JokesFor/parts/flow-screens.jsx::LoginScreen.
 *
 * Left: gradient brand panel with "today's joke" preview card embedded.
 * Right: sign-in form with streak-keeper nudge below.
 *
 * On success: navigate to returnTo (if set) OR /flow-canvas (the new
 * post-auth default).
 */

interface ApiError {
  non_field_errors?: string[]
  email?: string[]
  password?: string[]
  detail?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/flow-canvas'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loginMutation = useLogin()

  const handleGoogleSignIn = () => {
    setError(null)
    // Login path sends NO date_of_birth. Clear any DOB a prior signup attempt
    // may have stashed so it can't leak onto this sign-in.
    clearSignupDob()
    try {
      window.location.href = getGoogleAuthUrl(returnTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in unavailable.')
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => navigate(returnTo, { replace: true }),
        onError: (err) => {
          const axiosError = err as AxiosError<ApiError>
          const data = axiosError.response?.data
          if (data?.non_field_errors) setError(data.non_field_errors[0])
          else if (data?.email) setError(`Email: ${data.email[0]}`)
          else if (data?.password) setError(`Password: ${data.password[0]}`)
          else if (data?.detail) setError(data.detail)
          else setError('Unable to login. Please check your credentials.')
        },
      },
    )
  }

  return (
    <div
      className="page-enter"
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.05fr)',
        background: '#FBFAF7',
      }}
    >
      {/* ── Left: brand canvas ───────────────────────────────── */}
      <BrandPanel />

      {/* ── Right: sign-in form ──────────────────────────────── */}
      <div
        style={{
          padding: 'clamp(48px, 6vw, 72px) clamp(32px, 6vw, 88px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <span className="eyebrow-mono">Welcome back</span>
        <h2
          style={{
            marginTop: 8,
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            letterSpacing: '-0.02em',
            color: '#1A1A1A',
            lineHeight: 1.05,
          }}
        >
          Sign in.
        </h2>
        <p style={{ marginTop: 8, fontSize: 18, color: '#52525B' }}>
          Pick up your streak right where you left off.
        </p>

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 24,
              padding: 14,
              borderRadius: 12,
              background: 'rgba(214, 67, 43, 0.08)',
              border: '1px solid rgba(214, 67, 43, 0.2)',
              color: '#A02B16',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loginMutation.isPending}
            style={{
              height: 52,
              borderRadius: 9999,
              border: '1px solid #E9E8E7',
              background: '#fff',
              color: '#1A1A1A',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              color: '#6B7280',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.22em',
            }}
          >
            <div style={{ flex: 1, height: 1, background: '#E9E8E7' }} />
            OR
            <div style={{ flex: 1, height: 1, background: '#E9E8E7' }} />
          </div>

          <FormField label="Email">
            <FlowInput value={email} onChange={setEmail} placeholder="you@studio.com" type="email" autoComplete="email" autoFocus />
          </FormField>

          <FormField
            label="Password"
            extra={
              <Link
                to="#"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: '#6A1CF6',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                Forgot
              </Link>
            }
          >
            <FlowInput value={password} onChange={setPassword} placeholder="•••••••••" type="password" autoComplete="current-password" />
          </FormField>

          <button
            type="submit"
            className="btn-flow-primary"
            style={{ height: 52, marginTop: 8 }}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 size={16} className="login-spin" /> Signing in…
              </>
            ) : (
              <>
                Sign in <ArrowRight size={16} />
              </>
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#52525B', margin: '4px 0 0' }}>
            New here?{' '}
            <Link to="/register" style={{ color: '#6A1CF6', fontWeight: 700, textDecoration: 'none' }}>
              Create an account →
            </Link>
          </p>
        </form>

        {/* Streak nudge */}
        <div
          style={{
            marginTop: 48,
            padding: 18,
            background: '#FBFAF7',
            border: '1px solid #E9E8E7',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#CAFD00',
              color: '#3A4A00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Flame size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14 }}>
              Keep your streak alive.
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              Sign in to pick up where you left off.
            </div>
          </div>
        </div>
      </div>

      <LoginStyles />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Left brand panel
// ──────────────────────────────────────────────────────────────────────────

function BrandPanel() {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #5D00E4 0%, #6A1CF6 60%, #7B30FF 100%)',
        color: '#fff',
        padding: 'clamp(36px, 5vw, 56px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(202, 253, 0, 0.18), transparent 50%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="/Logos/appicon_white.svg" alt="" style={{ width: 44, height: 44, borderRadius: 11 }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.01em' }}>
          JokesFor
        </span>
      </div>
      <div style={{ position: 'relative' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          Today's joke · Volume I
        </span>
        <h1
          style={{
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 'clamp(3rem, 6vw, 4.5rem)',
            marginTop: 18,
            lineHeight: 0.98,
            letterSpacing: '-0.02em',
          }}
        >
          Find the right joke.{' '}
          <em className="wink" style={{ color: '#CAFD00' }}>
            For any moment.
          </em>
        </h1>

        {/* Embedded JOTD preview */}
        <div
          style={{
            marginTop: 36,
            padding: 24,
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: 18,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            maxWidth: 480,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(202, 253, 0, 0.9)',
            }}
          >
            Setup
          </span>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 20,
              marginTop: 6,
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            Why don't scientists trust atoms anymore?
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(202, 253, 0, 0.9)',
              marginTop: 18,
              display: 'block',
            }}
          >
            Punchline
          </span>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: 'clamp(1.75rem, 3vw, 2rem)',
              marginTop: 6,
              color: '#fff',
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
            }}
          >
            Because they make up{' '}
            <em className="wink" style={{ color: '#CAFD00' }}>
              everything.
            </em>
          </div>
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          gap: 24,
          fontSize: 12,
          color: 'rgba(255, 255, 255, 0.6)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          flexWrap: 'wrap',
        }}
      >
        <span>Six formats</span>
        <span>·</span>
        <span>A joke every morning</span>
        <span>·</span>
        <span>Updated 9:00 AM</span>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Atoms (kept local to avoid coupling Login/Register)
// ──────────────────────────────────────────────────────────────────────────

function FormField({
  label,
  extra,
  children,
}: {
  label: string
  extra?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 13,
            color: '#1A1A1A',
            display: 'block',
            marginBottom: 8,
          }}
        >
          {label}
        </label>
        {extra}
      </div>
      {children}
    </div>
  )
}

interface FlowInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  autoComplete?: string
  autoFocus?: boolean
}

function FlowInput({ value, onChange, placeholder, type = 'text', autoComplete, autoFocus }: FlowInputProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      className="flow-input"
    />
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function LoginStyles() {
  return (
    <style>{`
      .flow-input {
        height: 48px; width: 100%;
        padding: 0 16px; border-radius: 12px;
        border: 1px solid #E9E8E7; background: #fff;
        font-family: var(--font-sans); font-size: 15px; color: #1A1A1A;
        outline: none; transition: box-shadow 0.12s ease, border-color 0.12s ease;
      }
      .flow-input:focus { border-color: #6A1CF6; box-shadow: 0 0 0 4px #F2E9FF; }
      .btn-flow-primary {
        height: 48px; padding: 0 24px; border: 0; border-radius: 9999px;
        font-family: var(--font-sans); font-weight: 700; font-size: 15px;
        background: #6A1CF6; color: #fff; cursor: pointer;
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        transition: background 0.12s ease, transform 0.12s ease;
      }
      .btn-flow-primary:hover { background: #5D00E4; }
      .btn-flow-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      .login-spin { animation: login-spin 1s linear infinite; }
      @keyframes login-spin { to { transform: rotate(360deg); } }
    `}</style>
  )
}
