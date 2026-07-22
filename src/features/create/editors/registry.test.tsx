import { describe, it, expect } from 'vitest'
import { EDITOR_BY_FORMAT } from './index'

const ALL_SLUGS = ['oneliner', 'setup', 'knock', 'story', 'anti', 'observ'] as const

describe('EDITOR_BY_FORMAT registry', () => {
  it('has all 6 format slugs', () => {
    for (const slug of ALL_SLUGS) {
      expect(EDITOR_BY_FORMAT).toHaveProperty(slug)
    }
  })

  it('setup and anti both exist and are React lazy exotic components', () => {
    // Both should be truthy React.lazy objects
    expect(EDITOR_BY_FORMAT['setup']).toBeDefined()
    expect(EDITOR_BY_FORMAT['anti']).toBeDefined()
    expect(typeof EDITOR_BY_FORMAT['setup']).toBe('object')
    expect(typeof EDITOR_BY_FORMAT['anti']).toBe('object')
    // React.lazy components have $$typeof === Symbol(react.lazy)
    const lazyType = Symbol.for('react.lazy')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((EDITOR_BY_FORMAT['setup'] as any).$$typeof).toBe(lazyType)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((EDITOR_BY_FORMAT['anti'] as any).$$typeof).toBe(lazyType)
  })

  it('video and audio have their own real lazy editors (not the image placeholder)', () => {
    const lazyType = Symbol.for('react.lazy')
    expect(EDITOR_BY_FORMAT['video']).toBeDefined()
    expect(EDITOR_BY_FORMAT['audio']).toBeDefined()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((EDITOR_BY_FORMAT['video'] as any).$$typeof).toBe(lazyType)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((EDITOR_BY_FORMAT['audio'] as any).$$typeof).toBe(lazyType)
    // Each format's lazy loader resolves to its own distinct module —
    // asserting inequality catches an accidental revert to sharing ImageEditor.
    expect(EDITOR_BY_FORMAT['video']).not.toBe(EDITOR_BY_FORMAT['image'])
    expect(EDITOR_BY_FORMAT['audio']).not.toBe(EDITOR_BY_FORMAT['image'])
    expect(EDITOR_BY_FORMAT['video']).not.toBe(EDITOR_BY_FORMAT['audio'])
  })
})
