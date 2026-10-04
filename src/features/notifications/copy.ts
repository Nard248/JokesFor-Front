/** slug -> "Title Case" fallback when a payload has no display name. */
function titleFromSlug(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

/** Copy for a `community_formed` notification (shared contract with iOS).
 * `data` = `{community: slug, name, emoji, role: 'member' | 'creator'}`: a
 * member hears they are one of the first members; a creator hears their
 * jokes have a new audience ("An" before a vowel-initial name). A partial payload degrades to generic copy
 * instead of rendering "undefined". */
export function communityFormedCopy(data: Record<string, unknown>): string {
  const slug = typeof data.community === 'string' ? data.community : ''
  const name = typeof data.name === 'string' && data.name ? data.name : slug ? titleFromSlug(slug) : ''
  const emoji = typeof data.emoji === 'string' && data.emoji ? `${data.emoji} ` : ''
  if (!name) return `${emoji}A new community just formed.`
  return data.role === 'creator'
    ? `${emoji}${/^[aeiou]/i.test(name) ? 'An' : 'A'} ${name} community just formed. Your ${name} jokes have a new audience.`
    : `${emoji}The ${name} community just formed — you're one of its first members.`
}

/** In-app destination for a `community_formed` notification. */
export function communityFormedHref(data: Record<string, unknown>): string {
  const slug = typeof data.community === 'string' ? data.community : ''
  return slug ? `/communities/${encodeURIComponent(slug)}` : '/communities'
}
