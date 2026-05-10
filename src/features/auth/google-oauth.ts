// Google OAuth helper — builds the consent screen URL.
//
// REDIRECT URI RESOLUTION (in priority order):
//   1. VITE_GOOGLE_OAUTH_REDIRECT_URI env var if set (used in CI/prod deploys
//      to lock the URI to web.app, since the backend's GOOGLE_OAUTH_CALLBACK_URL
//      is currently fixed to that one origin).
//   2. window.location.origin + '/auth/google/callback' — dynamic. Used in
//      local dev. If the backend's hardcoded callback URL doesn't match,
//      Google will reject with `redirect_uri_mismatch` AND the user stays on
//      localhost (they see an error instead of being bounced to prod).
//
// Per the backend handout §5.3, the OAuth client config in GCP already has
// localhost variants registered, so Google itself accepts localhost as a
// valid redirect_uri.

const GOOGLE_OAUTH_AUTHORIZE = 'https://accounts.google.com/o/oauth2/v2/auth'
const SCOPES = ['openid', 'email', 'profile']
const RETURN_TO_KEY = 'auth.returnTo'

/**
 * Compute the canonical redirect URI for OAuth.
 * - Env var override wins (used in prod to lock to web.app)
 * - Otherwise, current origin (works on localhost AND any deployed origin)
 */
export function getOAuthRedirectUri(): string {
  const fromEnv = import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT_URI
  if (fromEnv) return fromEnv
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/google/callback`
  }
  return 'https://jokesforfront.web.app/auth/google/callback'
}

// Back-compat export for places that still read this constant.
export const GOOGLE_OAUTH_REDIRECT_URI = getOAuthRedirectUri()

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
    // Resolve dynamically every time so we follow the current origin.
    redirect_uri: getOAuthRedirectUri(),
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
