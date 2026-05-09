// Google OAuth helper — builds the consent screen URL.
//
// IMPORTANT: the redirect URI sent here must EXACTLY match the backend's
// GOOGLE_OAUTH_CALLBACK_URL env var on the Cloud Run service. The backend
// re-sends this URI to Google when redeeming the auth code; Google rejects
// the exchange with `redirect_uri_mismatch` if they differ.
//
// Backend currently has GOOGLE_OAUTH_CALLBACK_URL=https://jokesforfront.web.app/auth/google/callback
// so we hardcode the same default here. If the backend setting changes, update
// VITE_GOOGLE_OAUTH_REDIRECT_URI in the workflow + .env to match.

const DEFAULT_REDIRECT_URI = 'https://jokesforfront.web.app/auth/google/callback'

export const GOOGLE_OAUTH_REDIRECT_URI =
  import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT_URI || DEFAULT_REDIRECT_URI

const GOOGLE_OAUTH_AUTHORIZE = 'https://accounts.google.com/o/oauth2/v2/auth'

const SCOPES = ['openid', 'email', 'profile']

const RETURN_TO_KEY = 'auth.returnTo'

/**
 * Build the URL to redirect the user to Google's consent screen.
 * Optionally stash a `returnTo` path in sessionStorage to navigate to
 * after a successful exchange.
 */
export function getGoogleAuthUrl(returnTo?: string): string {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error(
      'VITE_GOOGLE_CLIENT_ID is not set. Add it to .env (local) and the deploy workflow (CI).',
    )
  }

  if (returnTo) {
    sessionStorage.setItem(RETURN_TO_KEY, returnTo)
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: GOOGLE_OAUTH_REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
  })

  return `${GOOGLE_OAUTH_AUTHORIZE}?${params.toString()}`
}

/** Read and clear the stashed returnTo from sessionStorage. */
export function consumeReturnTo(): string {
  const value = sessionStorage.getItem(RETURN_TO_KEY)
  sessionStorage.removeItem(RETURN_TO_KEY)
  return value || '/'
}
