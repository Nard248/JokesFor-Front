import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// GET /users/me/taste-profile/ is authenticated-only. The public joke detail
// page (where every shared link lands) rendered "Why you got this one" for
// anonymous visitors, which fired it unconditionally: two 401s, three token
// refresh attempts and five console errors per anonymous view.

const authState = { isAuthenticated: false }
vi.mock('@/features/auth/store', () => ({
  useAuthStore: (sel?: (s: typeof authState) => unknown) =>
    sel ? sel(authState) : authState,
}))

const tasteProfile = vi.fn((period: string) => Promise.resolve({ data: { period } }))
vi.mock('@/lib/api', () => ({
  insightsApi: { tasteProfile: (period: string) => tasteProfile(period) },
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  tasteProfile.mockClear()
  authState.isAuthenticated = false
})

describe('useTasteProfile auth gating', () => {
  it('does not request the taste profile while logged out', async () => {
    const { useTasteProfile } = await import('./api')
    renderHook(() => useTasteProfile('month'), { wrapper })

    await new Promise((r) => setTimeout(r, 30))
    expect(tasteProfile).not.toHaveBeenCalled()
  })

  it('requests the taste profile once authenticated', async () => {
    authState.isAuthenticated = true
    const { useTasteProfile } = await import('./api')
    renderHook(() => useTasteProfile('month'), { wrapper })

    await waitFor(() => expect(tasteProfile).toHaveBeenCalledWith('month'))
  })
})
