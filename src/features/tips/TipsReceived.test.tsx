import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockUseCreatorTipsSummary = vi.fn()
vi.mock('./api', async (importOriginal) => {
  const original = await importOriginal<typeof import('./api')>()
  return {
    ...original,
    useCreatorTipsSummary: (creatorId: number) => mockUseCreatorTipsSummary(creatorId),
  }
})

import { TipsReceived } from './TipsReceived'

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

beforeEach(() => vi.clearAllMocks())

describe('TipsReceived', () => {
  it('renders count and total when there are tips', () => {
    mockUseCreatorTipsSummary.mockReturnValue({ data: { count: 12, total_cents: 3400 }, isLoading: false, isError: false })
    render(<TipsReceived creatorId={7} />, { wrapper: makeWrapper() })
    const el = screen.getByTestId('tips-received')
    expect(el.textContent).toContain('12')
    expect(el.textContent).toContain('tips received')
    expect(el.textContent).toContain('$34.00')
  })

  it('uses singular "tip" for a count of 1', () => {
    mockUseCreatorTipsSummary.mockReturnValue({ data: { count: 1, total_cents: 500 }, isLoading: false, isError: false })
    render(<TipsReceived creatorId={7} />, { wrapper: makeWrapper() })
    expect(screen.getByTestId('tips-received').textContent).toContain('1 tip received')
  })

  it('is hidden (graceful-absent) when count is 0', () => {
    mockUseCreatorTipsSummary.mockReturnValue({ data: { count: 0, total_cents: 0 }, isLoading: false, isError: false })
    const { container } = render(<TipsReceived creatorId={7} />, { wrapper: makeWrapper() })
    expect(container.firstChild).toBeNull()
    expect(screen.queryByTestId('tips-received')).toBeNull()
  })

  it('is hidden while loading', () => {
    mockUseCreatorTipsSummary.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    const { container } = render(<TipsReceived creatorId={7} />, { wrapper: makeWrapper() })
    expect(container.firstChild).toBeNull()
  })

  it('is hidden on error (graceful-absent)', () => {
    mockUseCreatorTipsSummary.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    const { container } = render(<TipsReceived creatorId={7} />, { wrapper: makeWrapper() })
    expect(container.firstChild).toBeNull()
  })

  it('is hidden when data is absent entirely (undefined, not loading, not errored)', () => {
    mockUseCreatorTipsSummary.mockReturnValue({ data: undefined, isLoading: false, isError: false })
    const { container } = render(<TipsReceived creatorId={7} />, { wrapper: makeWrapper() })
    expect(container.firstChild).toBeNull()
  })
})
