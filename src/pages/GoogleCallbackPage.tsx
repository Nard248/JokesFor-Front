import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router'
import { Loader2, AlertCircle } from 'lucide-react'
import type { AxiosError } from 'axios'
import { useGoogleAuth } from '@/features/auth'
import { consumeReturnTo, getOAuthRedirectUri } from '@/features/auth/google-oauth'
import { Button } from '@/components/ui/button'

interface ApiError {
  detail?: string
  non_field_errors?: string[]
  code?: string[]
}

/**
 * OAuth callback landing.
 * URL pattern: /auth/google/callback?code=AUTH_CODE
 * On error from Google: /auth/google/callback?error=access_denied&...
 *
 * Flow:
 *   1. Read `code` (or `error`) from URL.
 *   2. POST `code` to backend `/auth/google/`.
 *   3. On success: navigate to stashed returnTo (or `/`).
 *   4. On failure: show error + link back to /login.
 */
export function GoogleCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const exchanged = useRef(false)

  const code = searchParams.get('code')
  const googleError = searchParams.get('error')

  const googleAuth = useGoogleAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
    // Send redirect_uri too — it MUST match what we sent to Google in step 1,
    // or Google rejects the code exchange.
    googleAuth
      .mutateAsync({ code, redirect_uri: getOAuthRedirectUri() })
      .then(() => {
        navigate(consumeReturnTo(), { replace: true })
      })
      .catch((err) => {
        const axiosError = err as AxiosError<ApiError>
        const data = axiosError.response?.data
        setErrorMessage(
          data?.detail ||
            data?.non_field_errors?.[0] ||
            data?.code?.[0] ||
            'Sign-in failed. Please try again.',
        )
      })
  }, [code, googleError, googleAuth, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F6F6] px-4">
      <div className="w-full max-w-md text-center">
        {!errorMessage ? (
          <>
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
            <p className="mt-4 text-foreground font-medium">Signing you in…</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Finishing the handshake with Google.
            </p>
          </>
        ) : (
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
        )}
      </div>
    </div>
  )
}
