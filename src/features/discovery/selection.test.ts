import { describe, expect, it } from 'vitest'
import { ALL_LANGUAGES, EMPTY_SELECTION, normalizeSelection, resolveSelection, selectionParams, selectionUrl } from './selection'

describe('content discovery selection', () => {
  const saved = { language: 'fr', country: 'FR', culture_tags: 'france-everyday' }

  it('lets a shared URL fully override browser preferences, including omitted dimensions', () => {
    expect(resolveSelection('?language=hy&q=սուրճ', saved)).toEqual({ language: 'hy', country: '', culture_tags: '' })
    expect(resolveSelection('?language=&country=&culture_tags=', saved)).toEqual(EMPTY_SELECTION)
    expect(resolveSelection('?q=coffee', saved)).toEqual(saved)
  })

  it('preserves search state and makes All choices shareable without preserving pagination', () => {
    const result = selectionUrl('?q=café&page=4&tones=dad', EMPTY_SELECTION)
    expect(result.get('q')).toBe('café')
    expect(result.get('tones')).toBe('dad')
    expect(result.has('page')).toBe(false)
    expect(result.has('language')).toBe(true)
    expect(resolveSelection(result.toString(), saved)).toEqual(EMPTY_SELECTION)
  })

  it('keeps language, country, and culture independent and sends only active filters', () => {
    expect(selectionParams({ language: 'es', country: 'FR', culture_tags: '' })).toEqual({ language: 'es', country: 'FR' })
    expect(selectionParams(EMPTY_SELECTION)).toEqual({})
  })

  it('normalizes persisted shapes safely without silently widening unknown requested filters', () => {
    expect(normalizeSelection({ language: 'ES', country: 'es', culture_tags: 'spain-everyday' })).toEqual({ language: 'es', country: 'ES', culture_tags: 'spain-everyday' })
    expect(normalizeSelection(null)).toEqual(EMPTY_SELECTION)
    expect(resolveSelection('?language=unknown', saved).language).toBe('unknown')
  })
})

describe('language selection semantics', () => {
  it('sends language=all for an explicit "All languages" choice', () => {
    expect(selectionParams({ ...EMPTY_SELECTION, language: ALL_LANGUAGES })).toEqual({ language: 'all' })
  })

  it('omits language when nothing is chosen, so the server applies the viewer default', () => {
    expect(selectionParams(EMPTY_SELECTION)).toEqual({})
  })

  it('keeps an explicit All choice from the URL', () => {
    expect(resolveSelection('?language=all', EMPTY_SELECTION).language).toBe('all')
  })
})
