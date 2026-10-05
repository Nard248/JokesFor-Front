import { describe, it, expect } from 'vitest'
import { newJokeHref, readThemeParam } from './theme-param'

describe('readThemeParam', () => {
  it('returns a plausible slug', () => {
    expect(readThemeParam(new URLSearchParams('theme=office-life'))).toBe('office-life')
    expect(readThemeParam(new URLSearchParams('theme=dad_jokes'))).toBe('dad_jokes')
  })

  it('rejects missing, empty or non-slug values', () => {
    expect(readThemeParam(new URLSearchParams(''))).toBeNull()
    expect(readThemeParam(new URLSearchParams('theme='))).toBeNull()
    expect(readThemeParam(new URLSearchParams('theme=a%20b'))).toBeNull()
    expect(readThemeParam(new URLSearchParams('theme=%3Cscript%3E'))).toBeNull()
    expect(readThemeParam(new URLSearchParams(`theme=${'x'.repeat(65)}`))).toBeNull()
  })
})

describe('newJokeHref', () => {
  it('links to the format picker, with the theme when given', () => {
    expect(newJokeHref()).toBe('/create/new')
    expect(newJokeHref(null)).toBe('/create/new')
    expect(newJokeHref('puns')).toBe('/create/new?theme=puns')
  })

  it('links straight to a format editor, carrying the theme', () => {
    expect(newJokeHref('puns', 'oneliner')).toBe('/create/new/oneliner?theme=puns')
    expect(newJokeHref(null, 'oneliner')).toBe('/create/new/oneliner')
  })
})
