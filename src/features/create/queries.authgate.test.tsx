import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// Authenticated-only queries must not fire for a logged-out visitor.
//
// On the PUBLIC /trending page an anonymous visitor triggered
// GET /jokes/my-drafts/, GET /notifications/unread-count/ and
// POST /auth/token/refresh/ x3 -- six 401s and six console errors per page
// view. Anonymous traffic is capped at 100 req/h per IP, so this burned the
// budget in ~16 page views and made the console useless for spotting real
// errors.

const authState = { isAuthenticated: false }
vi.mock('@/features/auth/store', () => ({
  useAuthStore: (sel?: (s: typeof authState) => unknown) =>
    sel ? sel(authState) : authState,
}))

const listDrafts = vi.fn(() => Promise.resolve([]))
vi.mock('./adapter', () => ({
  contentAdapter: { listDrafts: () => listDrafts() },
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  listDrafts.mockClear()
  authState.isAuthenticated = false
})

describe('useDrafts auth gating', () => {
  it('does not request drafts while logged out', async () => {
    const { useDrafts } = await import('./queries')
    renderHook(() => useDrafts(), { wrapper })

    await new Promise((r) => setTimeout(r, 30))
    expect(listDrafts).not.toHaveBeenCalled()
  })

  it('requests drafts once authenticated', async () => {
    authState.isAuthenticated = true
    const { useDrafts } = await import('./queries')
    renderHook(() => useDrafts(), { wrapper })

    await waitFor(() => expect(listDrafts).toHaveBeenCalled())
  })
})
