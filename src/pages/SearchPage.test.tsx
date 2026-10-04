import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import { HelmetProvider } from 'react-helmet-async'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Joke, PaginatedResponse } from '@/lib/api'
import { jokesAdapter } from '@/lib/api-adapter'
import { SearchPage } from './SearchPage'

vi.mock('@/components/FlowAppShell', () => ({ FlowAppShell: ({ children }: { children: ReactNode }) => <div>{children}</div> }))
vi.mock('@/components/FlowJokeCard', () => ({
  FlowJokeCard: ({ joke }: { joke: Joke }) => <div>joke-{joke.id}</div>,
  jokeToFlowData: (joke: Joke) => joke,
}))
vi.mock('@/lib/api-adapter', () => ({ jokesAdapter: { search: vi.fn() } }))
vi.mock('@/features/create/queries', () => ({
  useFormats: () => ({ data: [{ slug: 'oneliner', name: 'One-liner' }], isError: false }),
  useTones: () => ({ data: [{ slug: 'dad', name: 'Dad' }], isError: false }),
  useContextTags: () => ({ data: [{ slug: 'work', name: 'Work' }], isError: false }),
}))
function page(ids: number[], next: string | null = null): PaginatedResponse<Joke> {
  return { count: next ? 3 : ids.length, next, previous: null, results: ids.map((id) => ({ id }) as Joke) }
}
function Location() {
  const location = useLocation()
  const navigate = useNavigate()
  return <><output data-testid="location">{location.search}</output><button onClick={() => navigate(-1)}>Go back</button><button onClick={() => navigate(1)}>Go forward</button></>
}
function renderPage(entries = ['/search']) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><HelmetProvider><MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}><SearchPage /><Location /></MemoryRouter></HelmetProvider></QueryClientProvider>)
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(jokesAdapter.search).mockResolvedValue(page([21, 22]))
})
afterEach(() => { vi.useRealTimers() })

