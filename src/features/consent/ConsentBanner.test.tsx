import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

// Mock initAnalytics to prevent any Firebase calls
vi.mock('@/lib/firebase', () => ({
  initAnalytics: vi.fn(async () => null),
  isAnalyticsInitialized: vi.fn(() => false),
}))

// Mock auth store — anon user by default (no DOB)
vi.mock('@/features/auth/store', () => ({
  useAuthStore: Object.assign(
    vi.fn(() => ({ user: null })),
    { getState: vi.fn(() => ({ user: null })) },
  ),
}))

beforeEach(() => {
  localStorage.clear()
})

import { ConsentBanner } from './ConsentBanner'

function renderBanner() {
  return render(
    <MemoryRouter>
      <ConsentBanner />
    </MemoryRouter>,
  )
}

describe('ConsentBanner', () => {
  it('renders Accept and Reject buttons when no stored decision exists', () => {
    renderBanner()
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument()
  })

  it('renders nothing when a current-version decision is already stored', () => {
    localStorage.setItem(
      'jokesfor-consent',
      JSON.stringify({ version: 1, analytics: true, ts: Date.now() }),
    )
    const { container } = renderBanner()
    expect(container).toBeEmptyDOMElement()
  })

  it('clicking Accept hides the banner and persists the decision', async () => {
    const user = userEvent.setup()
    renderBanner()
    await user.click(screen.getByRole('button', { name: /accept/i }))
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument()
    const stored = JSON.parse(localStorage.getItem('jokesfor-consent')!)
    expect(stored.analytics).toBe(true)
  })

  it('clicking Reject hides the banner and persists the decision', async () => {
    const user = userEvent.setup()
    renderBanner()
    await user.click(screen.getByRole('button', { name: /reject/i }))
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument()
    const stored = JSON.parse(localStorage.getItem('jokesfor-consent')!)
    expect(stored.analytics).toBe(false)
  })

  it('includes a link to /cookie-policy', () => {
    renderBanner()
    const link = screen.getByRole('link', { name: /cookie policy/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/cookie-policy')
  })
})
