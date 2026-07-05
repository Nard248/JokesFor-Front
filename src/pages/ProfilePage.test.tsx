import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}))

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { username: 'daisy', first_name: 'Daisy' } }),
}))

vi.mock('@/features/profile', () => ({
  useProfile: () => ({ data: undefined }),
  useActivity: () => ({ data: [] }),
  useAchievements: () => ({ data: [] }),
}))

import { ProfilePage } from './ProfilePage'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <ProfilePage />
    </MemoryRouter>,
  )
}

beforeEach(() => vi.clearAllMocks())

describe('ProfilePage — Edit profile navigation', () => {
  it('renders "Edit profile" as a link to the Settings editor (not a dead button)', () => {
    renderPage()
    const editProfile = screen.getByText('Edit profile').closest('a')
    expect(editProfile).not.toBeNull()
    expect(editProfile?.getAttribute('href')).toBe('/settings')
  })

  it('keeps the Settings link working too', () => {
    renderPage()
    const settings = screen.getByText('Settings').closest('a')
    expect(settings?.getAttribute('href')).toBe('/settings')
  })
})
