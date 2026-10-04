import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import type { ReactNode } from 'react'
import { beforeEach, afterEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/features/auth/store'
import { CreatorContentPage } from './CreatorContentPage'

vi.mock('@/components/FlowAppShell', () => ({ FlowAppShell: ({ children }: { children: ReactNode }) => <main>{children}</main> }))
const plan = { isPro: false, features: { creator_content_explorer: false, creator_exports: false, creator_community_insights: false }, isLoading: false, isError: false }
vi.mock('@/features/creator-studio/useCreatorPlan', () => ({ useCreatorPlan: () => plan }))
vi.mock('@/features/create/queries', () => ({
  useFormats: () => ({ data: [{ slug: 'oneliner', name: 'One-liner' }] }),
  useLanguages: () => ({ data: [{ code: 'en', name: 'English' }] }),
  useContextTags: () => ({ data: [{ slug: 'work', name: 'Work' }] }),
  useTones: () => ({ data: [{ slug: 'wordplay', name: 'Wordplay' }] }),
}))
const response = {
  count: 26, next: 'https://example.test/api/v1/creators/me/content/?page=2', previous: null,
  window: { start: '2026-08-29', end: '2026-09-27', timezone: 'UTC' },
  measurement_notes: ['Views are recorded opens or reveals, not laughs or completed reads.', 'Shares are share initiations.'],
  results: [{ id: 42, text: 'Coffee for the compiler.', setup: '', punchline: '',
    format: { slug: 'oneliner', name: 'One-liner' }, language: { code: 'en', name: 'English' },
    themes: [], categories: [{ slug: 'wordplay', name: 'Wordplay' }], created_at: '2026-09-01T12:00:00Z',
    views: 120, reactions: 8, saves: 4, share_initiations: 2, metadata_missing: ['themes'], metadata_completeness: 75,
    recommendation: { kind: 'complete_metadata', detail: 'Add themes to make this material easier to find.', sample_size: 120 },
  }],
}
let get: MockInstance<typeof api.get>
const renderPage = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><CreatorContentPage /></MemoryRouter></QueryClientProvider>)
beforeEach(() => {
  vi.stubEnv('VITE_API_URL', 'https://example.test/api/v1')
  vi.stubEnv('VITE_USE_MOCKS', 'false')
  useAuthStore.getState().setAuth({ pk: 1, username: 'creator', email: '', first_name: '', last_name: '' }, 'token')
  get = vi.spyOn(api, 'get').mockResolvedValue({ data: response })
})
afterEach(() => { cleanup(); useAuthStore.getState().logout(); vi.restoreAllMocks(); vi.unstubAllEnvs() })

describe('Creator content workbench', () => {
  it('renders the paginated server contract, measured counts and metadata advice', async () => {
    renderPage()
    expect(await screen.findByText('Coffee for the compiler.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Coffee for the compiler.' })).toHaveAttribute('href', '/jokes/42')
    expect(screen.getByText('Add themes to make this material easier to find.')).toBeInTheDocument()
    expect(screen.getByText('75% complete')).toBeInTheDocument()
    expect(screen.getByText(response.measurement_notes[0])).toBeInTheDocument()
    expect(screen.getByText(/26 jokes/)).toBeInTheDocument()
  })
  it('applies taxonomy, search and date filters using backend parameter names', async () => {
    renderPage()
    await screen.findByText('Coffee for the compiler.')
    fireEvent.change(screen.getByLabelText('Format'), { target: { value: 'oneliner' } })
    fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'en' } })
    fireEvent.change(screen.getByLabelText('Theme'), { target: { value: 'work' } })
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'wordplay' } })
    fireEvent.change(screen.getByLabelText('Search content'), { target: { value: 'Coffee' } })
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-01' } })
    fireEvent.change(screen.getByLabelText('Through'), { target: { value: '2026-09-27' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
    await waitFor(() => expect(get).toHaveBeenLastCalledWith('/creators/me/content/', expect.objectContaining({ params: expect.objectContaining({ joke_format: 'oneliner', language: 'en', theme: 'work', category: 'wordplay', q: 'Coffee', start: '2026-09-01', end: '2026-09-27', page: 1 }) })))
  })
  it('paginates using a local page number and resets the page when sorting changes', async () => {
    renderPage()
    await screen.findByText('Coffee for the compiler.')
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    await waitFor(() => expect(get).toHaveBeenLastCalledWith('/creators/me/content/', expect.objectContaining({ params: expect.objectContaining({ page: 2 }) })))
    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'saves' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
    await waitFor(() => expect(get).toHaveBeenLastCalledWith('/creators/me/content/', expect.objectContaining({ params: expect.objectContaining({ page: 1, sort: 'saves' }) })))
  })
  it('shows the shared Creator Pro gate on 403 while keeping free access explicit', async () => {
    get.mockRejectedValue({ response: { status: 403 } })
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Content workbench is part of Creator Pro' })).toBeInTheDocument()
    expect(screen.getByText(/Reading, publishing and basic insights stay free/)).toBeInTheDocument()
    expect(screen.getByText(/doesn't buy distribution or reach/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See Creator Pro' })).toHaveAttribute('href', '/settings/billing')
    expect(screen.getByTestId('studio-tab-insights')).toHaveAttribute('href', '/create/insights')
    expect(screen.queryByRole('button', { name: /Export CSV/ })).not.toBeInTheDocument()
  })
  it('shows an empty state and disables exporting empty results', async () => {
    get.mockResolvedValue({ data: { ...response, count: 0, next: null, results: [] } })
    renderPage()
    expect(await screen.findByText('No content matches these filters')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled()
  })
  it('shows loading without inventing content or metrics', () => {
    get.mockImplementation(() => new Promise(() => {}))
    renderPage()
    expect(screen.getByRole('status')).toHaveTextContent('Loading your content')
    expect(screen.queryByText('Coffee for the compiler.')).not.toBeInTheDocument()
  })
  it('downloads CSV through the authenticated blob client with the applied filters', async () => {
    const createObjectURL = vi.fn(() => 'blob:local-export')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }))
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    get.mockImplementation(async (url: string) => ({ data: url.includes('/export/') ? new Blob(['id,text\n42,hello'], { type: 'text/csv' }) : response }))
    renderPage()
    await screen.findByText('Coffee for the compiler.')
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }))
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    expect(get).toHaveBeenLastCalledWith('/creators/me/content/export/', expect.objectContaining({ responseType: 'blob', params: expect.objectContaining({ period: 'month', sort: 'newest' }) }))
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:local-export'))
    vi.unstubAllGlobals()
  })
  it('uses a friendly export upgrade state without exposing internal entitlement keys', async () => {
    get.mockImplementation(async (url: string) => {
      if (url.includes('/export/')) throw { response: { status: 403, data: { detail: 'Feature creator_exports is required.' } } }
      return { data: response }
    })
    renderPage()
    await screen.findByText('Coffee for the compiler.')
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('CSV exports are part of Creator Pro.')
    expect(screen.queryByText(/creator_exports/)).not.toBeInTheDocument()
  })
  it('explains the1000-row export cap from a blob error response', async () => {
    get.mockImplementation(async (url: string) => {
      if (url.includes('/export/')) throw { response: { status: 422, data: { text: async () => JSON.stringify({ detail: 'Narrow the filters to export at most 1000 jokes.' }) } } }
      return { data: response }
    })
    renderPage()
    await screen.findByText('Coffee for the compiler.')
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Narrow the filters to export at most 1000 jokes.')
  })
})
