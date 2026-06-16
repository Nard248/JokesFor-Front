import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router'
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react'
import type { AxiosError } from 'axios'
import { useRegister, useUpdateUser } from '@/features/auth'
import { getGoogleAuthUrl } from '@/features/auth/google-oauth'

/**
 * RegisterPage — 2-step create-account, redesigned per
 * Docs/JokesFor/parts/flow-screens.jsx::RegisterScreen.
 *
 * Step 1 (functional):  first name, handle, email, password.
 * Step 2 (mostly cosmetic): pronouns, "where you'll tell jokes", daily-joke
 *   checkbox. The backend's /auth/registration/ accepts only email +
 *   password; first_name and username (handle) are saved via PATCH /auth/user/
 *   on success. Pronouns and venue have no backend fields yet — clear TODO
 *   below for when the schema grows.
 *
 * Right pane: Hooked-loop infographic (Trigger / Action / Variable Reward /
 * Investment) — encoded brand psychology.
 *
 * On finish: register → patch user → navigate /flow (onboarding).
 */

interface RegistrationApiError {
  non_field_errors?: string[]
  email?: string[]
  password1?: string[]
  password2?: string[]
  date_of_birth?: string[]
  detail?: string
}

const PRONOUN_OPTIONS = [
  { id: 'he/him', label: 'he/him' },
  { id: 'she/her', label: 'she/her' },
  { id: 'they/them', label: 'they/them' },
] as const

const VENUE_OPTIONS = [
  { id: 'office', icon: '💼', label: 'Office / Slack' },
  { id: 'irl', icon: '🍻', label: 'Friends / IRL' },
  { id: 'group_chat', icon: '📲', label: 'Group chats' },
  { id: 'stage', icon: '🎤', label: 'On stage' },
] as const

type PronounId = typeof PRONOUN_OPTIONS[number]['id']
type VenueId = typeof VENUE_OPTIONS[number]['id']

