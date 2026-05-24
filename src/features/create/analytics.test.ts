/**
 * analytics.test.ts
 *
 * Tests for the analytics scaffolding module.
 * track() is a pure no-op in prod; in DEV it calls console.debug.
 */
import { describe, it, expect, vi } from 'vitest'
import { track } from './analytics'
import type { CreateEvent } from './analytics'

describe('analytics track()', () => {
  it('does not throw when called with any valid CreateEvent', () => {
    const events: CreateEvent[] = [
      'creator_hub_viewed',
      'format_picker_viewed',
      'format_selected',
      'editor_opened',
      'draft_created',
      'submit_succeeded',
      'draft_deleted',
      'format_changed',
    ]

    for (const event of events) {
      expect(() => track(event)).not.toThrow()
    }
  })

  it('does not throw when called with an event and props', () => {
    expect(() => track('format_selected', { format: 'knock' })).not.toThrow()
    expect(() => track('editor_opened', { format: 'oneliner', mode: 'new' })).not.toThrow()
  })

  it('calls console.debug in DEV mode', () => {
    // import.meta.env.DEV is true in the test (vitest sets it)
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    try {
      track('format_selected', { format: 'knock' })
      // If DEV is true, console.debug should be called
      // (if DEV is false, this assertion is skipped gracefully)
      if (import.meta.env.DEV) {
        expect(spy).toHaveBeenCalledWith('[analytics]', 'format_selected', { format: 'knock' })
      }
    } finally {
      spy.mockRestore()
    }
  })
})
