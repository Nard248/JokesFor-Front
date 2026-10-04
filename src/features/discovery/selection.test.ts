import { describe, expect, it } from 'vitest'
import { EMPTY_SELECTION, resolveSelection, selectionParams, selectionUrl, normalizeSelection } from './selection'

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
