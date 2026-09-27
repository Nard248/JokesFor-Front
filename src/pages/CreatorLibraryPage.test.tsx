import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import axios from 'axios'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/store'
import { CreatorLibraryPage } from './CreatorLibraryPage'

vi.mock('@/components/FlowAppShell', () => ({ FlowAppShell: ({ children }: { children: ReactNode }) => <main>{children}</main> }))
vi.mock('@/features/create/queries', () => ({ useContextTags: () => ({ data: [{ slug: 'work', name: 'Work' }] }), useTones: () => ({ data: [{ slug: 'wordplay', name: 'Wordplay' }] }) }))
const collection = { id: 7, name: 'Friday set', kind: 'set_list', description: 'Five-minute opener', joke_ids: [42, 43], items: [{ joke_id: 42, display_text: 'Coffee routine' }, { joke_id: 43, display_text: 'Morning commute' }], unavailable_count: 0, updated_at: '2026-09-27T10:00:00Z' }
const page = <T,>(results: T[]) => ({ count: results.length, results, next: null, previous: null, unavailable_count: 0 })
let canWrite = true
let unavailable = 0
const request = vi.spyOn(axios, 'request')
const renderPage = (path = '/create/library') => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return { ...render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><CreatorLibraryPage /></MemoryRouter></QueryClientProvider>), client }
}

beforeEach(() => {
  canWrite = true; unavailable = 0
  vi.stubEnv('VITE_API_URL', 'https://example.test/api/v1'); vi.stubEnv('VITE_USE_MOCKS', 'false')
  useAuthStore.getState().setAuth({ pk: 1, username: '', email: '', first_name: '', last_name: '' }, 'token')
  request.mockReset().mockImplementation(async (config) => {
    if (config.method !== 'GET') return { data: config.url?.includes('collections') ? { ...collection, ...(config.data as Record<string, unknown>) } : config.data }
    if (config.url === '/billing/entitlements') return { data: { features: { creator_content_explorer: canWrite } } }
    if (config.url?.startsWith('/creators/me/content/?')) return { data: page([{ id: 42, text: 'Coffee routine', format: { name: 'One-liner' } }, { id: 43, text: 'Morning commute', format: { name: 'One-liner' } }]) }
    if (config.url?.includes('workspace-notes')) return { data: page([{ joke_id: 42, private_note: 'Pause before the punchline', updated_at: '2026-09-27T10:00:00Z' }]) }
    if (config.url?.endsWith('/workspace/')) return { data: { joke_id: 42, private_note: 'Pause before the punchline', updated_at: '2026-09-27T10:00:00Z' } }
    if (config.url?.includes('metadata-requests')) return { data: page([{ id: 1, joke_id: 42, changes: { themes: ['work'] }, reason: 'Discovery', status: 'pending', decision_reason: '', created_at: '2026-09-27T10:00:00Z', reviewed_at: null }]) }
    return { data: page([{ ...collection, unavailable_count: unavailable }]) }
  })
})
afterEach(() => { cleanup(); useAuthStore.getState().logout(); vi.unstubAllEnvs() })

