import { describe, it, expect } from 'vitest'
import { communityFormedCopy, communityFormedHref } from './copy'

describe('communityFormedCopy', () => {
  it('member copy', () => {
    expect(communityFormedCopy({ community: 'space', name: 'Space', emoji: '🚀', role: 'member' })).toBe(
      "🚀 The Space community just formed — you're one of its first members.",
    )
  })

  it('creator copy', () => {
    expect(communityFormedCopy({ community: 'puns', name: 'Puns', emoji: '🥁', role: 'creator' })).toBe(
      '🥁 The Puns community just formed. Your Puns jokes have a new audience.',
    )
  })

  it('creator copy never guesses an article from the name', () => {
    for (const name of ['Unicorns', 'University Life', 'Hour Jokes', 'Apples']) {
      expect(communityFormedCopy({ community: 'x', name, role: 'creator' })).toBe(
        `The ${name} community just formed. Your ${name} jokes have a new audience.`,
      )
    }
  })

  it('an unknown role reads as a member', () => {
    expect(communityFormedCopy({ community: 'space', name: 'Space', emoji: '🚀', role: 'other' })).toBe(
      "🚀 The Space community just formed — you're one of its first members.",
    )
  })

  it('degrades without name / emoji / slug', () => {
    expect(communityFormedCopy({ community: 'office-life', role: 'creator' })).toBe(
      'The Office Life community just formed. Your Office Life jokes have a new audience.',
    )
    expect(communityFormedCopy({})).toBe('A new community just formed.')
  })
})

describe('communityFormedHref', () => {
  it('links to the community, or the directory without a slug', () => {
    expect(communityFormedHref({ community: 'space' })).toBe('/communities/space')
    expect(communityFormedHref({})).toBe('/communities')
  })
})
