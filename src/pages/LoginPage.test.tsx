import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

vi.mock('@/features/auth', () => ({
  useLogin: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/features/auth/google-oauth', () => ({
  getGoogleAuthUrl: () => 'https://example.com/oauth',
  clearSignupDob: () => {},
}))

import { LoginPage } from './LoginPage'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>,
  )
}

describe('LoginPage — no fabricated stats', () => {
  it('does not render the invented reader/library/streak metrics', () => {
    renderPage()
    expect(screen.queryByText(/312K daily readers/i)).toBeNull()
    expect(screen.queryByText(/Top 10% of readers/i)).toBeNull()
    expect(screen.queryByText(/14-day streak/i)).toBeNull()
    expect(screen.queryByText(/10K\+ jokes/i)).toBeNull()
  })

  it('replaces the streak nudge with honest copy', () => {
    renderPage()
    expect(screen.getByText('Keep your streak alive.')).toBeTruthy()
    expect(screen.getByText('Sign in to pick up where you left off.')).toBeTruthy()
  })
})
