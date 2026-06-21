import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const mockReportMutate = vi.fn()
vi.mock('@/features/moderation', () => ({
  useReportJoke: () => ({ mutate: mockReportMutate, isPending: false, isError: false }),
}))

const mockUseAuthStore = vi.fn()
vi.mock('@/features/auth/store', () => ({
  useAuthStore: (selector: (s: { isAuthenticated: boolean }) => unknown) => mockUseAuthStore(selector),
}))

const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => {
  const original = await importOriginal<typeof import('react-router')>()
  return { ...original, useNavigate: () => mockNavigate }
})

import { ReportJokeButton } from './ReportJokeButton'

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAuthStore.mockImplementation((sel: (s: { isAuthenticated: boolean }) => unknown) =>
    sel({ isAuthenticated: true }),
  )
})

describe('ReportJokeButton', () => {
  it('unauthenticated click navigates to /login and opens no modal', () => {
    mockUseAuthStore.mockImplementation((sel: (s: { isAuthenticated: boolean }) => unknown) =>
      sel({ isAuthenticated: false }),
    )
    render(<ReportJokeButton jokeId={5} />)
    fireEvent.click(screen.getByTestId('report-joke-button'))
    expect(mockNavigate).toHaveBeenCalledWith('/login')
    expect(screen.queryByText('Report this joke')).toBeNull()
    expect(mockReportMutate).not.toHaveBeenCalled()
  })

  it('does not submit until a reason is chosen', () => {
    render(<ReportJokeButton jokeId={5} />)
    fireEvent.click(screen.getByTestId('report-joke-button'))
    expect(screen.getByText('Report this joke')).toBeTruthy()
    fireEvent.click(screen.getByTestId('report-submit'))
    expect(mockReportMutate).not.toHaveBeenCalled()
  })

  it('authenticated: opens modal, picks a reason, submits the report', () => {
    render(<ReportJokeButton jokeId={5} />)
    fireEvent.click(screen.getByTestId('report-joke-button'))
    fireEvent.click(screen.getByText('Spam'))
    fireEvent.click(screen.getByTestId('report-submit'))
    expect(mockReportMutate).toHaveBeenCalledTimes(1)
    expect(mockReportMutate.mock.calls[0][0]).toMatchObject({ joke: 5, reason: 'spam' })
  })
})
