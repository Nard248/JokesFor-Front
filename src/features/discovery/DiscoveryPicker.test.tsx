import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { DiscoveryPicker } from './DiscoveryPicker'
import { useDiscoveryStore } from './store'
import { EMPTY_SELECTION } from './selection'

const catalog = {
  languages: [{ code: 'es', name: 'Spanish', native_name: 'Español' }, { code: 'hy', name: 'Armenian', native_name: 'Հայերեն' }],
  countries: [{ code: 'ES', name: 'Spain', native_name: 'España', language_codes: ['es'] }, { code: 'AM', name: 'Armenia', native_name: 'Հայաստան', language_codes: ['hy'] }],
  cultures: [{ slug: 'armenia-everyday', name: 'Armenian everyday life', native_name: 'Հայկական առօրյա', description: 'Everyday observations.', language_codes: ['hy'], country_codes: ['AM'] }],
  collections: [],
}
const mockCatalog = vi.fn()
vi.mock('./api', () => ({ useDiscoveryCatalog: () => mockCatalog() }))

function Location() { return <output data-testid="url">{useLocation().search}</output> }
function show(path = '/explore') {
  render(<MemoryRouter initialEntries={[path]}><DiscoveryPicker /><Location /></MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: /Joke languages/ }))
}

beforeEach(() => {
  useDiscoveryStore.getState().setSelection(EMPTY_SELECTION)
  mockCatalog.mockReturnValue({ data: catalog, isLoading: false, isError: false })
})

describe('language, country and culture navigation', () => {
  it('shows native language names, remembers independent choices and preserves query text', () => {
    show('/search?q=café')
    fireEvent.change(screen.getByLabelText('Joke language'), { target: { value: 'hy' } })
    expect(screen.getByRole('option', { name: 'Հայերեն — Armenian' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'ES' } })
    expect(useDiscoveryStore.getState().selection).toEqual({ language: 'hy', country: 'ES', culture_tags: '' })
    const url = new URLSearchParams(screen.getByTestId('url').textContent ?? '')
    expect(url.get('q')).toBe('café')
    expect(url.get('language')).toBe('hy')
    expect(url.get('country')).toBe('ES')
  })

  it('honors a shared URL over saved preferences and can explicitly select All', () => {
    useDiscoveryStore.getState().setSelection({ language: 'es', country: 'ES', culture_tags: '' })
    show('/explore?language=hy&country=AM&culture_tags=armenia-everyday')
    expect(screen.getByLabelText('Joke language')).toHaveValue('hy')
    expect(screen.getByLabelText('Country')).toHaveValue('AM')
    expect(screen.getByText('Everyday observations.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Clear language/ }))
    expect(screen.getByLabelText('Joke language')).toHaveValue('')
    expect(useDiscoveryStore.getState().selection).toEqual(EMPTY_SELECTION)
    expect(screen.getByTestId('url').textContent).toContain('language=')
  })

  it('keeps unsupported URL selections visible instead of silently changing to All', () => {
    show('/explore?language=unknown')
    expect(screen.getByLabelText('Joke language')).toHaveValue('unknown')
    expect(screen.getByRole('option', { name: 'unknown (unavailable)' })).toBeInTheDocument()
  })

  it('offers an actionable catalogue failure', () => {
    const refetch = vi.fn()
    mockCatalog.mockReturnValue({ isError: true, refetch })
    show()
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load")
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(refetch).toHaveBeenCalledOnce()
  })
})
