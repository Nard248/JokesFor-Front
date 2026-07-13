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

// Mutable fixtures so each test can control what the profile hooks return.
let profileData: unknown = undefined
let activityData: unknown[] = []
let achievementsData: unknown[] = []

vi.mock('@/features/profile', () => ({
  useProfile: () => ({ data: profileData }),
  useActivity: () => ({ data: activityData }),
  useAchievements: () => ({ data: achievementsData }),
}))

import { ProfilePage } from './ProfilePage'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <ProfilePage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  profileData = undefined
  activityData = []
  achievementsData = []
})

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

describe('ProfilePage — no fabricated stats', () => {
  it('shows honest placeholders (not the old invented 42 / 5 / 14) when profile has not loaded', () => {
    profileData = undefined
    renderPage()
    // The previously-hardcoded fabricated counts must never render.
    expect(screen.queryByText('42')).toBeNull()
    expect(screen.queryByText('5')).toBeNull()
    expect(screen.queryByText('14')).toBeNull()
    // Each stat renders an honest em-dash instead.
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3)
  })
})

describe('ProfilePage — renders real profile data', () => {
  it('renders the real display name, handle, bio, member-since and real stat counts', () => {
    profileData = {
      name: 'Pun Queen',
      username: '@punqueen',
      email: 'pq@example.com',
      bio: 'Certified groan-maker.',
      memberSince: '2026-01-15',
      isPremium: true,
      stats: { jokesSaved: 9, jokesShared: 4, collections: 2, daysActive: 30 },
      humorDNA: [],
      avatarUrl: null,
    }
    renderPage()
    expect(screen.getByText('Pun Queen')).toBeTruthy()
    expect(screen.getByText('@punqueen')).toBeTruthy()
    expect(screen.getByText('Certified groan-maker.')).toBeTruthy()
    // Real counts render; the mock "Laugh Master" fixture never leaks through.
    expect(screen.getByText('9')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByText('30')).toBeTruthy()
    expect(screen.queryByText('Laugh Master')).toBeNull()
  })
})
