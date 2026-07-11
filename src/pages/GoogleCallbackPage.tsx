import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router'
import { Loader2, AlertCircle } from 'lucide-react'
import type { AxiosError } from 'axios'
import { useGoogleAuth } from '@/features/auth'
import { consumeReturnTo, getOAuthRedirectUri } from '@/features/auth/google-oauth'
import { Button } from '@/components/ui/button'

interface ApiError {
  detail?: string
  non_field_errors?: string[]
  /** COPPA gate: NEW Google users get `{"code": "dob_required"}` (scalar). */
  code?: string
  /** Under-13 rejection mirrors the email path: `{"date_of_birth": ["…"]}`. */
  date_of_birth?: string[]
}

// Today (ISO 'YYYY-MM-DD') — caps the DOB picker to discourage future dates.
const TODAY_ISO = new Date().toISOString().slice(0, 10)

/**
 * OAuth callback landing.
 * URL pattern: /auth/google/callback?code=AUTH_CODE
 * On error from Google: /auth/google/callback?error=access_denied&...
 *
 * Flow:
 *   1. Read `code` (or `error`) from URL.
 *   2. POST `code` to backend `/auth/google/`.
 *   3a. Success (returning/linked user, or new user with valid DOB already
 *       supplied): navigate to stashed returnTo (or `/`).
 *   3b. `dob_required` (NEW user, COPPA gate): prompt for date of birth, then
 *       resubmit `code + date_of_birth`. Returning users never hit this.
 *   3c. Under-13: show the same message the email signup path shows.
 *   4. Other failure: show error + link back to /login.
 */
export function GoogleCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const exchanged = useRef(false)

  const code = searchParams.get('code')
  const googleError = searchParams.get('error')

  const googleAuth = useGoogleAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // COPPA prompt state — only shown when the backend asks via `dob_required`.
  const [needsDob, setNeedsDob] = useState(false)
  const [dob, setDob] = useState('')
  const [dobError, setDobError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleAuthError = useCallback((err: unknown) => {
    const axiosError = err as AxiosError<ApiError>
    const data = axiosError.response?.data
    // NEW user with no DOB on file — prompt for it, then resubmit. Do NOT treat
    // this as an error; returning users never receive this code.
    if (data?.code === 'dob_required') {
      setNeedsDob(true)
      setDobError(null)
      return
    }
    // Under-13 rejection — same contract/message as the email path. Keep the
    // prompt open so the user sees the reason inline.
    if (data?.date_of_birth?.[0]) {
      setNeedsDob(true)
      setDobError(data.date_of_birth[0])
      return
    }
    setErrorMessage(
      data?.detail ||
        data?.non_field_errors?.[0] ||
        'Sign-in failed. Please try again.',
    )
  }, [])

  const exchange = useCallback(
    (dateOfBirth?: string) => {
      if (!code) return Promise.resolve()
      return googleAuth
        .mutateAsync({
          code,
          redirect_uri: getOAuthRedirectUri(),
          ...(dateOfBirth ? { date_of_birth: dateOfBirth } : {}),
        })
        .then(() => {
          navigate(consumeReturnTo(), { replace: true })
        })
        .catch(handleAuthError)
    },
    [code, googleAuth, navigate, handleAuthError],
  )

  useEffect(() => {
    // Prevent double-exchange in StrictMode (auth codes are single-use)
    if (exchanged.current) return

    if (googleError) {
      exchanged.current = true
      setErrorMessage(
        googleError === 'access_denied'
          ? 'Sign-in cancelled. You can try again any time.'
          : `Google rejected the sign-in: ${googleError}`,
      )
      return
    }

    if (!code) {
      exchanged.current = true
      setErrorMessage('No authorization code received from Google.')
      return
    }

    exchanged.current = true
    // Use mutateAsync, NOT mutate's call-level callbacks. Under React 18
    // StrictMode the effect mounts → unmounts → remounts in dev; TanStack
    // Query drops the onSuccess/onError passed to mutate() when the issuing
    // component unmounts mid-flight. Combined with the `exchanged` guard
    // (which stops the remount from re-issuing), the 200 comes back but the
    // success handler never runs and the page hangs on "Signing you in…".
    // The mutateAsync promise settles regardless of mount state, so navigation
    // fires reliably; the guard still keeps this to a single code exchange.
    //
    // First exchange carries no DOB — the backend asks for it (dob_required)
    // only when this resolves to a brand-new account.
    void exchange()
  }, [code, googleError, exchange])

  const handleDobSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!dob) {
      setDobError('Date of birth is required')
      return
    }
    setDobError(null)
    setSubmitting(true)
    // Resubmit the same code with the date of birth. Reuses the register form's
    // input/validation contract; the backend enforces the under-13 block.
    void exchange(dob).finally(() => setSubmitting(false))
  }

  if (errorMessage) {
    return (
      <CallbackShell>
        <div className="bg-white rounded-[32px] shadow-lg border border-[#E9E8E7] p-8">
          <AlertCircle className="w-10 h-10 mx-auto text-destructive" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Couldn't sign you in
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">{errorMessage}</p>
          <div className="mt-6 flex flex-col gap-3">
            <Button asChild variant="pill" size="xl" className="w-full">
              <Link to="/login">Back to sign in</Link>
            </Button>
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Continue as guest
            </Link>
          </div>
        </div>
      </CallbackShell>
    )
  }

  if (needsDob) {
    return (
      <CallbackShell>
        <form
          onSubmit={handleDobSubmit}
          className="bg-white rounded-[32px] shadow-lg border border-[#E9E8E7] p-8 text-left"
        >
          <h1 className="text-xl font-semibold text-foreground text-center">
            One more thing
          </h1>
          <p className="mt-3 text-sm text-muted-foreground text-center">
            Confirm your date of birth to finish creating your account.
          </p>
          <label
            htmlFor="google-dob"
            className="mt-6 block text-sm font-semibold text-foreground"
          >
            Date of birth
          </label>
          <input
            id="google-dob"
            name="date_of_birth"
            type="date"
            value={dob}
            max={TODAY_ISO}
            autoComplete="bday"
            onChange={(e) => {
              setDob(e.target.value)
              if (dobError) setDobError(null)
            }}
            aria-describedby={dobError ? 'google-dob-error' : undefined}
            className="mt-2 h-12 w-full rounded-xl border border-[#E9E8E7] px-4 text-[15px] outline-none focus:border-primary"
          />
          {dobError && (
            <p
              id="google-dob-error"
              role="alert"
              className="mt-2 text-xs text-destructive"
            >
              {dobError}
            </p>
          )}
          <Button
            type="submit"
            variant="pill"
            size="xl"
            className="mt-6 w-full"
            disabled={submitting}
          >
            {submitting ? 'Finishing…' : 'Continue'}
          </Button>
        </form>
      </CallbackShell>
    )
  }

  return (
    <CallbackShell>
      <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
      <p className="mt-4 text-foreground font-medium">Signing you in…</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Finishing the handshake with Google.
      </p>
    </CallbackShell>
  )
}

function CallbackShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F6F6] px-4">
      <div className="w-full max-w-md text-center">{children}</div>
    </div>
  )
}
