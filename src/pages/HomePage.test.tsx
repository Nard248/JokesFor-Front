import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}))

vi.mock('@/components/FlowJokeCard', () => ({
  FlowJokeCard: () => <div data-testid="joke-card" />,
}))

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ isAuthenticated: false, user: null }),
}))

import { HomePage } from './HomePage'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage — no fabricated stats', () => {
  it('does not render the invented "312K daily readers" claim', () => {
    renderPage()
    expect(screen.queryByText(/312K daily readers/i)).toBeNull()
    expect(screen.queryByText(/daily readers/i)).toBeNull()
  })

  it('keeps an honest brand eyebrow instead', () => {
    renderPage()
    expect(screen.getByText(/A new joke every morning/i)).toBeTruthy()
  })
})
