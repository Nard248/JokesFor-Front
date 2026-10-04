/** slug -> "Title Case" fallback when a payload has no display name. */
function titleFromSlug(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

/** Copy for a `community_formed` notification (shared contract with iOS —
 * keep these strings byte-identical there).
 * `data` = `{community: slug, name, emoji, role: 'member' | 'creator'}`:
 *  - member:  "The {name} community just formed — you're one of its first members."
 *  - creator: "The {name} community just formed. Your {name} jokes have a new audience."
 * Both lead with "The" so no a/an article has to be guessed from the name.
 * A partial payload degrades to generic copy instead of rendering "undefined". */
export function communityFormedCopy(data: Record<string, unknown>): string {
  const slug = typeof data.community === 'string' ? data.community : ''
  const name = typeof data.name === 'string' && data.name ? data.name : slug ? titleFromSlug(slug) : ''
  const emoji = typeof data.emoji === 'string' && data.emoji ? `${data.emoji} ` : ''
  if (!name) return `${emoji}A new community just formed.`
  return data.role === 'creator'
    ? `${emoji}The ${name} community just formed. Your ${name} jokes have a new audience.`
    : `${emoji}The ${name} community just formed — you're one of its first members.`
}

/** In-app destination for a `community_formed` notification. */
export function communityFormedHref(data: Record<string, unknown>): string {
  const slug = typeof data.community === 'string' ? data.community : ''
  return slug ? `/communities/${encodeURIComponent(slug)}` : '/communities'
}
