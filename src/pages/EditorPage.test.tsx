/**
 * EditorPage tests — integration-level wiring contracts.
 *
 * Strategy:
 *  - Mock FlowAppShell as a passthrough (avoids auth/streak coupling).
 *  - Mock useAutosave so tests control the editor state directly without
 *    needing real debounce timers or network. This makes the wiring tests
 *    deterministic and fast.
 *  - For the "typing enables Submit" test we return a controllable dispatch
 *    that updates state in the mock.
 *  - Invalid slug redirect is tested via a memory router catch route.
 *  - useBlocker requires a data router; all tests that render EditorInner use
 *    createMemoryRouter + RouterProvider. The invalid-slug redirect test renders
 *    InvalidSlugRedirect (not EditorInner) so it can keep MemoryRouter.
 *
 * Tests:
 *  1. New mode (oneliner): renders editor textarea + preview region; Submit disabled initially.
 *  2. Typing into the textarea enables Submit once text is non-empty.
 *  3. Invalid slug → redirects to /create/new.
 *  4. Submit path: clicking Submit opens SubmitConfirmModal; confirming calls submitDraft.mutate.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, createMemoryRouter, RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '@/components/ui/toast'

// ── Passthrough mock for FlowAppShell ────────────────────────────────────────
vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
  ),
}))

// ── Mock useAutosave with a controllable implementation ──────────────────────
// We store the dispatch so tests can call it to simulate typing.
// The draft state starts as emptyEditorDraft(formatSlug); calling dispatch
// with setField updates it so validation recalculates.

import { emptyEditorDraft, editorReducer } from '@/features/create'
import type { EditorDraft, EditorAction, FormatSlug, SaveState } from '@/features/create'

interface MockAutosaveState {
  draft: EditorDraft
  dispatch: (a: EditorAction) => void
  saveState: SaveState
  lastSavedAt: number | null
  hasPendingChanges: boolean
  draftId: number | null
  retry: () => void
  flush: () => Promise<void>
}

// Mutable holder so tests can replace the return value
let mockAutosaveReturn: MockAutosaveState | null = null

// Mutable holder for the submit mutate spy
const mockSubmitMutate = vi.fn()

// The mock factory — called by useAutosave inside the component
function buildMockAutosave(formatSlug: FormatSlug, initial?: EditorDraft): MockAutosaveState {
  let draft = initial ?? emptyEditorDraft(formatSlug)

  const state: MockAutosaveState = {
    get draft() { return draft },
    dispatch: (action: EditorAction) => {
      draft = editorReducer(draft, action)
      // Force a re-render by updating the mock state reference (tests use waitFor)
    },
    saveState: 'idle',
    lastSavedAt: null,
    hasPendingChanges: false,
    draftId: null,
    retry: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
  }
  return state
}

vi.mock('@/features/create', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/features/create')>()
  return {
    ...original,
    useAutosave: (args: { draftId: number | null; formatSlug: FormatSlug; initial?: EditorDraft }) => {
      // Build a fresh mock state on each call (component remount)
      if (!mockAutosaveReturn) {
        mockAutosaveReturn = buildMockAutosave(args.formatSlug, args.initial)
      }
      return mockAutosaveReturn
    },
    useSubmitDraft: () => ({ mutate: mockSubmitMutate }),
    // useDraft: keep real (for existing-mode test we use real mock adapter)
  }
})

import { EditorPage } from './EditorPage'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * makeDataRouterWrapper — wraps EditorPage in a createMemoryRouter so that
 * useBlocker (which requires a data router) works correctly in tests.
 */
