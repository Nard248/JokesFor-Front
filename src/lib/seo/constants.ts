/**
 * SEO constants — the canonical production origin and site-wide defaults used
 * by <Seo> (src/lib/seo/Seo.tsx) and index.html's static fallback tags.
 *
 * SITE_URL is intentionally hardcoded (not `window.location.origin`): canonical
 * URLs, og:url, and JSON-LD `url` fields must always point at the one real
 * production origin, regardless of what host happens to be serving the page
 * (localhost, a PR preview channel, etc).
 */
export const SITE_URL = 'https://jokesforfront.web.app'

export const SITE_NAME = 'JokesFor'

/**
 * Default social preview image. No dedicated 1200×630 raster OG image exists
 * yet in public/ — this SVG banner is the closest available brand asset.
 * Some crawlers (notably Twitter/X) don't render SVG previews; swap this for
 * a proper PNG/JPG export when one exists.
 */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/Logos/banner_purple.svg`

export const DEFAULT_DESCRIPTION =
  "Discover hand-picked jokes every morning — setups, one-liners, stories and more. Reveal the punchline, save your favorites, and follow real comedians."

/**
 * Backend origin — derived from VITE_API_URL by stripping a trailing
 * `/api/v1`, falling back to the known production backend host. Used for
 * URLs that must hit the Django app directly rather than the SPA
 * (per-joke share links so social scrapers get a real OG preview instead
 * of the bare app shell).
 */
export const BACKEND_ORIGIN = (
  import.meta.env.VITE_API_URL || 'https://jokesforbackend-332865216810.us-east1.run.app/api/v1'
).replace(/\/api\/v1\/?$/, '')

/**
 * Per-joke share URL. Points at the backend's `/jokes/:id/share/` endpoint,
 * which serves per-joke Open Graph/Twitter tags for link-unfurling
 * crawlers and redirects human visitors back to the SPA's joke detail
 * page. Always use this (never a bare `{SITE_URL}/jokes/:id` link) for
 * anything copied to the clipboard or passed to navigator.share — that's
 * the only way shared links get a real per-joke preview.
 */
export function jokeShareUrl(id: number | string): string {
  return `${BACKEND_ORIGIN}/jokes/${id}/share/`
}
