import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { Loader2 } from 'lucide-react'
import { useVerifyEmail, useResendVerification } from '@/features/auth'
import { parseAuthError } from '@/features/auth/parseAuthError'
import { trackVerify } from '@/features/auth/analytics'
import { OtpInput } from '@/components/ui/otp-input'
import { Button } from '@/components/ui/button'

const COOLDOWN_SECONDS = 45

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const email = params.get('email')
  const sendFailed = params.get('sendFailed') === '1'

  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState(false) // 429 on verify → must resend
  const [cooldown, setCooldown] = useState(sendFailed ? 0 : COOLDOWN_SECONDS)
  const submitting = useRef(false)

  const verify = useVerifyEmail()
  const resend = useResendVerification()

  // Track screen view on mount
  useEffect(() => {
    trackVerify('verify_screen_viewed')
  }, [])

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  if (!email) return <Navigate to="/register" replace />

  const submit = async (value: string) => {
    if (submitting.current || locked) return
    if (!/^\d{6}$/.test(value)) { setError('Enter the 6-digit code.'); return }
    submitting.current = true
    setError(null)
    try {
      await verify.mutateAsync({ email, code: value })
      trackVerify('verify_succeeded')
      navigate('/flow', { replace: true }) // new user → onboarding
    } catch (err) {
      const { message, status } = parseAuthError(err, 'Sign-in failed. Please try again.')
      // Analytics gets a CATEGORY, never the raw message (which could echo the
      // email back from a field error) — per guide §12/§14.
      const reason =
        status === 429 ? 'too_many'
        : /already verified/i.test(message) ? 'already_verified'
        : /expired/i.test(message) ? 'expired'
        : 'incorrect'
      trackVerify('verify_failed', { reason })
      if (status === 429) { setLocked(true); setError('Too many attempts. Request a new code below.') }
      else if (reason === 'already_verified') { navigate('/login', { replace: true }); return }
      else setError(message)
      setCode('')
    } finally {
      submitting.current = false
    }
  }

  const onResend = () => {
    if (cooldown > 0) {
      trackVerify('resend_throttled')
      return
    }
    trackVerify('resend_clicked')
    resend.mutate(email, {
      onSuccess: () => { setCooldown(COOLDOWN_SECONDS); setLocked(false); setError(null) },
      onError: (err) => {
        const { status } = parseAuthError(err)
        if (status === 429) { setCooldown(COOLDOWN_SECONDS); setError('A few codes already sent — give it a couple of minutes.') }
        else setCooldown(COOLDOWN_SECONDS)
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F6F6] px-4">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-lg border border-[#E9E8E7] p-8">
        <button onClick={() => navigate('/register')} className="text-sm text-muted-foreground hover:text-foreground mb-4">← Back</button>
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {sendFailed ? "We couldn't send your code — tap Resend below. " : 'We sent a 6-digit code to '}
          <span className="font-medium text-foreground">{email}</span>
        </p>

        <div className="mt-6">
          <OtpInput value={code} onChange={setCode} onComplete={submit} disabled={locked || verify.isPending} invalid={!!error} describedById="otp-error" />
        </div>

        <div id="otp-error" aria-live="polite" className="mt-3 min-h-5 text-center text-sm text-destructive">
          {error}
        </div>

        <Button variant="pill" size="xl" className="w-full mt-2" disabled={locked || verify.isPending || code.length !== 6} onClick={() => submit(code)}>
          {verify.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
        </Button>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Didn't get it?{' '}
          <button
            onClick={onResend}
            disabled={cooldown > 0}
            className="font-medium text-primary disabled:text-muted-foreground disabled:cursor-not-allowed"
          >
            Resend code{cooldown > 0 ? ` (${cooldown}s)` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
