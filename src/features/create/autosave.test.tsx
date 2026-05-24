/**
 * useAutosave tests.
 *
 * Fake-timer tests: use vi.useFakeTimers({ toFake: ['setTimeout','clearTimeout'] })
 * and vi.advanceTimersByTimeAsync(). After advancing, state is synchronously
 * updated — so we assert directly rather than using waitFor (which itself uses
 * setTimeout and deadlocks with fake timers).
 *
 * Real-timer tests (create/onCreated): use waitFor normally.
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// ── adapter mock ─────────────────────────────────────────────────────────────
vi.mock('@/features/create/adapter', () => ({
  contentAdapter: {
    createDraft: vi.fn(),
    patchDraft: vi.fn(),
    listDrafts: vi.fn(),
    getDraft: vi.fn(),
    submitDraft: vi.fn(),
    deleteDraft: vi.fn(),
  },
}))

import { useAutosave } from './autosave'
import { contentAdapter } from '@/features/create/adapter'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeDraftResult(id: number, format = 'oneliner') {
  return {
    id,
    format,
    status: 'draft',
    text: '',
    setup: '',
    punchline: '',
    lines: null,
    themes: [],
    categories: [],
    cultures: [],
    ageRating: null,
    language: 'en',
    source: 'original',
    lastEditedAt: new Date().toISOString(),
    rejectionReason: '',
    likes: null,
    stats: null,
  }
}

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { wrapper: Wrapper, qc }
}

beforeEach(() => {
  // resetAllMocks clears both call history AND any queued mockImplementationOnce values
  vi.resetAllMocks()
  ;(contentAdapter.createDraft as ReturnType<typeof vi.fn>).mockResolvedValue(makeDraftResult(101))
  ;(contentAdapter.patchDraft as ReturnType<typeof vi.fn>).mockImplementation(async (id: number) =>
    makeDraftResult(id)
  )
})

afterEach(() => {
  vi.useRealTimers()
})

// ── Test 1: First meaningful dispatch creates a draft ─────────────────────────
// Uses real timers — waitFor works here.

describe('useAutosave — new draft creation', () => {
  it('first non-empty dispatch creates a draft and calls onCreated once', async () => {
    const { wrapper } = makeWrapper()
    const onCreated = vi.fn()

    const { result } = renderHook(
      () => useAutosave({ draftId: null, formatSlug: 'oneliner', onCreated }),
      { wrapper }
    )

    expect(result.current.draftId).toBeNull()

    await act(async () => {
      result.current.dispatch({ type: 'setField', field: 'text', value: 'Hello world' })
    })

    await waitFor(
      () => expect(contentAdapter.createDraft).toHaveBeenCalledTimes(1),
      { timeout: 3000 }
    )
    await waitFor(
      () => expect(result.current.draftId).toBe(101),
      { timeout: 3000 }
    )

    expect(onCreated).toHaveBeenCalledWith(101)
    expect(onCreated).toHaveBeenCalledTimes(1)
  })

  it('two rapid dispatches create only one draft (guarded by creatingRef)', async () => {
    const { wrapper } = makeWrapper()
    const onCreated = vi.fn()

    ;(contentAdapter.createDraft as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise<object>((resolve) =>
          setTimeout(() => resolve(makeDraftResult(101)), 20)
        )
    )

    const { result } = renderHook(
      () => useAutosave({ draftId: null, formatSlug: 'oneliner', onCreated }),
      { wrapper }
    )

    await act(async () => {
      result.current.dispatch({ type: 'setField', field: 'text', value: 'First' })
      result.current.dispatch({ type: 'setField', field: 'text', value: 'Second' })
    })

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1), { timeout: 3000 })
    expect(contentAdapter.createDraft).toHaveBeenCalledTimes(1)
  })
})

// ── Test 2: 800ms debounce + PATCH ───────────────────────────────────────────
// Fake timers — assert directly after advanceTimersByTimeAsync (no waitFor).

describe('useAutosave — debounce and PATCH', () => {
  it('advancing 800ms triggers a PATCH and saveState becomes saved', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    const { wrapper } = makeWrapper()

    const { result } = renderHook(
      () => useAutosave({ draftId: 42, formatSlug: 'oneliner' }),
      { wrapper }
    )

    await act(async () => {
      result.current.dispatch({ type: 'setField', field: 'text', value: 'Funny joke' })
    })

    expect(result.current.saveState).toBe('debouncing')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(900)
    })

    expect(result.current.saveState).toBe('saved')
    expect(result.current.lastSavedAt).not.toBeNull()
    expect(contentAdapter.patchDraft).toHaveBeenCalledTimes(1)
  })
})

// ── Test 3: Rapid dispatches collapse + queue semantics ───────────────────────

describe('useAutosave — debounce collapsing', () => {
  it('rapid dispatches collapse to a single PATCH after 800ms', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    const { wrapper } = makeWrapper()

    const { result } = renderHook(
      () => useAutosave({ draftId: 42, formatSlug: 'oneliner' }),
      { wrapper }
    )

    await act(async () => {
      result.current.dispatch({ type: 'setField', field: 'text', value: 'A' })
      result.current.dispatch({ type: 'setField', field: 'text', value: 'AB' })
      result.current.dispatch({ type: 'setField', field: 'text', value: 'ABC' })
      result.current.dispatch({ type: 'setField', field: 'text', value: 'ABCD' })
      result.current.dispatch({ type: 'setField', field: 'text', value: 'ABCDE' })
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(900)
    })

    expect(result.current.saveState).toBe('saved')
    expect(contentAdapter.patchDraft).toHaveBeenCalledTimes(1)
  })

  it('a dispatch during in-flight PATCH enqueues exactly one follow-up', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    let resolveFirst!: () => void
    let resolveSecond!: () => void
    let patchCallCount = 0

    ;(contentAdapter.patchDraft as ReturnType<typeof vi.fn>)
      .mockImplementationOnce((_id: number) =>
        new Promise<object>((resolve) => {
          patchCallCount++
          resolveFirst = () => resolve(makeDraftResult(_id))
        })
      )
      .mockImplementationOnce((_id: number) =>
        new Promise<object>((resolve) => {
          patchCallCount++
          resolveSecond = () => resolve(makeDraftResult(_id))
        })
      )

    const { wrapper } = makeWrapper()

    const { result } = renderHook(
      () => useAutosave({ draftId: 42, formatSlug: 'oneliner' }),
      { wrapper }
    )

    // First dispatch + advance → first PATCH in flight
    await act(async () => {
      result.current.dispatch({ type: 'setField', field: 'text', value: 'First' })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900)
    })
    // Flush microtasks: runPatch() is called fire-and-forget from the timer cb;
    // we need an extra act() cycle for the async function body to execute.
    await act(async () => {})

    expect(patchCallCount).toBe(1)
    expect(result.current.saveState).toBe('saving')

    // Dispatch while PATCH in flight — marks dirty
    await act(async () => {
      result.current.dispatch({ type: 'setField', field: 'text', value: 'Second' })
    })

    // Resolve first PATCH → triggers second
    await act(async () => {
      resolveFirst()
    })
    await act(async () => {})

    expect(patchCallCount).toBe(2)
    expect(result.current.saveState).toBe('saving')

    // Resolve second PATCH
    await act(async () => {
      resolveSecond()
    })
    await act(async () => {})

    expect(result.current.saveState).toBe('saved')
    expect(patchCallCount).toBe(2)
  })
})

// ── Test 4: Error + retry ─────────────────────────────────────────────────────

describe('useAutosave — error and retry', () => {
  it('PATCH failure sets saveState to error, retry() recovers to saved', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    let callCount = 0
    ;(contentAdapter.patchDraft as ReturnType<typeof vi.fn>).mockImplementation(async (id: number) => {
      callCount++
      if (callCount === 1) throw new Error('Network error')
      return makeDraftResult(id)
    })

    const { wrapper } = makeWrapper()

    const { result } = renderHook(
      () => useAutosave({ draftId: 42, formatSlug: 'oneliner' }),
      { wrapper }
    )

    await act(async () => {
      result.current.dispatch({ type: 'setField', field: 'text', value: 'Will fail' })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900)
    })
    // Flush: runPatch is fire-and-forget from timer; need an extra act cycle
    await act(async () => {})

    expect(result.current.saveState).toBe('error')

    await act(async () => {
      result.current.retry()
    })
    await act(async () => {})

    expect(result.current.saveState).toBe('saved')
    expect(callCount).toBe(2)
  })
})

// ── Test 5: hasPendingChanges ─────────────────────────────────────────────────

describe('useAutosave — hasPendingChanges', () => {
  it('is true while debouncing and false after saved', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    const { wrapper } = makeWrapper()

    const { result } = renderHook(
      () => useAutosave({ draftId: 42, formatSlug: 'oneliner' }),
      { wrapper }
    )

    await act(async () => {
      result.current.dispatch({ type: 'setField', field: 'text', value: 'Hello' })
    })

    expect(result.current.hasPendingChanges).toBe(true)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(900)
    })

    expect(result.current.saveState).toBe('saved')
    expect(result.current.hasPendingChanges).toBe(false)
  })

  it('is true while saving (Fix 1: clean in-flight save with empty queue)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    let resolvePatch!: () => void
    ;(contentAdapter.patchDraft as ReturnType<typeof vi.fn>).mockImplementationOnce(
      (_id: number) =>
        new Promise<object>((resolve) => {
          resolvePatch = () => resolve(makeDraftResult(_id))
        })
    )

    const { wrapper } = makeWrapper()
    const { result } = renderHook(
      () => useAutosave({ draftId: 42, formatSlug: 'oneliner' }),
      { wrapper }
    )

    // Trigger dispatch and advance past debounce so PATCH starts
    await act(async () => {
      result.current.dispatch({ type: 'setField', field: 'text', value: 'Hello' })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900)
    })
    await act(async () => {})

    // PATCH is now in-flight with an empty dirty queue
    expect(result.current.saveState).toBe('saving')
    // Fix 1: hasPendingChanges must be true even with empty dirty queue during save
    expect(result.current.hasPendingChanges).toBe(true)

    // Resolve the PATCH
    await act(async () => {
      resolvePatch()
    })
    await act(async () => {})

    expect(result.current.saveState).toBe('saved')
    expect(result.current.hasPendingChanges).toBe(false)
  })
})

// ── Test 6: flush() ───────────────────────────────────────────────────────────

describe('useAutosave — flush', () => {
  it('flush() saves immediately without waiting for debounce timer', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    const { wrapper } = makeWrapper()

    const { result } = renderHook(
      () => useAutosave({ draftId: 42, formatSlug: 'oneliner' }),
      { wrapper }
    )

    await act(async () => {
      result.current.dispatch({ type: 'setField', field: 'text', value: 'Flush me' })
    })

    await act(async () => {
      await result.current.flush()
    })

    expect(result.current.saveState).toBe('saved')
    expect(contentAdapter.patchDraft).toHaveBeenCalledTimes(1)
  })
})

// ── Test 7: in-flight dispatch captured in eventual PATCH body ─────────────────

describe('useAutosave — in-flight dispatch captured in subsequent PATCH', () => {
  it('a dispatch made while a create is in-flight is captured in the eventual PATCH body', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    let resolveCreate!: (v: object) => void
    ;(contentAdapter.createDraft as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () => new Promise<object>((resolve) => { resolveCreate = resolve })
    )

    const { wrapper } = makeWrapper()
    const onCreated = vi.fn()

    const { result } = renderHook(
      () => useAutosave({ draftId: null, formatSlug: 'oneliner', onCreated }),
      { wrapper }
    )

    // First dispatch triggers draft creation
    await act(async () => {
      result.current.dispatch({ type: 'setField', field: 'text', value: 'A' })
    })

    // Second dispatch while create is still in-flight
    await act(async () => {
      result.current.dispatch({ type: 'setField', field: 'text', value: 'AB' })
    })

    // Resolve create → schedulePatch fires → advance past debounce
    await act(async () => {
      resolveCreate(makeDraftResult(101))
    })
    await act(async () => {})

    await act(async () => {
      await vi.advanceTimersByTimeAsync(900)
    })
    await act(async () => {})

    expect(result.current.saveState).toBe('saved')
    expect(contentAdapter.patchDraft).toHaveBeenCalledTimes(1)
    // The PATCH must reflect the latest content ("AB"), not the first ("A")
    const patchCall = (contentAdapter.patchDraft as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(patchCall[1]).toMatchObject({ text: 'AB' })
  })
})

// ── Test 8: flush() does NOT start a second concurrent PATCH ──────────────────

describe('useAutosave — flush race guard (Fix 3)', () => {
  it('flush() while a PATCH is in-flight does NOT start a second concurrent PATCH', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    let resolveFirst!: () => void
    ;(contentAdapter.patchDraft as ReturnType<typeof vi.fn>)
      .mockImplementationOnce((_id: number) =>
        new Promise<object>((resolve) => {
          resolveFirst = () => resolve(makeDraftResult(_id))
        })
      )
      // Second call (queued dirty flush) resolves immediately
      .mockImplementationOnce((_id: number) => Promise.resolve(makeDraftResult(_id)))

    const { wrapper } = makeWrapper()
    const { result } = renderHook(
      () => useAutosave({ draftId: 42, formatSlug: 'oneliner' }),
      { wrapper }
    )

    // Dispatch and advance to start first PATCH
    await act(async () => {
      result.current.dispatch({ type: 'setField', field: 'text', value: 'First' })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900)
    })
    await act(async () => {})

    expect(result.current.saveState).toBe('saving')
    expect(contentAdapter.patchDraft).toHaveBeenCalledTimes(1)

    // Call flush() while first PATCH is still in-flight
    // Fix 3: must NOT start a second PATCH; should only mark dirty
    let flushPromise!: Promise<void>
    await act(async () => {
      flushPromise = result.current.flush()
    })

    // Still only one PATCH call — no race
    expect(contentAdapter.patchDraft).toHaveBeenCalledTimes(1)

    // Resolve the in-flight PATCH — dirty flush should now trigger the second
    await act(async () => {
      resolveFirst()
    })
    await act(async () => {
      await flushPromise
    })
    await act(async () => {})

    // Second PATCH should have fired (from dirty flush in success path)
    expect(contentAdapter.patchDraft).toHaveBeenCalledTimes(2)
    expect(result.current.saveState).toBe('saved')
  })
})

// ── Test 9: error state preserved; retry() recovers with dirty changes ─────────

describe('useAutosave — error no auto-retry (Fix 2)', () => {
  it('a failing PATCH with dirty changes keeps saveState=error (no silent retry)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    let resolveSecond!: (v: object) => void
    let callCount = 0
    ;(contentAdapter.patchDraft as ReturnType<typeof vi.fn>).mockImplementation(
      (_id: number) => {
        callCount++
        if (callCount === 1) return Promise.reject(new Error('Network error'))
        return new Promise<object>((resolve) => { resolveSecond = () => resolve(makeDraftResult(_id)) })
      }
    )

    const { wrapper } = makeWrapper()
    const { result } = renderHook(
      () => useAutosave({ draftId: 42, formatSlug: 'oneliner' }),
      { wrapper }
    )

    // Dispatch and advance to trigger first (failing) PATCH
    await act(async () => {
      result.current.dispatch({ type: 'setField', field: 'text', value: 'Will fail' })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900)
    })
    await act(async () => {})

    expect(result.current.saveState).toBe('error')
    // Fix 2: must stay 'error' — no silent auto-retry after failure
    expect(callCount).toBe(1)

    // Queue a dirty change while in error state
    await act(async () => {
      result.current.dispatch({ type: 'setField', field: 'text', value: 'Recovered' })
    })

    // Retry — should re-run PATCH and succeed
    await act(async () => {
      result.current.retry()
    })
    await act(async () => {
      resolveSecond(makeDraftResult(42))
    })
    await act(async () => {})

    expect(result.current.saveState).toBe('saved')
    expect(callCount).toBe(2)
  })
})
