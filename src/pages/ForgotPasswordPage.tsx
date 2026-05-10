import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ArrowRight, Mail, Check, ArrowLeft } from 'lucide-react'
import type { AxiosError } from 'axios'
import { usePasswordReset, usePasswordResetConfirm } from '@/features/auth'

interface ApiError {
  detail?: string
  email?: string[]
  new_password1?: string[]
  new_password2?: string[]
  uid?: string[]
  token?: string[]
  non_field_errors?: string[]
}

/**
 * ForgotPasswordPage / ResetPasswordPage — single component, two views.
 *
 * Mounted at:
 *   /forgot-password         → Step 1: enter email, get reset link
 *   /reset-password?uid=…&token=…  → Step 2: enter new password, confirm
 *
 * Routes resolve which mode based on URL — no router state machine needed.
 */
export function ForgotPasswordPage() {
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid')
  const token = searchParams.get('token')

  const isStep2 = !!(uid && token)

  return (
    <div
      className="page-enter"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #F2E9FF 0%, #FBFAF7 60%, #FBFAF7 100%)',
        padding: '40px 24px',
      }}
    >
      <div style={{ maxWidth: 480, width: '100%' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#1A1A1A', marginBottom: 32 }}>
          <img src="/Logos/appicon_purple.svg" alt="" style={{ width: 36, height: 36, borderRadius: 9 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.01em' }}>
            JokesFor
          </span>
        </Link>

        {isStep2 ? <ResetPasswordForm uid={uid} token={token} /> : <RequestResetForm />}

        <FormStyles />
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Step 1 — Request reset link
// ──────────────────────────────────────────────────────────────────────────

function RequestResetForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const reset = usePasswordReset()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    reset.mutate(
      { email },
      {
        onSuccess: () => setSent(true),
        onError: (err) => {
          const data = (err as AxiosError<ApiError>).response?.data
          setError(data?.email?.[0] ?? data?.detail ?? 'Could not send the reset email. Try again?')
        },
      },
    )
  }

  if (sent) {
    return (
      <div
        style={{
          padding: 'clamp(28px, 5vw, 40px)',
          background: '#fff',
          border: '1px solid #E9E8E7',
          borderRadius: 24,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: '#CAFD00',
            color: '#3A4A00',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
          }}
        >
          <Check size={24} strokeWidth={3} />
        </div>
        <h1
          style={{
            marginTop: 18,
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: '-0.02em',
            color: '#1A1A1A',
          }}
        >
          Check your <em className="wink">email.</em>
        </h1>
        <p style={{ marginTop: 10, fontSize: 15, color: '#52525B', lineHeight: 1.5 }}>
          We sent a reset link to <strong>{email}</strong>. The link expires in 24 hours.
        </p>
        <p style={{ marginTop: 16, fontSize: 13, color: '#6B7280' }}>
          Don't see it? Check spam or{' '}
          <button
            type="button"
            onClick={() => setSent(false)}
            style={{ background: 'none', border: 'none', color: '#6A1CF6', fontWeight: 700, cursor: 'pointer' }}
          >
            try a different email
          </button>
          .
        </p>
        <Link
          to="/login"
          className="btn-flow-ghost"
          style={{ display: 'inline-flex', marginTop: 24, height: 42, fontSize: 13, textDecoration: 'none' }}
        >
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: 'clamp(28px, 5vw, 40px)',
        background: '#fff',
        border: '1px solid #E9E8E7',
        borderRadius: 24,
      }}
    >
      <span className="eyebrow-mono">Forgot password</span>
      <h1
        style={{
          marginTop: 8,
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 32,
          letterSpacing: '-0.02em',
          color: '#1A1A1A',
        }}
      >
        Reset it.
      </h1>
      <p style={{ marginTop: 6, fontSize: 15, color: '#52525B' }}>
        Enter your email and we'll send a reset link.
      </p>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 12,
            background: 'rgba(214, 67, 43, 0.08)',
            border: '1px solid rgba(214, 67, 43, 0.2)',
            color: '#A02B16',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
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
            Email
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} color="#52525B" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
              autoFocus
              autoComplete="email"
              className="forgot-input"
              style={{ paddingLeft: 42 }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={reset.isPending}
          className="btn-flow-primary"
          style={{ height: 48, marginTop: 8 }}
        >
          {reset.isPending ? 'Sending…' : 'Send reset link'}
          {!reset.isPending && <ArrowRight size={16} />}
        </button>

        <Link
          to="/login"
          style={{
            textAlign: 'center',
            fontSize: 14,
            color: '#52525B',
            textDecoration: 'none',
            marginTop: 4,
          }}
        >
          <ArrowLeft size={12} style={{ display: 'inline', marginRight: 4 }} /> Back to sign in
        </Link>
      </form>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Step 2 — Set new password (uid + token from email link)
// ──────────────────────────────────────────────────────────────────────────

function ResetPasswordForm({ uid, token }: { uid: string; token: string }) {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const confirmReset = usePasswordResetConfirm()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }

    confirmReset.mutate(
      { uid, token, new_password1: password, new_password2: confirm },
      {
        onSuccess: () => setDone(true),
        onError: (err) => {
          const data = (err as AxiosError<ApiError>).response?.data
          setError(
            data?.new_password1?.[0] ??
              data?.token?.[0] ??
              data?.uid?.[0] ??
              data?.non_field_errors?.[0] ??
              data?.detail ??
              'Could not reset. The link may have expired — request a new one.',
          )
        },
      },
    )
  }

  if (done) {
    return (
      <div
        style={{
          padding: 'clamp(28px, 5vw, 40px)',
          background: '#fff',
          border: '1px solid #E9E8E7',
          borderRadius: 24,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: '#CAFD00',
            color: '#3A4A00',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
          }}
        >
          <Check size={24} strokeWidth={3} />
        </div>
        <h1
          style={{
            marginTop: 18,
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: '-0.02em',
            color: '#1A1A1A',
          }}
        >
          Password <em className="wink">reset.</em>
        </h1>
        <p style={{ marginTop: 10, fontSize: 15, color: '#52525B' }}>You can sign in with the new one.</p>
        <button
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          className="btn-flow-primary"
          style={{ height: 42, marginTop: 24, fontSize: 13 }}
        >
          Sign in <ArrowRight size={14} />
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: 'clamp(28px, 5vw, 40px)',
        background: '#fff',
        border: '1px solid #E9E8E7',
        borderRadius: 24,
      }}
    >
      <span className="eyebrow-mono">Reset password</span>
      <h1
        style={{
          marginTop: 8,
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 32,
          letterSpacing: '-0.02em',
          color: '#1A1A1A',
        }}
      >
        Pick a <em className="wink">new one.</em>
      </h1>
      <p style={{ marginTop: 6, fontSize: 15, color: '#52525B' }}>At least 8 characters. Strong is better.</p>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 12,
            background: 'rgba(214, 67, 43, 0.08)',
            border: '1px solid rgba(214, 67, 43, 0.2)',
            color: '#A02B16',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="forgot-label">New password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoFocus
            autoComplete="new-password"
            className="forgot-input"
          />
        </div>

        <div>
          <label className="forgot-label">Confirm password</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type it again"
            autoComplete="new-password"
            className="forgot-input"
          />
        </div>

        <button
          type="submit"
          disabled={confirmReset.isPending}
          className="btn-flow-primary"
          style={{ height: 48, marginTop: 8 }}
        >
          {confirmReset.isPending ? 'Saving…' : 'Save new password'}
          {!confirmReset.isPending && <ArrowRight size={16} />}
        </button>
      </form>
    </div>
  )
}

