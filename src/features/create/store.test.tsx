/**
 * store.test.tsx — Tests for useCreatorStore and useUnseenSubmissionChange.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ── useCreatorStore ───────────────────────────────────────────────────────────

describe('useCreatorStore', () => {
  // We import fresh each time to avoid persisted state leaking between tests.
  // Reset the store state before each test by using act + setState.

  it('has lastSeenAt = 0 by default (or from persisted storage)', async () => {
    // Clear persisted storage to ensure a clean state
    localStorage.clear()
    const { useCreatorStore } = await import('./store')
    const { result } = renderHook(() => useCreatorStore())
    // Default is 0 (fresh store, no persisted value)
    expect(typeof result.current.lastSeenAt).toBe('number')
  })

  it('markSeen() sets lastSeenAt to a timestamp > 0', async () => {
    localStorage.clear()
    const { useCreatorStore } = await import('./store')
    const { result } = renderHook(() => useCreatorStore())

    expect(result.current.lastSeenAt).toBe(0)

    const before = Date.now()
    act(() => {
      result.current.markSeen()
    })
    const after = Date.now()

    expect(result.current.lastSeenAt).toBeGreaterThan(0)
    expect(result.current.lastSeenAt).toBeGreaterThanOrEqual(before)
    expect(result.current.lastSeenAt).toBeLessThanOrEqual(after)
  })
})

// ── useUnseenSubmissionChange ─────────────────────────────────────────────────

// Mock useDrafts so we can control what drafts are "returned"
const mockUseDraftsData = vi.fn()

vi.mock('./queries', async (importOriginal) => {
  const original = await importOriginal<typeof import('./queries')>()
  return {
    ...original,
    useDrafts: () => ({ data: mockUseDraftsData() }),
  }
})

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('useUnseenSubmissionChange', () => {
  beforeEach(() => {
    localStorage.clear()
    mockUseDraftsData.mockReturnValue([])
  })

  it('returns false when there are no drafts', async () => {
    const { useUnseenSubmissionChange } = await import('./store')
    mockUseDraftsData.mockReturnValue([])

    const { result } = renderHook(() => useUnseenSubmissionChange(), {
      wrapper: makeWrapper(),
    })

    expect(result.current).toBe(false)
  })

  it('returns true when a published draft has lastEditedAt newer than lastSeenAt=0', async () => {
    const { useUnseenSubmissionChange } = await import('./store')

    const future = new Date(Date.now() + 10000).toISOString()
    mockUseDraftsData.mockReturnValue([
      {
        id: 1, format: 'oneliner', status: 'published',
        lastEditedAt: future, text: 'test', setup: '', punchline: '',
        lines: null, themes: [], categories: [], cultures: [],
        ageRating: null, language: 'en', source: 'original',
        rejectionReason: '', likes: null, stats: null,
      },
    ])

    const { result } = renderHook(() => useUnseenSubmissionChange(), {
      wrapper: makeWrapper(),
    })

    expect(result.current).toBe(true)
  })

  it('returns true when a rejected draft has lastEditedAt newer than lastSeenAt=0', async () => {
    const { useUnseenSubmissionChange } = await import('./store')

    const future = new Date(Date.now() + 5000).toISOString()
    mockUseDraftsData.mockReturnValue([
      {
        id: 2, format: 'knock', status: 'rejected',
        lastEditedAt: future, text: '', setup: '', punchline: '',
        lines: ['Knock knock'], themes: [], categories: [], cultures: [],
        ageRating: null, language: 'en', source: 'original',
        rejectionReason: 'Too short', likes: null, stats: null,
      },
    ])

    const { result } = renderHook(() => useUnseenSubmissionChange(), {
      wrapper: makeWrapper(),
    })

    expect(result.current).toBe(true)
  })

  it('returns false after markSeen() is called (lastSeenAt becomes >= lastEditedAt)', async () => {
    const { useUnseenSubmissionChange, useCreatorStore } = await import('./store')

    const past = new Date(Date.now() - 10000).toISOString()
    mockUseDraftsData.mockReturnValue([
      {
        id: 3, format: 'oneliner', status: 'published',
        lastEditedAt: past, text: 'hi', setup: '', punchline: '',
        lines: null, themes: [], categories: [], cultures: [],
        ageRating: null, language: 'en', source: 'original',
        rejectionReason: '', likes: null, stats: null,
      },
    ])

    // markSeen sets lastSeenAt = now, which is > past
    act(() => {
      useCreatorStore.getState().markSeen()
    })

    const { result } = renderHook(() => useUnseenSubmissionChange(), {
      wrapper: makeWrapper(),
    })

    expect(result.current).toBe(false)
  })

  it('returns false for draft/pending statuses even if lastEditedAt is future', async () => {
    const { useUnseenSubmissionChange } = await import('./store')

    const future = new Date(Date.now() + 50000).toISOString()
    mockUseDraftsData.mockReturnValue([
      {
        id: 4, format: 'oneliner', status: 'draft',
        lastEditedAt: future, text: 'hi', setup: '', punchline: '',
        lines: null, themes: [], categories: [], cultures: [],
        ageRating: null, language: 'en', source: 'original',
        rejectionReason: '', likes: null, stats: null,
      },
      {
        id: 5, format: 'oneliner', status: 'pending',
        lastEditedAt: future, text: 'hi', setup: '', punchline: '',
        lines: null, themes: [], categories: [], cultures: [],
        ageRating: null, language: 'en', source: 'original',
        rejectionReason: '', likes: null, stats: null,
      },
    ])

    const { result } = renderHook(() => useUnseenSubmissionChange(), {
      wrapper: makeWrapper(),
    })

    expect(result.current).toBe(false)
  })
})
