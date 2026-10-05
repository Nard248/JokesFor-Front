import { describe, it, expect } from 'vitest'
import { flagEmoji, hasProvenance, jokeProvenance, languageCode } from './jokeProvenance'

describe('flagEmoji', () => {
  it('maps an ISO alpha-2 code to regional indicator symbols', () => {
    expect(flagEmoji('ES')).toBe('\u{1F1EA}\u{1F1F8}')
    expect(flagEmoji('am')).toBe('\u{1F1E6}\u{1F1F2}')
    expect(flagEmoji(' no ')).toBe('\u{1F1F3}\u{1F1F4}')
  })

  it('returns an empty string for anything that is not two ASCII letters', () => {
    expect(flagEmoji('')).toBe('')
    expect(flagEmoji(null)).toBe('')
    expect(flagEmoji(undefined)).toBe('')
    expect(flagEmoji('ESP')).toBe('')
    expect(flagEmoji('1A')).toBe('')
    expect(flagEmoji('É1')).toBe('')
  })
})

describe('languageCode', () => {
  it('reads nested objects and bare codes', () => {
    expect(languageCode({ code: 'es' })).toBe('es')
    expect(languageCode('hy')).toBe('hy')
    expect(languageCode({ code: '' })).toBeUndefined()
    expect(languageCode(null)).toBeUndefined()
    expect(languageCode(undefined)).toBeUndefined()
  })
})

describe('jokeProvenance', () => {
  it('has nothing to show for an English joke with no origin or AI status', () => {
    const p = jokeProvenance({ language: { code: 'en', name: 'English' }, editorial_status: 'legacy' })
    expect(p).toEqual({})
    expect(hasProvenance(p)).toBe(false)
  })

  it('treats English regional variants as English', () => {
    expect(jokeProvenance({ language: { code: 'en-GB', name: 'English' } }).languageLabel).toBeUndefined()
  })

  it('prefers the backend native_name for a non-English language', () => {
    const p = jokeProvenance({ language: { code: 'es', name: 'Spanish', native_name: 'Español' } })
    expect(p.languageLabel).toBe('Español')
    expect(p.languageCode).toBe('es')
    expect(p.languageName).toBe('Spanish')
  })

  it('falls back to the Intl native name when native_name is missing or blank', () => {
    const p = jokeProvenance({ language: { code: 'de', name: 'German', native_name: '' } })
    expect(p.languageLabel).toBe('Deutsch')
    expect(jokeProvenance({ language: 'fr' }).languageLabel).toBe('français')
    expect(jokeProvenance({ language: 'fr' }).languageName).toBe('French')
  })

  it('falls back to the code when neither the payload nor Intl knows the language', () => {
    const p = jokeProvenance({ language: 'zz' })
    expect(p.languageLabel).toBe('zz')
    expect(p.languageCode).toBe('zz')
  })

  it('builds the origin badge from origin_country', () => {
    const p = jokeProvenance({ origin_country: { code: 'am', name: 'Armenia', native_name: 'Հայաստան' } })
    expect(p.origin).toEqual({ code: 'AM', name: 'Armenia', flag: '\u{1F1E6}\u{1F1F2}' })
    expect(hasProvenance(p)).toBe(true)
  })

  it('shows an English-language joke from a non-English country (origin only)', () => {
    const p = jokeProvenance({ language: { code: 'en', name: 'English' }, origin_country: { code: 'IE', name: 'Ireland', native_name: 'Éire' } })
    expect(p.languageLabel).toBeUndefined()
    expect(p.origin?.name).toBe('Ireland')
  })

  it('ignores a null or code-less origin_country', () => {
    expect(jokeProvenance({ origin_country: null }).origin).toBeUndefined()
    expect(jokeProvenance({ origin_country: { code: '', name: 'Nowhere' } }).origin).toBeUndefined()
  })

  it('marks only ai_screened jokes as AI-generated', () => {
    expect(jokeProvenance({ editorial_status: 'ai_screened' }).aiGenerated).toBe(true)
    for (const status of ['legacy', 'native_reviewed', 'generated', undefined, null]) {
      expect(jokeProvenance({ editorial_status: status }).aiGenerated).toBeUndefined()
    }
  })
})
