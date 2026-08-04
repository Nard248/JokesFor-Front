/**
 * Sensibly truncate free-text (joke bodies, bios, pack descriptions, …) for use
 * in <title>/meta description tags. Cuts at the last word boundary before
 * `maxLength` rather than mid-word, and appends an ellipsis when shortened.
 */
export function truncate(text: string, maxLength: number): string {
  const trimmed = text.trim().replace(/\s+/g, ' ')
  if (trimmed.length <= maxLength) return trimmed

  const cut = trimmed.slice(0, maxLength - 1)
  const lastSpace = cut.lastIndexOf(' ')
  // Only break on a word boundary if it doesn't throw away too much text.
  const safe = lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut
  return `${safe.trimEnd()}…`
}

/**
 * Serialize a JSON-LD object for embedding inside a <script type="application/
 * ld+json"> tag. JSON.stringify alone guards against breaking OUT of the JSON
 * (quotes/backslashes in user content can't inject new keys), but a literal
 * "</script>" inside a string value would still prematurely close the tag in
 * the rendered HTML — so `<` is escaped to its unicode form, which round-trips
 * through JSON.parse unchanged.
 */
export function toSafeJsonLdString(value: object): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