function FormStyles() {
  return (
    <style>{`
      .forgot-label {
        font-family: var(--font-display); font-weight: 700; font-size: 13px;
        color: #1A1A1A; display: block; margin-bottom: 8px;
      }
      .forgot-input {
        height: 48px; width: 100%;
        padding: 0 16px; border-radius: 12px;
        border: 1px solid #E9E8E7; background: #fff;
        font-family: var(--font-sans); font-size: 15px; color: #1A1A1A;
        outline: none; transition: box-shadow 0.12s ease, border-color 0.12s ease;
      }
      .forgot-input:focus { border-color: #6A1CF6; box-shadow: 0 0 0 4px #F2E9FF; }
      .btn-flow-primary {
        height: 48px; padding: 0 24px; border: 0; border-radius: 9999px;
        font-family: var(--font-sans); font-weight: 700; font-size: 15px;
        background: #6A1CF6; color: #fff; cursor: pointer;
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        transition: background 0.12s ease;
      }
      .btn-flow-primary:hover { background: #5D00E4; }
      .btn-flow-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      .btn-flow-ghost {
        height: 40px; padding: 0 16px; border: 1px solid #E9E8E7; border-radius: 9999px;
        font-family: var(--font-sans); font-weight: 600; font-size: 13px;
        background: transparent; color: #1A1A1A; cursor: pointer;
        display: inline-flex; align-items: center; gap: 6px;
      }
    `}</style>
  )
}