export function RegisterPage() {
  const navigate = useNavigate()
  const registerMutation = useRegister()
  const updateUser = useUpdateUser()

  // Step 1 fields
  const [firstName, setFirstName] = useState('')
  const [handle, setHandle] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [dob, setDob] = useState('')
  const [dobError, setDobError] = useState<string | null>(null)

  // Step 2 fields (cosmetic in iteration 2)
  const [pronouns, setPronouns] = useState<PronounId | null>(null)
  const [venue, setVenue] = useState<VenueId | null>(null)
  const [dailyJoke, setDailyJoke] = useState(true)

  const [step, setStep] = useState<1 | 2>(1)
  const [error, setError] = useState<string | null>(null)

  const validateStep1 = (): string | null => {
    if (!firstName.trim()) return 'First name is required'
    if (!email.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address'
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (!dob) return 'Date of birth is required'
    return null
  }

  const handleNextFromStep1 = (e: FormEvent) => {
    e.preventDefault()
    const validationError = validateStep1()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setStep(2)
  }

  const handleGoogleSignUp = () => {
    setError(null)
    try {
      window.location.href = getGoogleAuthUrl('/flow')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in unavailable.')
    }
  }

  const handleFinish = () => {
    setError(null)
    setDobError(null)
    registerMutation.mutate(
      { email, password1: password, password2: password, date_of_birth: dob },
      {
        onSuccess: (data) => {
          // Profile fields from step 2 — applied via updateUser once a session
          // exists (updateUser needs auth). Computed up front so both modes use them.
          const cleanHandle = handle.replace(/^@/, '').trim()
          const trimmedFirst = firstName.trim()

          // Gated mode (EMAIL_VERIFICATION_REQUIRED on): no session yet — the
          // backend sent a code. Route to verification carrying the email (in the
          // query, refresh-safe) plus the profile fields (nav state, best-effort)
          // so they're applied after the code is confirmed — not silently dropped.
          // While the flag is off this branch never fires (tokens are returned).
          if (!('access' in data)) {
            navigate(`/verify-email?email=${encodeURIComponent(data.email)}`, {
              replace: true,
              state: { firstName: trimmedFirst, handle: cleanHandle },
            })
            return
          }
          // Legacy mode (logged in): patch the username (handle without @) + first name.
          // If this fails, we still navigate forward — user can fix in profile.
          const patch: { first_name?: string; username?: string } = {}
          if (trimmedFirst) patch.first_name = trimmedFirst
          if (cleanHandle) patch.username = cleanHandle
          if (Object.keys(patch).length > 0) {
            updateUser.mutate(patch, {
              onSettled: () => navigate('/flow', { replace: true }),
            })
          } else {
            navigate('/flow', { replace: true })
          }
        },
        onError: (err) => {
          const axiosError = err as AxiosError<RegistrationApiError>
          const data = axiosError.response?.data
          // 502: the account was created but the verification email failed to
          // send. It's recoverable via Resend — route to the code screen with a
          // send-failed hint (the registered email is the form's `email`).
          if (axiosError.response?.status === 502) {
            navigate(`/verify-email?email=${encodeURIComponent(email)}&sendFailed=1`, { replace: true })
            return
          }
          if (data?.date_of_birth) {
            setDobError(data.date_of_birth[0])
            setStep(1)
            return // do NOT navigate; the under-13 block stops here
          }
          if (data?.non_field_errors) setError(data.non_field_errors[0])
          else if (data?.email) setError(`Email: ${data.email[0]}`)
          else if (data?.password1) setError(`Password: ${data.password1[0]}`)
          else if (data?.password2) setError(`Password: ${data.password2[0]}`)
          else if (data?.detail) setError(data.detail)
          else setError('Unable to create account. Please try again.')
          setStep(1) // Send back to fields so user can fix
        },
      },
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7', display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)' }}>
      {/* ── Left: form pane ────────────────────────────────────── */}
      <div style={{ padding: 'clamp(48px, 6vw, 72px) clamp(32px, 6vw, 88px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#1A1A1A' }}>
          <img src="/Logos/appicon_purple.svg" alt="" style={{ width: 36, height: 36, borderRadius: 9 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.01em' }}>
            JokesFor
          </span>
        </Link>

        <span className="eyebrow-mono" style={{ marginTop: 36, display: 'block' }}>
          Step {step} of 2 · Create account
        </span>
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
          {step === 1 ? (
            <>
              Build a <em className="wink">funny</em> account.
            </>
          ) : (
            <>
              A few things, <em className="wink">then jokes.</em>
            </>
          )}
        </h2>
        <p style={{ marginTop: 8, fontSize: 18, color: '#52525B' }}>
          {step === 1 ? 'Two quick questions, then we hand you the keys.' : "We'll personalize the daily joke around these."}
        </p>

        {/* Progress */}
        <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ height: 4, borderRadius: 2, background: step >= 1 ? '#6A1CF6' : '#E9E8E7' }} />
          <div style={{ height: 4, borderRadius: 2, background: step >= 2 ? '#6A1CF6' : '#E9E8E7' }} />
        </div>

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

        {step === 1 ? (
          <form onSubmit={handleNextFromStep1} style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Google sign-up shortcut */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.22em' }}>
              <div style={{ flex: 1, height: 1, background: '#E9E8E7' }} />
              OR
              <div style={{ flex: 1, height: 1, background: '#E9E8E7' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField label="First name">
                <FlowInput value={firstName} onChange={setFirstName} placeholder="Alex" autoFocus />
              </FormField>
              <FormField label="Display handle">
                <FlowInput value={handle} onChange={setHandle} placeholder="@alexq" />
              </FormField>
            </div>
            <FormField label="Email">
              <FlowInput value={email} onChange={setEmail} placeholder="you@studio.com" type="email" autoComplete="email" />
            </FormField>
            <FormField label="Date of birth" htmlFor="dob">
              <FlowInput
                id="dob"
                name="date_of_birth"
                value={dob}
                onChange={(v) => { setDob(v); if (dobError) setDobError(null) }}
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                autoComplete="bday"
              />
              {dobError && (
                <p role="alert" style={{ fontSize: 12, color: '#A02B16', marginTop: 6 }}>{dobError}</p>
              )}
            </FormField>
            <FormField label="Password">
              <div style={{ position: 'relative' }}>
                <FlowInput
                  value={password}
                  onChange={setPassword}
                  placeholder="At least 8 characters"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#52525B',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength value={password} />
            </FormField>

            <button type="submit" className="btn-flow-primary" style={{ height: 52, marginTop: 12 }}>
              Continue <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <FormField label="What do we call you in jokes?">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 6 }}>
                {PRONOUN_OPTIONS.map((p) => {
                  const on = pronouns === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPronouns(p.id)}
                      aria-pressed={on}
                      style={{
                        height: 44,
                        borderRadius: 9999,
                        background: on ? '#6A1CF6' : 'transparent',
                        color: on ? '#fff' : '#1A1A1A',
                        border: on ? 'none' : '1px solid #E9E8E7',
                        fontSize: 13,
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </FormField>

            <FormField label="Where will you tell these jokes most?">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
                {VENUE_OPTIONS.map((v) => {
                  const on = venue === v.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVenue(v.id)}
                      aria-pressed={on}
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: on ? '#F2E9FF' : '#fff',
                        border: `1px solid ${on ? '#6A1CF6' : '#E9E8E7'}`,
                        color: '#1A1A1A',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{v.icon}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>{v.label}</span>
                    </button>
                  )
                })}
              </div>
            </FormField>

            <label
              style={{
                padding: 14,
                border: '1px solid #E9E8E7',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                background: '#FBFAF7',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={dailyJoke}
                onChange={(e) => setDailyJoke(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
                  Send me the daily joke at 9:00 AM
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  One push, one notification — no spam, ever.
                </div>
              </div>
            </label>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="button" className="btn-flow-ghost" onClick={() => setStep(1)} style={{ height: 52 }}>
                <ArrowLeft size={14} /> Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={registerMutation.isPending || updateUser.isPending}
                className="btn-flow-primary"
                style={{ height: 52, flex: 1 }}
              >
                {registerMutation.isPending || updateUser.isPending
                  ? 'Creating…'
                  : 'Create account & start setup'}
                {!(registerMutation.isPending || updateUser.isPending) && <ArrowRight size={16} />}
              </button>
            </div>
          </div>
        )}

        <p style={{ fontSize: 12, color: '#6B7280', marginTop: 18, textAlign: 'center', maxWidth: 480 }}>
          By signing up you agree to our <Link to="/terms" style={{ color: '#6A1CF6' }}>Terms</Link> and{' '}
          <Link to="/privacy" style={{ color: '#6A1CF6' }}>Privacy</Link>. We never sell your data. We do sell jokes.
        </p>
        <p style={{ textAlign: 'center', fontSize: 14, color: '#52525B', marginTop: 14 }}>
          Already in?{' '}
          <Link to="/login" style={{ color: '#6A1CF6', fontWeight: 700, textDecoration: 'none' }}>
            Sign in →
          </Link>
        </p>
      </div>

      {/* ── Right: Hooked-loop preview pane ──────────────────────── */}
      <RegisterRightPane />

      {/* Local styles — note: also defined globally by FlowAppShell when on
          /flow-canvas, /explore, /search. Inline here so /register works
          standalone without depending on that shell. */}
      <RegisterStyles />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Right pane — Hooked loop infographic
// ──────────────────────────────────────────────────────────────────────────

function RegisterRightPane() {
  const stages = [
    { num: 1, eyebrow: '9:00 AM · Trigger', body: 'A push arrives. Today\'s joke is ready.', bg: '#6A1CF6', fg: '#fff' },
    { num: 2, eyebrow: 'One tap · Action', body: 'Open. Read. Save in 8 seconds flat.', bg: '#CAFD00', fg: '#3A4A00' },
    { num: 3, eyebrow: 'Variable reward', body: "You don't know which joke — that's the point.", bg: '#FFC965', fg: '#5F4200' },
    { num: 4, eyebrow: 'Streak grows · Investment', body: "Your taste compounds. Tomorrow's joke is more 'you'.", bg: '#1A1A1A', fg: '#CAFD00' },
  ]

  return (
    <div
      style={{
        background: '#FBFAF7',
        color: '#1A1A1A',
        padding: 'clamp(36px, 4vw, 56px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        position: 'relative',
        overflow: 'hidden',
        borderLeft: '1px solid #E9E8E7',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #F2E9FF, transparent 70%)',
        }}
      />
      <span className="eyebrow-mono" style={{ position: 'relative' }}>
        What you're signing up for
      </span>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          color: '#1A1A1A',
          position: 'relative',
        }}
      >
        One ritual. <em className="wink">Three taps.</em>
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', marginTop: 8 }}>
        {stages.map((s) => (
          <div
            key={s.num}
            style={{
              padding: 16,
              background: s.bg,
              color: s.fg,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.2)',
                color: s.fg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {s.num}
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  opacity: 0.7,
                }}
              >
                {s.eyebrow}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginTop: 2 }}>
                {s.body}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Atoms
// ──────────────────────────────────────────────────────────────────────────

function FormField({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
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
  max?: string
  id?: string
  name?: string
}

function FlowInput({ value, onChange, placeholder, type = 'text', autoComplete, autoFocus, max, id, name }: FlowInputProps) {
  return (
    <input
      id={id}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      max={max}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      className="flow-input"
    />
  )
}

function PasswordStrength({ value }: { value: string }) {
  const score = passwordScore(value)
  const filled = score
  const colors = ['#E9E8E7', '#E9E8E7', '#E9E8E7', '#E9E8E7']
  for (let i = 0; i < filled; i++) colors[i] = '#6A1CF6'
  return (
    <>
      <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
        {colors.map((c, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: c }} />
        ))}
      </div>
      <p style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>{strengthLabel(score)}</p>
    </>
  )
}

function passwordScore(pw: string): number {
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++
  return s
}

function strengthLabel(score: number): string {
  return ['Weak.', 'Could be stronger.', 'Decent.', 'Strong. Could be funnier.', 'Locked tight.'][score] ?? ''
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

function RegisterStyles() {
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
      .btn-flow-ghost {
        padding: 0 16px; border: 1px solid #E9E8E7; border-radius: 9999px;
        font-family: var(--font-sans); font-weight: 600; font-size: 13px;
        background: transparent; color: #1A1A1A; cursor: pointer;
        display: inline-flex; align-items: center; gap: 6px;
        transition: background 0.12s ease;
      }
      .btn-flow-ghost:hover { background: #F4F2EE; }
    `}</style>
  )
}
