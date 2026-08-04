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
