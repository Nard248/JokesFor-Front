import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { BillingPlan, MySubscription, BillingEntitlements } from '@/features/billing'

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
  ),
}))

const mockUseBillingPlans = vi.fn()
const mockUseMySubscription = vi.fn()
const mockUseEntitlements = vi.fn()
const mockUseCreateCheckoutSession = vi.fn()
const mockUseCreatePortalSession = vi.fn()

vi.mock('@/features/billing', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/features/billing')>()
  return {
    ...original,
    useBillingPlans: () => mockUseBillingPlans(),
    useMySubscription: () => mockUseMySubscription(),
    useEntitlements: () => mockUseEntitlements(),
    useCreateCheckoutSession: () => mockUseCreateCheckoutSession(),
    useCreatePortalSession: () => mockUseCreatePortalSession(),
  }
})

// ── Fixtures ───────────────────────────────────────────────────────────────

const MOCK_PLANS: BillingPlan[] = [
  {
    slug: 'free',
    name: 'Free',
    description: 'The basics, forever free.',
    interval: null,
    amount_cents: 0,
    currency: 'usd',
    amount_display: 'Free',
    features: { creator_analytics: false, daily_joke_preview: false, mature_content_addon: false },
    limits: { mystery_box_rolls_per_day: 1, submissions_per_day: 2, daily_jokes_per_day: 3, daily_joke_history_days: 7 },
    sort_order: 0,
  },
  {
    slug: 'supporter',
    name: 'Supporter',
    description: 'More jokes, more laughs.',
    interval: 'month',
    amount_cents: 499,
    currency: 'usd',
    amount_display: '$4.99 / mo',
    features: { creator_analytics: false, daily_joke_preview: true, mature_content_addon: true },
    limits: { mystery_box_rolls_per_day: 5, submissions_per_day: 10, daily_jokes_per_day: 10, daily_joke_history_days: 30 },
    sort_order: 1,
  },
  {
    slug: 'creator_pro',
    name: 'Creator Pro',
    description: 'For comedians who mean business.',
    interval: 'month',
    amount_cents: 1299,
    currency: 'usd',
    amount_display: '$12.99 / mo',
    features: { creator_analytics: true, daily_joke_preview: true, mature_content_addon: true },
    limits: { mystery_box_rolls_per_day: null, submissions_per_day: null, daily_jokes_per_day: null, daily_joke_history_days: null },
    sort_order: 2,
  },
]

const MOCK_SUBSCRIPTION_FREE: MySubscription = {
  plan_slug: 'free',
  plan_name: 'Free',
  status: 'free',
  current_period_end: null,
  cancel_at_period_end: false,
  stripe_customer_id: null,
}

const MOCK_SUBSCRIPTION_ACTIVE: MySubscription = {
  plan_slug: 'supporter',
  plan_name: 'Supporter',
  status: 'active',
  current_period_end: '2026-07-19T00:00:00Z',
  cancel_at_period_end: false,
  stripe_customer_id: 'cus_mock123',
}

const MOCK_ENTITLEMENTS: BillingEntitlements = {
  plan: 'free',
  features: {
    creator_analytics: false,
    daily_joke_preview: false,
    mature_content_addon: false,
  },
  limits: {
    mystery_box_rolls_per_day: 1,
    submissions_per_day: 2,
    daily_jokes_per_day: 3,
    daily_joke_history_days: 7,
  },
}

// ── Helpers ────────────────────────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

function setupDefaults() {
  mockUseBillingPlans.mockReturnValue({ data: MOCK_PLANS, isLoading: false, isError: false })
  mockUseMySubscription.mockReturnValue({ data: MOCK_SUBSCRIPTION_FREE, isLoading: false })
  mockUseEntitlements.mockReturnValue({ data: MOCK_ENTITLEMENTS, isLoading: false })
  mockUseCreateCheckoutSession.mockReturnValue({ mutate: vi.fn(), isPending: false, variables: undefined })
  mockUseCreatePortalSession.mockReturnValue({ mutate: vi.fn(), isPending: false })
}

// ── Import page AFTER mocks ────────────────────────────────────────────────
import { BillingPage } from './BillingPage'

// ── Tests ──────────────────────────────────────────────────────────────────

