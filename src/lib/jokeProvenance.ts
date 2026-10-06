/**
 * Joke provenance — the language a joke is written in, the country it comes
 * from, and how it was written (editorial status). Pure helpers shared by every
 * card converter so each surface shows the same badges.
 *
 * Render defensively: older payloads (and the lean list serializer) omit some
 * or all of these fields, and `language` may be a nested object or a bare code.
 */

/** `generated` is never served; `ai_screened` is written with AI and screened. */
export type EditorialStatus = 'legacy' | 'generated' | 'ai_screened' | 'native_reviewed'

/** The joke's nationality/origin — NOT what the joke is about. */
export interface OriginCountry {
  code: string
  name: string
  native_name?: string
}

export type LanguageLike =
  | { code?: string | null; name?: string | null; native_name?: string | null }
  | string
  | null
  | undefined

export interface JokeProvenance {
  /** Native-script language name; only set when the joke is not in English. */
  languageLabel?: string
  /** BCP 47 code for the language badge's `lang` attribute. */
  languageCode?: string
  /** English language name, for the badge tooltip. */
  languageName?: string
  origin?: { code: string; name: string; flag: string }
  /** True for `editorial_status === 'ai_screened'`. */
  aiGenerated?: boolean
}

export const AI_GENERATED_DESCRIPTION =
  'Written with AI and screened; not yet reviewed by a native speaker'

/** Language code of a joke, tolerant of `{code}` objects and bare strings. */
export function languageCode(language: LanguageLike): string | undefined {
  const raw = typeof language === 'string' ? language : language?.code
  const code = raw?.trim()
  return code ? code : undefined
}

function isEnglish(code: string): boolean {
  return code.toLowerCase().split(/[-_]/)[0] === 'en'
}

function displayName(code: string, inLocale: string): string | undefined {
  try {
    const name = new Intl.DisplayNames([inLocale], { type: 'language' }).of(code)
    // Unknown codes echo back unchanged — that isn't a name.
    return name && name.toLowerCase() !== code.toLowerCase() ? name : undefined
  } catch {
    return undefined
  }
}

/**
 * Regional-indicator flag emoji for an ISO 3166-1 alpha-2 code ('ES' → 🇪🇸).
 * Returns '' for anything that isn't exactly two ASCII letters.
 */
export function flagEmoji(countryCode: string | null | undefined): string {
  const code = (countryCode ?? '').trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return ''
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

/** The provenance-bearing fields of any joke payload (all optional). */
export interface ProvenanceFields {
  language?: LanguageLike
  origin_country?: OriginCountry | null
  editorial_status?: string | null
}

/** Derive the provenance badges for a joke payload. Every field is optional. */
export function jokeProvenance(joke: ProvenanceFields): JokeProvenance {
  const result: JokeProvenance = {}

  const code = languageCode(joke.language)
  if (code && !isEnglish(code)) {
    const obj = typeof joke.language === 'object' ? joke.language : null
    const englishName = obj?.name?.trim() || displayName(code, 'en')
    result.languageCode = code
    result.languageName = englishName
    result.languageLabel = obj?.native_name?.trim() || displayName(code, code) || englishName || code
  }

  const origin = joke.origin_country
  if (origin && typeof origin === 'object' && origin.code) {
    const name = origin.name?.trim() || origin.native_name?.trim() || origin.code.toUpperCase()
    result.origin = { code: origin.code.toUpperCase(), name, flag: flagEmoji(origin.code) }
  }

  if (joke.editorial_status === 'ai_screened') result.aiGenerated = true

  return result
}

/** True when there is at least one badge to render. */
export function hasProvenance(p: JokeProvenance | undefined): p is JokeProvenance {
  return !!p && (!!p.languageLabel || !!p.origin || !!p.aiGenerated)
}
