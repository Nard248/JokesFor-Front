import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { NotificationDTO } from '@/lib/api'

const mockMark = vi.fn()
let notifications: NotificationDTO[]

vi.mock('@/features/notifications', () => ({
  useNotifications: () => ({ data: notifications }),
  useMarkAllRead: () => ({ mutate: mockMark, isPending: false }),
}))

// AppealButton itself is covered by its own test suite (modal/mutation
// behavior); here it's stubbed to a simple marker so these tests only assert
// NotificationsPanel's own mapping/CTA-gating logic.
vi.mock('@/components/AppealButton', () => ({
  AppealButton: ({ jokeId, submissionId, label }: { jokeId?: number; submissionId?: number; label?: string }) => (
    <button data-testid="appeal-cta" data-joke-id={jokeId} data-submission-id={submissionId}>
      {label}
    </button>
  ),
}))

import { NotificationsPanel } from './NotificationsPanel'

function renderPanel() {
  return render(
    <MemoryRouter>
      <NotificationsPanel onClose={() => {}} />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  notifications = [
    { id: 1, verb: 'followed_you', read: false, created_at: 'x', actor: { id: 7, name: 'Pun Queen', username: '@pq' }, joke: null },
    { id: 2, verb: 'joke_published', read: false, created_at: 'x', actor: null, joke: { id: 42, preview: 'Why did the...' } },
  ]
})

describe('NotificationsPanel', () => {
  it('renders mapped notifications', () => {
    renderPanel()
    expect(screen.getByText('Pun Queen followed you')).toBeTruthy()
    expect(screen.getByText('Your joke was published')).toBeTruthy()
  })

  it('mark all read fires the mutation', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('mark-all-read'))
    expect(mockMark).toHaveBeenCalledTimes(1)
  })

  it('shows the empty state when there are no notifications', () => {
    notifications = []
    renderPanel()
    expect(screen.getByText(/caught up/)).toBeTruthy()
  })

  describe('joke_removed', () => {
    it('shows the reason + appeal deadline and an Appeal CTA wired to the joke id', () => {
      notifications = [
        {
          id: 3, verb: 'joke_removed', read: false, created_at: 'x', actor: null,
          joke: { id: 99, preview: 'A removed joke' },
          data: { reason: 'harassment', appeal_deadline: '2026-08-20T00:00:00Z' },
        },
      ]
      renderPanel()
      expect(screen.getByText(/Reason: Harassment/)).toBeTruthy()
      expect(screen.getByText(/Appeal by August 20, 2026/)).toBeTruthy()
      const cta = screen.getByTestId('appeal-cta')
      expect(cta.getAttribute('data-joke-id')).toBe('99')
      expect(cta.textContent).toBe('Appeal')
    })

    it('falls back to the original copy when data is absent (older notifications, no crash)', () => {
      notifications = [
        { id: 4, verb: 'joke_removed', read: false, created_at: 'x', actor: null, joke: { id: 5, preview: 'An old joke' } },
      ]
      renderPanel()
      expect(screen.getByText('A joke was removed')).toBeTruthy()
      expect(screen.getByText('An old joke')).toBeTruthy()
      // Still gets a CTA — the joke id is known even without `data`.
      expect(screen.getByTestId('appeal-cta').getAttribute('data-joke-id')).toBe('5')
    })
  })

  describe('joke_rejected', () => {
    it('shows the rejection reason and a review-and-appeal link (no id to appeal directly from the inbox)', () => {
      notifications = [
        {
          id: 6, verb: 'joke_rejected', read: false, created_at: 'x', actor: null, joke: null,
          data: { rejection_reason: 'Too similar to an existing joke.' },
        },
      ]
      renderPanel()
      expect(screen.getByText('Your submission was rejected')).toBeTruthy()
      expect(screen.getByText('Too similar to an existing joke.')).toBeTruthy()
      const link = screen.getByRole('link', { name: /review & appeal/i })
      expect(link.getAttribute('href')).toBe('/create')
      expect(screen.queryByTestId('appeal-cta')).toBeNull()
    })

    it('graceful — a joke_rejected notification without data still renders (no crash)', () => {
      notifications = [
        { id: 7, verb: 'joke_rejected', read: false, created_at: 'x', actor: null, joke: null },
      ]
      renderPanel()
      expect(screen.getByText('Your submission was rejected')).toBeTruthy()
      expect(screen.getByText('It did not meet our guidelines.')).toBeTruthy()
    })
  })

  it('appeal_resolved renders a reviewed/approved notice without crashing', () => {
    notifications = [
      { id: 8, verb: 'appeal_resolved', read: false, created_at: 'x', actor: null, joke: null, data: { outcome: 'reversed' } },
    ]
    renderPanel()
    expect(screen.getByText('Your appeal was approved')).toBeTruthy()
  })
})
