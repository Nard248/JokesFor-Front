/**
 * `?theme=<slug>` carry-through for "Write a <Theme> joke" entry points.
 *
 * A community slug IS its theme (`ContextTag`) slug, so community CTAs link to
 * `/create/new?theme=<slug>`; the format picker forwards it to
 * `/create/new/:formatSlug?theme=<slug>`, and the new-draft editor preselects
 * it in the Themes field. Only ever applied to a brand-new draft.
 */
const THEME_SLUG = /^[A-Za-z0-9_-]{1,64}$/

/** The `theme` query value when it is a plausible slug, else null. */
export function readThemeParam(params: URLSearchParams): string | null {
  const value = params.get('theme')?.trim() ?? ''
  return THEME_SLUG.test(value) ? value : null
}

/** `/create/new` (format picker) or `/create/new/:formatSlug`, with the theme when given. */
export function newJokeHref(theme?: string | null, formatSlug?: string): string {
  const path = formatSlug ? `/create/new/${formatSlug}` : '/create/new'
  return theme ? `${path}?theme=${encodeURIComponent(theme)}` : path
}
