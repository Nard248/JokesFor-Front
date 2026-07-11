import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, beforeEach, afterEach, test, expect } from 'vitest'

vi.mock('@/features/auth', async (orig) => ({
  ...(await orig<typeof import('@/features/auth')>()),
  useRegister: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateUser: () => ({ mutate: vi.fn(), isPending: false }),
}))

const mockStashSignupDob = vi.fn((_dob: string) => {})
const mockGetGoogleAuthUrl = vi.fn(
  (_returnTo?: string) => 'https://accounts.google.com/o/oauth2/v2/auth?x=1',
)
vi.mock('@/features/auth/google-oauth', async (orig) => ({
  ...(await orig<typeof import('@/features/auth/google-oauth')>()),
  stashSignupDob: (dob: string) => mockStashSignupDob(dob),
  getGoogleAuthUrl: (returnTo?: string) => mockGetGoogleAuthUrl(returnTo),
}))

import { RegisterPage } from './RegisterPage'

const BLOCK_MSG = 'You must be at least 13 years old to use Jokes For.'

// jsdom throws on real navigation; swap window.location for a writable stub.
const originalLocation = window.location
beforeEach(() => {
  mockStashSignupDob.mockClear()
  mockGetGoogleAuthUrl.mockClear()
  // @ts-expect-error override read-only location for the test
  delete window.location
  // @ts-expect-error minimal stub
  window.location = { href: '' }
})
afterEach(() => {
  // @ts-expect-error restore
  window.location = originalLocation
})

function setup() {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function setDob(user: ReturnType<typeof userEvent.setup>, value: string) {
  const dobInput = screen.getByLabelText(/date of birth/i)
  await user.clear(dobInput)
  await user.type(dobInput, value)
}

test('Continue with Google without a DOB does not redirect and asks for DOB', async () => {
  const user = userEvent.setup()
  setup()
  await user.click(screen.getByRole('button', { name: /continue with google/i }))

  expect(await screen.findByText(/date of birth first/i)).toBeInTheDocument()
  expect(mockStashSignupDob).not.toHaveBeenCalled()
  expect(mockGetGoogleAuthUrl).not.toHaveBeenCalled()
  expect(window.location.href).toBe('')
})

test('Continue with Google with an under-13 DOB shows the block message, no redirect', async () => {
  const user = userEvent.setup()
  setup()
  await setDob(user, '2020-01-01')
  await user.click(screen.getByRole('button', { name: /continue with google/i }))

  expect(await screen.findByText(BLOCK_MSG)).toBeInTheDocument()
  expect(mockStashSignupDob).not.toHaveBeenCalled()
  expect(mockGetGoogleAuthUrl).not.toHaveBeenCalled()
})

test('Continue with Google with a valid DOB stashes it and redirects to Google', async () => {
  const user = userEvent.setup()
  setup()
  await setDob(user, '2000-01-01')
  await user.click(screen.getByRole('button', { name: /continue with google/i }))

  expect(mockStashSignupDob).toHaveBeenCalledWith('2000-01-01')
  expect(mockGetGoogleAuthUrl).toHaveBeenCalledWith('/flow')
  expect(window.location.href).toBe('https://accounts.google.com/o/oauth2/v2/auth?x=1')
})
