import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockCheckoutMutate = vi.fn()
vi.mock('./api', async (importOriginal) => {
  const original = await importOriginal<typeof import('./api')>()
  return {
    ...original,
    useCreateTipCheckout: () => ({ mutate: mockCheckoutMutate, isPending: false, isError: false, error: null }),
  }
})

const mockUseAuthStore = vi.fn()
vi.mock('@/features/auth/store', () => ({
  useAuthStore: (selector: (state: { isAuthenticated: boolean }) => unknown) => mockUseAuthStore(selector),
}))

const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => {
  const original = await importOriginal<typeof import('react-router')>()
  return { ...original, useNavigate: () => mockNavigate }
})

const mockToast = vi.fn()
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ toast: mockToast }) }))

import { TipButton } from './TipButton'

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAuthStore.mockImplementation((selector: (state: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: true }),
  )
})

describe('TipButton', () => {
  it('returns null when isFollowing is null (self-view or anon)', () => {
    const { container } = render(<TipButton creatorId={7} isFollowing={null} />, { wrapper: makeWrapper() })
    expect(container.firstChild).toBeNull()
  })

  it('renders a Tip button for a non-self, known-follow-state viewer', () => {
    render(<TipButton creatorId={7} isFollowing={false} />, { wrapper: makeWrapper() })
    expect(screen.getByTestId('tip-button')).toBeDefined()
  })

  it('clicking Tip when unauthenticated navigates to /login instead of opening the modal', () => {
    mockUseAuthStore.mockImplementation((selector: (state: { isAuthenticated: boolean }) => unknown) =>
      selector({ isAuthenticated: false }),
    )
    render(<TipButton creatorId={7} isFollowing={false} />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByTestId('tip-button'))
    expect(mockNavigate).toHaveBeenCalledWith('/login')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  describe('tier modal', () => {
    it('clicking Tip opens a modal with all 4 fixed tiers', () => {
      render(<TipButton creatorId={7} isFollowing={false} />, { wrapper: makeWrapper() })
      fireEvent.click(screen.getByTestId('tip-button'))
      expect(screen.getByRole('dialog')).toBeDefined()
      expect(screen.getByTestId('tip-tier-100').textContent).toBe('$1')
      expect(screen.getByTestId('tip-tier-300').textContent).toBe('$3')
      expect(screen.getByTestId('tip-tier-500').textContent).toBe('$5')
      expect(screen.getByTestId('tip-tier-1000').textContent).toBe('$10')
    })

    it('picking a tier calls the checkout mutation with creator_id + amount_cents', () => {
      render(<TipButton creatorId={7} isFollowing={false} />, { wrapper: makeWrapper() })
      fireEvent.click(screen.getByTestId('tip-button'))
      fireEvent.click(screen.getByTestId('tip-tier-500'))
      expect(mockCheckoutMutate).toHaveBeenCalledWith(
        { creator_id: 7, joke_id: undefined, amount_cents: 500 },
        expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
      )
    })

    it('includes joke_id when tipping from a joke-detail context', () => {
      render(<TipButton creatorId={7} isFollowing={false} jokeId={42} />, { wrapper: makeWrapper() })
      fireEvent.click(screen.getByTestId('tip-button'))
      fireEvent.click(screen.getByTestId('tip-tier-100'))
      expect(mockCheckoutMutate).toHaveBeenCalledWith(
        { creator_id: 7, joke_id: 42, amount_cents: 100 },
        expect.any(Object),
      )
    })
  })

  describe('checkout success', () => {
    // In this test env VITE_API_URL is unset, so the component runs in
    // USE_MOCKS mode (mirrors BillingPage's handleSubscribe) and shows a demo
    // toast instead of a real window.location redirect.
    it('shows a demo toast and closes the modal on success', async () => {
      mockCheckoutMutate.mockImplementation((_input, { onSuccess }) => {
        onSuccess({ checkout_url: 'https://checkout.stripe.com/demo?tip=300', tip_id: 1 })
      })
      render(<TipButton creatorId={7} isFollowing={false} />, { wrapper: makeWrapper() })
      fireEvent.click(screen.getByTestId('tip-button'))
      fireEvent.click(screen.getByTestId('tip-tier-300'))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ message: expect.stringContaining('$3 tip') }),
        )
      })
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  describe('dormant (503 billing_unavailable)', () => {
    it('flips to a disabled "coming soon" state and never leaves a broken checkout', async () => {
      mockCheckoutMutate.mockImplementation((_input, { onError }) => {
        onError({ response: { status: 503 } })
      })
      render(<TipButton creatorId={7} isFollowing={false} />, { wrapper: makeWrapper() })
      fireEvent.click(screen.getByTestId('tip-button'))
      fireEvent.click(screen.getByTestId('tip-tier-500'))

      await waitFor(() => {
        expect(screen.getByTestId('tip-button-dormant')).toBeDefined()
      })
      const dormantBtn = screen.getByTestId('tip-button-dormant') as HTMLButtonElement
      expect(dormantBtn.disabled).toBe(true)
      expect(dormantBtn.textContent).toContain('coming soon')
      // Modal closed — no broken checkout left open.
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining("aren't available yet") }),
      )
    })

    it('a non-503 error keeps the button live and shows an inline error instead', async () => {
      mockCheckoutMutate.mockImplementation((_input, { onError }) => {
        onError({ response: { status: 500 } })
      })
      render(<TipButton creatorId={7} isFollowing={false} />, { wrapper: makeWrapper() })
      fireEvent.click(screen.getByTestId('tip-button'))
      fireEvent.click(screen.getByTestId('tip-tier-500'))

      expect(screen.queryByTestId('tip-button-dormant')).toBeNull()
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Could not start checkout') }),
      )
    })
  })
})
