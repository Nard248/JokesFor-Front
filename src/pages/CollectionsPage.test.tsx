/**
 * CollectionsPage tests — wiring contracts.
 *
 *  1. Create: opening the inline form + submitting a name calls the create
 *     mutation with that name (POST /collections/).
 *  2. Navigation: clicking a collection tile navigates to /collections/:id.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'

vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}))

const mockToast = vi.fn()
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

const mockUseCollections = vi.fn()
const mockCreateMutate = vi.fn()
vi.mock('@/features/collections', () => ({
  useCollections: () => mockUseCollections(),
  useCreateCollection: () => ({ mutate: mockCreateMutate, isPending: false }),
}))

import { CollectionsPage } from './CollectionsPage'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/collections']}>
      <Routes>
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/:id" element={<div data-testid="detail">{'detail'}</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CollectionsPage', () => {
  it('creates a collection with the typed name', async () => {
    mockUseCollections.mockReturnValue({ data: { results: [] }, isLoading: false, isError: false, refetch: vi.fn() })
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /new collection/i }))
    const input = screen.getByLabelText(/collection name/i)
    fireEvent.change(input, { target: { value: '  Dad jokes  ' } })
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }))

    expect(mockCreateMutate).toHaveBeenCalledTimes(1)
    // Name is trimmed before it's sent.
    expect(mockCreateMutate.mock.calls[0][0]).toBe('Dad jokes')
  })

  it('navigates to the detail route when a tile is clicked', async () => {
    mockUseCollections.mockReturnValue({
      data: { results: [{ id: 7, name: 'Office-safe', joke_count: 3, is_default: false }] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /open collection office-safe/i }))
    await waitFor(() => expect(screen.getByTestId('detail')).toBeInTheDocument())
  })
})
