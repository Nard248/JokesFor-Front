/**
 * FormatPickerPage tests.
 *
 * FlowAppShell is mocked to a passthrough.
 * useFormats is mocked so we can control data per test.
 */
import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { FormatRule } from '@/features/create'

// ── Passthrough mock for FlowAppShell ────────────────────────────────────────
vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}))

// ── Mock useFormats ──────────────────────────────────────────────────────────
const mockUseFormats = vi.fn()

vi.mock('@/features/create', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/features/create')>()
  return {
    ...original,
    useFormats: () => mockUseFormats(),
  }
})

import { FormatPickerPage } from './FormatPickerPage'

const MOCK_FORMATS: FormatRule[] = [
  { id: 1, slug: 'oneliner', name: 'One-liner', description: 'A single witty sentence.', required_fields: ['text'], forbidden_fields: [], constraints: {} },
  { id: 2, slug: 'setup', name: 'Setup → Punchline', description: 'A classic two-part joke.', required_fields: ['setup', 'punchline'], forbidden_fields: [], constraints: {} },
  { id: 3, slug: 'knock', name: 'Knock-knock', description: 'Call-and-response format.', required_fields: ['lines'], forbidden_fields: [], constraints: {} },
  { id: 4, slug: 'story', name: 'Story', description: 'A narrative joke.', required_fields: ['text'], forbidden_fields: [], constraints: {} },
  { id: 5, slug: 'anti', name: 'Anti-joke', description: 'Subverts expectations.', required_fields: ['setup', 'punchline'], forbidden_fields: [], constraints: {} },
  { id: 6, slug: 'observ', name: 'Observational', description: 'A wry observation.', required_fields: ['text'], forbidden_fields: [], constraints: {} },
]

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/create/new']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  mockUseFormats.mockReturnValue({
    data: MOCK_FORMATS,
    isLoading: false,
    isError: false,
  })
})

describe('FormatPickerPage', () => {
  it('renders "Pick a format" heading', () => {
    const Wrapper = makeWrapper()
    render(<FormatPickerPage />, { wrapper: Wrapper })

    expect(screen.getByText(/pick a format/i)).toBeDefined()
  })

  it('renders 6 format tiles when formats are loaded', () => {
    const Wrapper = makeWrapper()
    render(<FormatPickerPage />, { wrapper: Wrapper })

    // FormatTile renders role="button"
    const tiles = screen.getAllByRole('button').filter((b) => b.getAttribute('tabindex') === '0')
    expect(tiles.length).toBe(6)
  })

  it('renders a Back link to /create', () => {
    const Wrapper = makeWrapper()
    render(<FormatPickerPage />, { wrapper: Wrapper })

    const backLinks = screen.getAllByRole('link')
    const backLink = backLinks.find((l) => l.getAttribute('href') === '/create')
    expect(backLink).toBeDefined()
  })

  it('shows skeleton tiles while loading', () => {
    mockUseFormats.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    const Wrapper = makeWrapper()
    render(<FormatPickerPage />, { wrapper: Wrapper })

    const skeletons = document.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThanOrEqual(6)
  })

  it('falls back to 6 tiles on error using known slugs', () => {
    mockUseFormats.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })

    const Wrapper = makeWrapper()
    render(<FormatPickerPage />, { wrapper: Wrapper })

    // Fallback still renders 6 tiles (from FORMAT_SLUGS)
    const tiles = screen.getAllByRole('button').filter((b) => b.getAttribute('tabindex') === '0')
    expect(tiles.length).toBe(6)
  })

  it('clicking a tile navigates to /create/new/:slug', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/create/new']}>
          <Routes>
            <Route path="/create/new" element={<FormatPickerPage />} />
            <Route
              path="/create/new/:slug"
              element={<div data-testid="editor-page">editor</div>}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    // Click the first tile (oneliner)
    const tiles = screen.getAllByRole('button').filter((b) => b.getAttribute('tabindex') === '0')
    tiles[0].click()

    await waitFor(() => {
      expect(screen.getByTestId('editor-page')).toBeDefined()
    })
  })
})
