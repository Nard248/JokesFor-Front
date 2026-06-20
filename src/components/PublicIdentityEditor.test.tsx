import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockMutate = vi.fn()
type UpdateState = {
  mutate: typeof mockMutate
  isPending: boolean
  isError: boolean
  isSuccess: boolean
  error: unknown
}
type IdentityState = { data: unknown; isLoading: boolean }

let updateState: UpdateState
let identityState: IdentityState

vi.mock('@/features/profile', () => ({
  usePublicIdentity: () => identityState,
  useUpdateIdentity: () => updateState,
}))

import { PublicIdentityEditor } from './PublicIdentityEditor'

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  updateState = { mutate: mockMutate, isPending: false, isError: false, isSuccess: false, error: null }
  identityState = {
    data: { display_name: 'Pun Queen', handle: 'punqueen', name: 'Pun Queen', username: '@punqueen' },
    isLoading: false,
  }
})

describe('PublicIdentityEditor', () => {
  it('seeds inputs and preview from the loaded identity', () => {
    render(<PublicIdentityEditor />, { wrapper: makeWrapper() })
    expect((screen.getByTestId('identity-display-name') as HTMLInputElement).value).toBe('Pun Queen')
    expect((screen.getByTestId('identity-handle') as HTMLInputElement).value).toBe('punqueen')
    expect(screen.getByTestId('identity-preview').textContent).toBe('@punqueen')
  })

  it('normalizes the handle preview (trim + lowercase + @) as the user types', () => {
    render(<PublicIdentityEditor />, { wrapper: makeWrapper() })
    fireEvent.change(screen.getByTestId('identity-handle'), { target: { value: '  CoolCee  ' } })
    expect(screen.getByTestId('identity-preview').textContent).toBe('@coolcee')
  })

  it('Save calls the mutation with trimmed display_name + handle (backend normalizes case)', () => {
    render(<PublicIdentityEditor />, { wrapper: makeWrapper() })
    fireEvent.change(screen.getByTestId('identity-display-name'), { target: { value: '  Cee  ' } })
    fireEvent.change(screen.getByTestId('identity-handle'), { target: { value: '  CoolCee  ' } })
    fireEvent.click(screen.getByTestId('identity-save'))
    expect(mockMutate).toHaveBeenCalledWith({ display_name: 'Cee', handle: 'CoolCee' })
  })

  it('renders the backend validation error (e.g. handle taken)', () => {
    updateState = {
      ...updateState,
      isError: true,
      error: { response: { data: { handle: ['That handle is already taken.'] } } },
    }
    render(<PublicIdentityEditor />, { wrapper: makeWrapper() })
    expect(screen.getByTestId('identity-error').textContent).toContain('already taken')
  })

  it('renders a success confirmation after saving', () => {
    updateState = { ...updateState, isSuccess: true }
    render(<PublicIdentityEditor />, { wrapper: makeWrapper() })
    expect(screen.getByTestId('identity-success').textContent).toContain('Saved')
  })

  it('shows a loading state while the identity is fetching', () => {
    identityState = { data: undefined, isLoading: true }
    render(<PublicIdentityEditor />, { wrapper: makeWrapper() })
    expect(screen.getByText(/Loading your public identity/)).toBeTruthy()
  })
})