describe('unified search page', () => {
  it('renders a labeled 200-character search field, real cards and match count', async () => {
    renderPage(['/search?q=coffee&categories=dad'])
    expect(screen.getByRole('searchbox', { name: 'Search jokes' })).toHaveValue('coffee')
    expect(screen.getByRole('searchbox')).toHaveAttribute('maxlength', '200')
    await screen.findByText('joke-21')
    expect(screen.getByText('joke-21').closest('a')).toHaveAttribute('href', '/jokes/21?source=search')
    expect(screen.getByText('2 matches')).toBeInTheDocument()
    expect(jokesAdapter.search).toHaveBeenCalledWith(expect.objectContaining({ q: 'coffee', categories: 'dad', page: 1 }), expect.any(AbortSignal))
  })

  it('debounces typing into the URL and sends only the committed query', async () => {
    renderPage()
    await screen.findByText('joke-21')
    vi.useFakeTimers()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'coffee' } })
    await act(async () => { vi.advanceTimersByTime(299) })
    expect(screen.getByTestId('location')).toHaveTextContent('')
    expect(jokesAdapter.search).toHaveBeenCalledTimes(1)
    await act(async () => { vi.advanceTimersByTime(1) })
    expect(screen.getByTestId('location')).toHaveTextContent('?q=coffee')
    expect(jokesAdapter.search).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'coffee', page: 1 }), expect.any(AbortSignal))
  })

  it('preserves spaces, focus and caret while typing across multiple debounced URL commits', async () => {
    renderPage()
    await screen.findByText('joke-21')
    vi.useFakeTimers()
    const input = screen.getByRole('searchbox') as HTMLInputElement
    input.focus()
    const append = (text: string) => {
      for (const character of text) fireEvent.change(input, { target: { value: input.value + character } })
    }
    append('dad ')
    input.setSelectionRange(2, 2)
    await act(async () => { vi.advanceTimersByTime(330) })
    expect(input).toHaveValue('dad ')
    expect(input).toHaveFocus()
    expect(input.selectionStart).toBe(2)
    expect(input.selectionEnd).toBe(2)
    expect(screen.getByTestId('location')).toHaveTextContent('?q=dad')

    append('jokes ')
    await act(async () => { vi.advanceTimersByTime(330) })
    expect(input).toHaveValue('dad jokes ')
    expect(input.selectionStart).toBe('dad jokes '.length)
    expect(jokesAdapter.search).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'dad jokes' }), expect.any(AbortSignal))

    append('about ')
    await act(async () => { vi.advanceTimersByTime(330) })
    expect(input).toHaveValue('dad jokes about ')
    append('coffee')
    await act(async () => { vi.advanceTimersByTime(330) })
    expect(input).toHaveValue('dad jokes about coffee')
    expect(jokesAdapter.search).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'dad jokes about coffee' }), expect.any(AbortSignal))
  })

  it('submits immediately and restores input and filters on Back/Forward', async () => {
    renderPage(['/search?q=coffee&categories=dad'])
    await screen.findByText('joke-21')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'cats ' } })
    fireEvent.submit(screen.getByRole('search'))
    expect(screen.getByTestId('location')).toHaveTextContent('q=cats')
    expect(screen.getByRole('searchbox')).toHaveValue('cats ')
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
    expect(screen.getByRole('searchbox')).toHaveValue('coffee')
    expect(screen.getByLabelText('Dad')).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Go forward' }))
    expect(screen.getByRole('searchbox')).toHaveValue('cats')
    await waitFor(() => expect(jokesAdapter.search).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'cats' }), expect.any(AbortSignal)))
  })

  it('stores optional category/theme/format selections in the URL', async () => {
    renderPage()
    await screen.findByText('joke-21')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'dad ' } })
    fireEvent.click(screen.getByLabelText('Dad'))
    fireEvent.click(screen.getByLabelText('Work'))
    fireEvent.click(screen.getByLabelText('One-liner'))
    expect(screen.getByRole('searchbox')).toHaveValue('dad ')
    expect(screen.getByTestId('location')).toHaveTextContent('categories=dad')
    expect(screen.getByTestId('location')).toHaveTextContent('themes=work')
    expect(screen.getByTestId('location')).toHaveTextContent('joke_format=oneliner')
    expect(jokesAdapter.search).toHaveBeenLastCalledWith(expect.objectContaining({ categories: 'dad', themes: 'work', joke_format: 'oneliner' }), expect.any(AbortSignal))
  })

  it('cancels uncommitted typing on history navigation and preserves locale parameters', async () => {
    renderPage(['/search?q=coffee&language=hy&country=AM', '/search?q=cats&language=hy&country=AM'])
    await screen.findByText('joke-21')
    vi.useFakeTimers()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'unfinished' } })
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
    expect(screen.getByRole('searchbox')).toHaveValue('coffee')
    await act(async () => { vi.advanceTimersByTime(300) })
    expect(screen.getByTestId('location')).toHaveTextContent('?q=coffee&language=hy&country=AM')
    expect(jokesAdapter.search).not.toHaveBeenCalledWith(expect.objectContaining({ q: 'unfinished' }), expect.anything())
    expect(jokesAdapter.search).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'coffee', language: 'hy', country: 'AM' }), expect.any(AbortSignal))
  })

  it('appends pages and clears old results immediately when the query changes', async () => {
    vi.mocked(jokesAdapter.search).mockImplementation((params) => Promise.resolve(
      params.q === 'cats' ? page([90]) : params.page === 2 ? page([23]) : page([21, 22], '?page=2'),
    ))
    renderPage(['/search?q=coffee'])
    await screen.findByText('joke-21')
    fireEvent.click(screen.getByRole('button', { name: /Load more/ }))
    await screen.findByText('joke-23')
    expect(screen.getByText('joke-21')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'cats' } })
    fireEvent.submit(screen.getByRole('search'))
    expect(screen.queryByText('joke-21')).not.toBeInTheDocument()
    await screen.findByText('joke-90')
    expect(screen.queryByText('joke-23')).not.toBeInTheDocument()
  })

  it('shows a real no-results state and clears query and filters together', async () => {
    vi.mocked(jokesAdapter.search).mockResolvedValue(page([]))
    renderPage(['/search?q=absent&categories=dad&themes=work'])
    await screen.findByText('No jokes found')
    fireEvent.click(screen.getByRole('button', { name: 'Clear search and filters' }))
    expect(screen.getByTestId('location').textContent).toBe('')
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })

  it('keeps earlier pages visible when loading more fails and retries that page', async () => {
    vi.mocked(jokesAdapter.search)
      .mockResolvedValueOnce(page([21, 22], '?page=2'))
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockResolvedValueOnce(page([23]))
    renderPage(['/search?q=coffee'])
    await screen.findByText('joke-21')
    fireEvent.click(screen.getByRole('button', { name: /Load more/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('We could not load more jokes.')
    expect(screen.getByText('joke-21')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try loading more again' }))
    await screen.findByText('joke-23')
    expect(screen.getByText('joke-21')).toBeInTheDocument()
    expect(jokesAdapter.search).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }), expect.any(AbortSignal))
  })

  it('shows server query validation and lets the reader retry a failed request', async () => {
    vi.mocked(jokesAdapter.search).mockRejectedValueOnce({ response: { status: 400, data: { q: ['Use at most 32 search terms.'] } } }).mockResolvedValue(page([90]))
    renderPage(['/search?q=too+many'])
    expect(await screen.findByRole('alert')).toHaveTextContent('Use at most 32 search terms.')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await screen.findByText('joke-90')
  })
})
