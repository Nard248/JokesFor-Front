import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
const { roll, status } = vi.hoisted(() => ({ roll: vi.fn(), status: { rolls_used_today: 30, rolls_remaining_today: null, max_per_day: null } }))
vi.mock('@/features/auth', () => ({ useAuth: () => ({ user: { username: 'Reader' } }) }))
vi.mock('@/components/FlowAppShell', () => ({ FlowAppShell: ({ children }: { children: ReactNode }) => <>{children}</> }))
vi.mock('@/features/insights', () => ({ useTodayAugmented: () => ({}), useTomorrowTeaser: () => ({}), useTasteProfile: () => ({}) }))
vi.mock('@/features/streak', () => ({ useStreak: () => ({}) }))
vi.mock('@/features/mystery-box', () => ({ useMysteryBoxStatus: () => ({ data: status }), useRollMysteryBox: () => ({ mutate: roll, isPending: false }) }))
vi.mock('@/features/packs', () => ({ useFeaturedPack: () => ({}), usePacksInProgress: () => ({}) }))
vi.mock('@/features/jokes', () => ({ useJokeSearch: () => ({}) }))
vi.mock('@/features/saved-jokes', () => ({ useSaveJoke: () => ({ mutate: vi.fn() }) }))
vi.mock('@/features/daily-joke', () => ({ useDailyJokeHistory: () => ({}) }))
vi.mock('@/features/trending', () => ({ useTopJokesters: () => ({}) }))
import { FlowCanvasPage } from './FlowCanvasPage'

describe('free mystery discovery', () => {
  it('allows another roll when the server returns an unlimited quota', () => {
    render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><FlowCanvasPage /></MemoryRouter></QueryClientProvider>)
    const button = screen.getByRole('button', { name: /^Roll$/ })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(roll).toHaveBeenCalled()
    expect(screen.queryByText(/left today|capped daily/i)).toBeNull()
  })
})