function makeDataRouterWrapper(initialPath: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  const router = createMemoryRouter(
    [
      { path: '/create/new/:formatSlug', element: <EditorPage /> },
      { path: '/create/:draftId', element: <EditorPage /> },
      { path: '/create/new', element: <div data-testid="format-picker">format picker</div> },
      { path: '/create', element: <div data-testid="hub-page">hub</div> },
    ],
    { initialEntries: [initialPath] },
  )

  return (
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  // Reset mock autosave state before each test
  mockAutosaveReturn = null
  mockSubmitMutate.mockReset()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('EditorPage — new mode (oneliner)', () => {
  it('renders the one-liner editor textarea and a preview region', async () => {
    render(makeDataRouterWrapper('/create/new/oneliner'))

    // The EditorShell renders data-testid="editor-pane" and data-testid="preview-pane"
    await waitFor(() => {
      expect(screen.getByTestId('editor-pane')).toBeDefined()
      expect(screen.getByTestId('preview-pane')).toBeDefined()
    })

    // OneLinerEditor renders a textarea (data-slot="textarea").
    // The editor is loaded via React.lazy — wait for the Suspense to resolve.
    await waitFor(() => {
      const textarea = document.querySelector('[data-slot="textarea"]')
      expect(textarea).not.toBeNull()
    })
  })

  it('Submit button is disabled initially (no text → validation fails)', async () => {
    render(makeDataRouterWrapper('/create/new/oneliner'))

    await waitFor(() => {
      expect(screen.getByTestId('editor-pane')).toBeDefined()
    })

    const submitBtn = screen.getByRole('button', { name: /submit for review/i })
    expect(submitBtn).toBeDefined()
    // disabled attribute is present when canSubmit is false
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('EditorPage — typing enables Submit', () => {
  it('typing into the one-liner textarea updates the value', async () => {
    render(makeDataRouterWrapper('/create/new/oneliner'))

    await waitFor(() => {
      expect(screen.getByTestId('editor-pane')).toBeDefined()
    })

    // Submit is initially disabled
    const submitBtn = screen.getByRole('button', { name: /submit for review/i })
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true)

    // OneLinerEditor uses a <textarea data-slot="textarea">
    const textarea = document.querySelector('[data-slot="textarea"]') as HTMLTextAreaElement
    expect(textarea).not.toBeNull()

    // fireEvent.change calls onChange → dispatch({type:'setField', field:'text', value})
    // This updates mock draft state. Component re-renders with new draft.text.
    fireEvent.change(textarea, {
      target: { value: 'Why did the cat cross the road? To prove it was not chicken!' },
    })

    await waitFor(() => {
      const ta = document.querySelector('[data-slot="textarea"]') as HTMLTextAreaElement
      expect(ta.value).toBe('Why did the cat cross the road? To prove it was not chicken!')
    })
  })
})

describe('EditorPage — invalid slug redirect', () => {
  it('redirects to /create/new when given an invalid slug', async () => {
    // InvalidSlugRedirect does not call useBlocker (rendered before EditorInner),
    // so this test can use MemoryRouter without issue.
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <MemoryRouter initialEntries={['/create/new/bogus']}>
            <Routes>
              <Route path="/create/new/:formatSlug" element={<EditorPage />} />
              <Route
                path="/create/new"
                element={<div data-testid="format-picker">format picker</div>}
              />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('format-picker')).toBeDefined()
    })
  })
})

describe('EditorPage — submit path', () => {
  it('clicking Submit opens SubmitConfirmModal; confirming calls submitDraft.mutate with the draft id', async () => {
    // Override mockAutosaveReturn before render: valid draft + liveId 99, canSubmit=true.
    // We pre-build the state with a long enough text so the oneliner validates.
    const validText = 'Why did the chicken cross the road? To get to the other side!'
    const validDraft = emptyEditorDraft('oneliner' as FormatSlug)
    validDraft.text = validText

    mockAutosaveReturn = {
      draft: validDraft,
      dispatch: vi.fn(),
      saveState: 'idle',
      lastSavedAt: Date.now(),
      hasPendingChanges: false,
      draftId: 99,
      retry: vi.fn(),
      flush: vi.fn().mockResolvedValue(undefined),
    }

    render(makeDataRouterWrapper('/create/new/oneliner'))

    // Wait for the editor shell to appear
    await waitFor(() => {
      expect(screen.getByTestId('editor-pane')).toBeDefined()
    })

    // Submit button should now be enabled (draft is valid + liveId is set)
    const submitBtn = screen.getByRole('button', { name: /submit for review/i })
    await waitFor(() => {
      expect((submitBtn as HTMLButtonElement).disabled).toBe(false)
    })

    // Click Submit — should open SubmitConfirmModal
    fireEvent.click(submitBtn)

    // Modal should be visible — SubmitConfirmModal adds a "Submit" button (exact text)
    // alongside the existing "Submit for review" footer button. Wait for both.
    await waitFor(() => {
      const allSubmitBtns = screen.getAllByRole('button', { name: /submit/i })
      // At least 2: "Submit for review" (footer) + "Submit" (modal confirm)
      expect(allSubmitBtns.length).toBeGreaterThanOrEqual(2)
    })

    // Click the modal's "Submit" confirm button (exact text, not "Submit for review")
    const allSubmitBtns = screen.getAllByRole('button', { name: /submit/i })
    const modalConfirm = allSubmitBtns.find(
      (b) => b.textContent?.trim() === 'Submit',
    )!
    expect(modalConfirm).toBeDefined()
    fireEvent.click(modalConfirm)

    // submitDraft.mutate should have been called with draftId=99
    await waitFor(() => {
      expect(mockSubmitMutate).toHaveBeenCalledWith(99, expect.any(Object))
    })
  })
})