it('saves a private note on its owner route and leaves public content untouched', async () => {
  renderPage('/create/library?joke=42')
  const note = await screen.findByLabelText('Private note')
  await waitFor(() => expect(note).toHaveValue('Pause before the punchline'))
  fireEvent.change(note, { target: { value: 'Try a longer pause' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save note' }))
  await waitFor(() => expect(request).toHaveBeenCalledWith(expect.objectContaining({ method: 'PATCH', url: '/creators/me/content/42/workspace/', data: { private_note: 'Try a longer pause' } })))
  expect(await screen.findByRole('status')).toHaveTextContent('Note saved')
})

it('preserves read and erase access after cancellation while disabling new writes', async () => {
  canWrite = false
  renderPage('/create/library?joke=42')
  await screen.findByDisplayValue('Pause before the punchline')
  expect(screen.getByRole('button', { name: 'Save note' })).toBeDisabled()
  expect(screen.getByText(/existing private work remains available/i)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Delete note' }))
  await waitFor(() => expect(request).toHaveBeenCalledWith(expect.objectContaining({ method: 'DELETE', url: '/creators/me/content/42/workspace/' })))
})

it('saves deliberate set-list order using move controls', async () => {
  renderPage()
  fireEvent.click(await screen.findByRole('button', { name: 'Open Friday set' }))
  fireEvent.click(screen.getByRole('button', { name: 'Move Morning commute up' }))
  fireEvent.click(screen.getByRole('button', { name: 'Save collection' }))
  await waitFor(() => expect(request).toHaveBeenCalledWith(expect.objectContaining({ method: 'PATCH', url: '/creators/me/collections/7/', data: expect.objectContaining({ joke_ids: [43, 42] }) })))
})

it('does not silently drop inaccessible collection members on a name edit', async () => {
  unavailable = 1
  renderPage()
  fireEvent.click(await screen.findByRole('button', { name: 'Open Friday set' }))
  expect(screen.getByText(/unavailable item/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Move Morning commute up' })).toBeDisabled()
  fireEvent.change(screen.getByLabelText('Collection name'), { target: { value: 'Saturday set' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save collection' }))
  await waitFor(() => expect(request).toHaveBeenCalledWith(expect.objectContaining({ method: 'PATCH', data: { name: 'Saturday set', kind: 'set_list', description: 'Five-minute opener' } })))
})

it('creates a private series with selected own material', async () => {
  renderPage()
  const create = await screen.findByRole('button', { name: 'New collection' })
  await waitFor(() => expect(create).toBeEnabled())
  fireEvent.click(create)
  fireEvent.change(screen.getByLabelText('Collection name'), { target: { value: 'Office series' } })
  fireEvent.change(screen.getByLabelText('Collection type'), { target: { value: 'series' } })
  fireEvent.click(await screen.findByRole('button', { name: 'Add Coffee routine' }))
  fireEvent.click(screen.getByRole('button', { name: 'Create collection' }))
  await waitFor(() => expect(request).toHaveBeenCalledWith(expect.objectContaining({ method: 'POST', url: '/creators/me/collections/', data: { name: 'Office series', kind: 'series', description: '', joke_ids: [42] } })))
})

it('submits metadata for review without a direct publication mutation', async () => {
  renderPage('/create/library?joke=42&tab=review')
  const theme = await screen.findByLabelText('Replace themes')
  await waitFor(() => expect(theme).toBeEnabled())
  fireEvent.click(theme)
  fireEvent.click(screen.getByLabelText('Work'))
  fireEvent.change(screen.getByLabelText('Reason for change'), { target: { value: 'Make the occasion clearer' } })
  fireEvent.click(screen.getByRole('button', { name: 'Request review' }))
  await waitFor(() => expect(request).toHaveBeenCalledWith(expect.objectContaining({ method: 'POST', url: '/creators/me/content/metadata-requests/', data: { joke_ids: [42], themes: ['work'], reason: 'Make the occasion clearer' } })))
  expect(await screen.findByText(/sent for review/i)).toBeInTheDocument()
  expect(screen.getByText('Pending')).toBeInTheDocument()
})

it('stops displaying a cached note when the server reports its material unavailable', async () => {
  const { client } = renderPage('/create/library?joke=42')
  await screen.findByDisplayValue('Pause before the punchline')
  const original = request.getMockImplementation()!
  request.mockImplementation((config) => config.url?.endsWith('/workspace/') ? Promise.reject({ response: { status: 404 } }) : original(config))
  await act(async () => { await client.invalidateQueries({ queryKey: ['creator-library'] }) })
  await waitFor(() => expect(screen.queryByLabelText('Private note')).not.toBeInTheDocument())
  expect(screen.getByRole('alert')).toHaveTextContent('unavailable')
})

it('rechecks collection visibility after a refetch before saving membership', async () => {
  const { client } = renderPage()
  fireEvent.click(await screen.findByRole('button', { name: 'Open Friday set' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Move Morning commute up' })).toBeEnabled())
  unavailable = 1
  await act(async () => { await client.invalidateQueries({ queryKey: ['creator-library'] }) })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Move Morning commute up' })).toBeDisabled())
  fireEvent.change(screen.getByLabelText('Collection name'), { target: { value: 'Still private' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save collection' }))
  await waitFor(() => expect(request).toHaveBeenCalledWith(expect.objectContaining({ method: 'PATCH', data: { name: 'Still private', kind: 'set_list', description: 'Five-minute opener' } })))
})