describe('BillingPage', () => {
  beforeEach(() => {
    setupDefaults()
  })

  describe('plans rendering', () => {
    it('renders all plan names', () => {
      render(<BillingPage />, { wrapper: makeWrapper() })
      // "Free" appears in both plan name and price display; use getAllByText
      expect(screen.getAllByText('Free').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByTestId('plan-card-free')).toBeDefined()
      expect(screen.getByTestId('plan-card-supporter')).toBeDefined()
      expect(screen.getByTestId('plan-card-creator_pro')).toBeDefined()
    })

    it('renders amount_display for each plan without hardcoding prices', () => {
      render(<BillingPage />, { wrapper: makeWrapper() })
      expect(screen.getByTestId('plan-price-free').textContent).toBe('Free')
      expect(screen.getByTestId('plan-price-supporter').textContent).toBe('$4.99 / mo')
      expect(screen.getByTestId('plan-price-creator_pro').textContent).toBe('$12.99 / mo')
    })

    it('shows "Current plan" badge on the active plan', () => {
      render(<BillingPage />, { wrapper: makeWrapper() })
      expect(screen.getByTestId('current-badge-free')).toBeDefined()
      expect(screen.queryByTestId('current-badge-supporter')).toBeNull()
      expect(screen.queryByTestId('current-badge-creator_pro')).toBeNull()
    })

    it('highlights supporter as current when subscription is active', () => {
      mockUseMySubscription.mockReturnValue({ data: MOCK_SUBSCRIPTION_ACTIVE, isLoading: false })
      render(<BillingPage />, { wrapper: makeWrapper() })
      expect(screen.getByTestId('current-badge-supporter')).toBeDefined()
      expect(screen.queryByTestId('current-badge-free')).toBeNull()
    })

    it('shows subscribe buttons on non-current plans', () => {
      render(<BillingPage />, { wrapper: makeWrapper() })
      expect(screen.getByTestId('subscribe-btn-supporter')).toBeDefined()
      expect(screen.getByTestId('subscribe-btn-creator_pro')).toBeDefined()
      // Current plan shows "You're on this plan" text instead
      expect(screen.queryByTestId('subscribe-btn-free')).toBeNull()
    })

    it('renders plans grid', () => {
      render(<BillingPage />, { wrapper: makeWrapper() })
      expect(screen.getByTestId('plans-grid')).toBeDefined()
    })
  })

  describe('loading state', () => {
    it('shows skeletons when loading', () => {
      mockUseBillingPlans.mockReturnValue({ data: undefined, isLoading: true, isError: false })
      mockUseMySubscription.mockReturnValue({ data: undefined, isLoading: true })
      mockUseEntitlements.mockReturnValue({ data: undefined, isLoading: true })
      render(<BillingPage />, { wrapper: makeWrapper() })
      const skeletons = document.querySelectorAll('[data-slot="skeleton"]')
      expect(skeletons.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('subscribe flow', () => {
    it('calls checkout mutation when subscribe button is clicked', async () => {
      const mutateSpy = vi.fn()
      mockUseCreateCheckoutSession.mockReturnValue({ mutate: mutateSpy, isPending: false, variables: undefined })
      render(<BillingPage />, { wrapper: makeWrapper() })
      const btn = screen.getByTestId('subscribe-btn-supporter')
      fireEvent.click(btn)
      expect(mutateSpy).toHaveBeenCalledWith(
        'supporter',
        expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
      )
    })

    it('shows demo message on successful checkout in mock mode', async () => {
      const mutateSpy = vi.fn().mockImplementation((_slug, { onSuccess }) => {
        onSuccess({ url: 'https://checkout.stripe.com/demo?plan=supporter' })
      })
      mockUseCreateCheckoutSession.mockReturnValue({ mutate: mutateSpy, isPending: false, variables: undefined })
      render(<BillingPage />, { wrapper: makeWrapper() })
      fireEvent.click(screen.getByTestId('subscribe-btn-supporter'))
      await waitFor(() => {
        expect(screen.getByTestId('demo-message')).toBeDefined()
        expect(screen.getByTestId('demo-message').textContent).toContain('(demo)')
      })
    })
  })

  describe('dormant / billing unavailable state', () => {
    it('shows billing unavailable banner on 503 checkout error', async () => {
      const mutateSpy = vi.fn().mockImplementation((_slug, { onError }) => {
        onError({ response: { status: 503 } })
      })
      mockUseCreateCheckoutSession.mockReturnValue({ mutate: mutateSpy, isPending: false, variables: undefined })
      render(<BillingPage />, { wrapper: makeWrapper() })
      fireEvent.click(screen.getByTestId('subscribe-btn-supporter'))
      await waitFor(() => {
        expect(screen.getByTestId('billing-unavailable')).toBeDefined()
        expect(screen.getByTestId('billing-unavailable').textContent).toContain("Billing isn't enabled yet")
      })
    })

    it('shows billing unavailable banner on 503 portal error', async () => {
      mockUseMySubscription.mockReturnValue({ data: MOCK_SUBSCRIPTION_ACTIVE, isLoading: false })
      const portalSpy = vi.fn().mockImplementation((_void, { onError }) => {
        onError({ response: { status: 503 } })
      })
      mockUseCreatePortalSession.mockReturnValue({ mutate: portalSpy, isPending: false })
      render(<BillingPage />, { wrapper: makeWrapper() })
      fireEvent.click(screen.getByTestId('manage-billing-btn'))
      await waitFor(() => {
        expect(screen.getByTestId('billing-unavailable')).toBeDefined()
      })
    })
  })

  describe('entitlements panel', () => {
    it('renders entitlements panel', () => {
      render(<BillingPage />, { wrapper: makeWrapper() })
      expect(screen.getByTestId('entitlements-panel')).toBeDefined()
    })

    it('renders feature entitlements with correct enabled/disabled state', () => {
      render(<BillingPage />, { wrapper: makeWrapper() })
      expect(screen.getByTestId('entitlement-feature-creator_analytics')).toBeDefined()
      expect(screen.getByTestId('entitlement-feature-daily_joke_preview')).toBeDefined()
      expect(screen.getByTestId('entitlement-feature-mature_content_addon')).toBeDefined()
    })

    it('renders limit entitlements with values', () => {
      render(<BillingPage />, { wrapper: makeWrapper() })
      expect(screen.getByTestId('entitlement-limit-mystery_box_rolls_per_day')).toBeDefined()
      expect(screen.getByTestId('entitlement-limit-submissions_per_day')).toBeDefined()
      expect(screen.getByTestId('entitlement-limit-daily_jokes_per_day')).toBeDefined()
      expect(screen.getByTestId('entitlement-limit-daily_joke_history_days')).toBeDefined()
      // Free plan: rolls/day = 1
      expect(screen.getByTestId('entitlement-limit-mystery_box_rolls_per_day').textContent).toContain('1')
    })

    it('shows null limits as infinity symbol', () => {
      mockUseEntitlements.mockReturnValue({
        data: {
          ...MOCK_ENTITLEMENTS,
          plan: 'creator_pro',
          limits: {
            mystery_box_rolls_per_day: null,
            submissions_per_day: null,
            daily_jokes_per_day: null,
            daily_joke_history_days: null,
          },
        },
        isLoading: false,
      })
      render(<BillingPage />, { wrapper: makeWrapper() })
      const rollsCell = screen.getByTestId('entitlement-limit-mystery_box_rolls_per_day')
      expect(rollsCell.textContent).toContain('∞')
    })
  })

  describe('manage billing button', () => {
    it('does NOT show manage billing button for free plan', () => {
      render(<BillingPage />, { wrapper: makeWrapper() })
      expect(screen.queryByTestId('manage-billing-btn')).toBeNull()
    })

    it('shows manage billing button when subscription is active', () => {
      mockUseMySubscription.mockReturnValue({ data: MOCK_SUBSCRIPTION_ACTIVE, isLoading: false })
      render(<BillingPage />, { wrapper: makeWrapper() })
      expect(screen.getByTestId('manage-billing-btn')).toBeDefined()
    })

    it('shows demo message on successful portal session in mock mode', async () => {
      mockUseMySubscription.mockReturnValue({ data: MOCK_SUBSCRIPTION_ACTIVE, isLoading: false })
      const portalSpy = vi.fn().mockImplementation((_void, { onSuccess }) => {
        onSuccess({ url: 'https://billing.stripe.com/demo/portal' })
      })
      mockUseCreatePortalSession.mockReturnValue({ mutate: portalSpy, isPending: false })
      render(<BillingPage />, { wrapper: makeWrapper() })
      fireEvent.click(screen.getByTestId('manage-billing-btn'))
      await waitFor(() => {
        expect(screen.getByTestId('demo-message').textContent).toContain('(demo)')
        expect(screen.getByTestId('demo-message').textContent).toContain('Portal')
      })
    })

    it('surfaces a renewal date in the manage card for an active subscription', () => {
      mockUseMySubscription.mockReturnValue({ data: MOCK_SUBSCRIPTION_ACTIVE, isLoading: false })
      render(<BillingPage />, { wrapper: makeWrapper() })
      expect(screen.getByText(/renews/i)).toBeDefined()
    })

    it('surfaces a cancellation notice when cancel_at_period_end is set', () => {
      mockUseMySubscription.mockReturnValue({
        data: { ...MOCK_SUBSCRIPTION_ACTIVE, cancel_at_period_end: true },
        isLoading: false,
      })
      render(<BillingPage />, { wrapper: makeWrapper() })
      expect(screen.getByText(/cancels on/i)).toBeDefined()
    })
  })

  describe('empty / no plans state', () => {
    it('shows an intentional "coming soon" card when the backend returns zero plans', () => {
      mockUseBillingPlans.mockReturnValue({ data: [], isLoading: false, isError: false })
      render(<BillingPage />, { wrapper: makeWrapper() })
      expect(screen.getByTestId('no-plans')).toBeDefined()
      expect(screen.queryByTestId('plans-grid')).toBeNull()
    })
  })

  describe('placeholder plan resilience', () => {
    it('renders a fallback price for a plan with a blank amount_display', () => {
      mockUseBillingPlans.mockReturnValue({
        data: [{ ...MOCK_PLANS[1], amount_display: '' }],
        isLoading: false,
        isError: false,
      })
      render(<BillingPage />, { wrapper: makeWrapper() })
      expect(screen.getByTestId('plan-price-supporter').textContent).toBe('—')
    })
  })
})
