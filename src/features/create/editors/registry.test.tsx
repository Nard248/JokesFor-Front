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
})
