import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock follows feature hooks (useFollow and useUnfollow)
const mockFollowMutate = vi.fn()
const mockUnfollowMutate = vi.fn()

vi.mock('@/features/follows/api', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/features/follows/api')>()
  return {
    ...original,
    useFollow: () => ({ mutate: mockFollowMutate, isPending: false }),
    useUnfollow: () => ({ mutate: mockUnfollowMutate, isPending: false }),
  }
})

// Mock auth store
const mockUseAuthStore = vi.fn()
vi.mock('@/features/auth/store', () => ({
  useAuthStore: (selector: (state: { isAuthenticated: boolean }) => unknown) =>
    mockUseAuthStore(selector),
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => {
  const original = await importOriginal<typeof import('react-router')>()
  return {
    ...original,
    useNavigate: () => mockNavigate,
  }
})

import { FollowButton } from './FollowButton'

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
  // Default: authenticated
  mockUseAuthStore.mockImplementation((selector: (state: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: true })
  )
})

describe('FollowButton', () => {
  it('renders Follow button when not following', () => {
    render(
      <FollowButton creatorId={7} isFollowing={false} followerCount={42} />,
      { wrapper: makeWrapper() }
    )
    const btn = screen.getByRole('button')
    expect(btn.textContent).toBe('Follow')
    expect(btn.getAttribute('aria-pressed')).toBe('false')
  })

  it('renders Following button when following', () => {
    render(
      <FollowButton creatorId={7} isFollowing={true} followerCount={43} />,
      { wrapper: makeWrapper() }
    )
    const btn = screen.getByRole('button')
    expect(btn.textContent).toBe('Following')
    expect(btn.getAttribute('aria-pressed')).toBe('true')
  })

  it('returns null when is_following is null (self-view)', () => {
    const { container } = render(
      <FollowButton creatorId={1} isFollowing={null} followerCount={0} />,
      { wrapper: makeWrapper() }
    )
    expect(container.firstChild).toBeNull()
  })

  it('clicking Follow when unauthenticated navigates to /login', () => {
    mockUseAuthStore.mockImplementation((selector: (state: { isAuthenticated: boolean }) => unknown) =>
      selector({ isAuthenticated: false })
    )
    render(
      <FollowButton creatorId={7} isFollowing={false} followerCount={42} />,
      { wrapper: makeWrapper() }
    )
    fireEvent.click(screen.getByRole('button'))
    expect(mockNavigate).toHaveBeenCalledWith('/login')
    expect(mockFollowMutate).not.toHaveBeenCalled()
  })

  it('clicking Follow when authenticated calls follow mutation', () => {
    render(
      <FollowButton creatorId={7} isFollowing={false} followerCount={42} />,
      { wrapper: makeWrapper() }
    )
    fireEvent.click(screen.getByRole('button'))
    expect(mockFollowMutate).toHaveBeenCalledWith(7)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('clicking Following when authenticated calls unfollow mutation', () => {
    render(
      <FollowButton creatorId={7} isFollowing={true} followerCount={43} />,
      { wrapper: makeWrapper() }
    )
    fireEvent.click(screen.getByRole('button'))
    expect(mockUnfollowMutate).toHaveBeenCalledWith(7)
  })
})
