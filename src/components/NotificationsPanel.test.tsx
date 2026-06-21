import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { NotificationDTO } from '@/lib/api'

const mockMark = vi.fn()
let notifications: NotificationDTO[]

vi.mock('@/features/notifications', () => ({
  useNotifications: () => ({ data: notifications }),
  useMarkAllRead: () => ({ mutate: mockMark, isPending: false }),
}))

import { NotificationsPanel } from './NotificationsPanel'

beforeEach(() => {
  vi.clearAllMocks()
  notifications = [
    { id: 1, verb: 'followed_you', read: false, created_at: 'x', actor: { id: 7, name: 'Pun Queen', username: '@pq' }, joke: null },
    { id: 2, verb: 'joke_published', read: false, created_at: 'x', actor: null, joke: { id: 42, preview: 'Why did the...' } },
  ]
})

describe('NotificationsPanel', () => {
  it('renders mapped notifications', () => {
    render(<NotificationsPanel onClose={() => {}} />)
    expect(screen.getByText('Pun Queen followed you')).toBeTruthy()
    expect(screen.getByText('Your joke was published')).toBeTruthy()
  })

  it('mark all read fires the mutation', () => {
    render(<NotificationsPanel onClose={() => {}} />)
    fireEvent.click(screen.getByTestId('mark-all-read'))
    expect(mockMark).toHaveBeenCalledTimes(1)
  })

  it('shows the empty state when there are no notifications', () => {
    notifications = []
    render(<NotificationsPanel onClose={() => {}} />)
    expect(screen.getByText(/caught up/)).toBeTruthy()
  })
})
