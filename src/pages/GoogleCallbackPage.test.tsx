import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { vi, beforeEach, test, expect } from 'vitest'

const mockMutateAsync = vi.fn()
// Stable object so the callback page's effect deps don't churn across renders.
const googleAuthMock = { mutateAsync: mockMutateAsync }
vi.mock('@/features/auth', async (orig) => ({
  ...(await orig<typeof import('@/features/auth')>()),
  useGoogleAuth: () => googleAuthMock,
}))

import { GoogleCallbackPage } from './GoogleCallbackPage'
import { stashSignupDob } from '@/features/auth/google-oauth'

const BLOCK_MSG = 'You must be at least 13 years old to use Jokes For.'

function setup() {
  return render(
    <MemoryRouter initialEntries={['/auth/google/callback?code=auth-code-123']}>
      <Routes>
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
        <Route path="/" element={<div>home-page</div>} />
        {/* Stand-in for the register page; reads the routed notice from state. */}
        <Route path="/register" element={<RegisterStub />} />
      </Routes>
    </MemoryRouter>,
  )
}

// Minimal register stand-in that renders the notice passed via nav state.
function RegisterStub() {
  return <div>register-page</div>
}

beforeEach(() => {
  mockMutateAsync.mockReset()
  sessionStorage.clear()
})

test('signup path sends date_of_birth on the SINGLE POST and never prompts', async () => {
  // Signup stashed a valid DOB before the Google redirect.
  stashSignupDob('2000-01-01')
  mockMutateAsync.mockResolvedValue({ user: { pk: 1 }, access: 'jwt' })
  setup()

  await waitFor(() => expect(screen.getByText('home-page')).toBeInTheDocument())
  expect(mockMutateAsync).toHaveBeenCalledTimes(1)
  expect(mockMutateAsync.mock.calls[0][0]).toMatchObject({
    code: 'auth-code-123',
    date_of_birth: '2000-01-01',
  })
  // No DOB prompt anywhere — it was collected before the redirect.
  expect(screen.queryByLabelText(/date of birth/i)).not.toBeInTheDocument()
  // Stashed DOB is consumed (cleared) after use.
  expect(sessionStorage.getItem('auth.signupDob')).toBeNull()
})

test('returning user (login path, no stashed DOB) logs in without any DOB', async () => {
  mockMutateAsync.mockResolvedValue({ user: { pk: 2 }, access: 'jwt' })
  setup()

  await waitFor(() => expect(screen.getByText('home-page')).toBeInTheDocument())
  expect(mockMutateAsync).toHaveBeenCalledTimes(1)
  expect(mockMutateAsync.mock.calls[0][0]).not.toHaveProperty('date_of_birth')
})

test('new user via login button (dob_required) routes to /register and does NOT re-POST the spent code', async () => {
  // No stashed DOB → login path. Backend says this is a brand-new user.
  mockMutateAsync.mockRejectedValueOnce({
    response: { status: 400, data: { code: 'dob_required' } },
  })
  setup()

  await waitFor(() => expect(screen.getByText('register-page')).toBeInTheDocument())
  // Critical: the single-use code is discarded, never exchanged a second time.
  expect(mockMutateAsync).toHaveBeenCalledTimes(1)
})

test('under-13 rejection shows the same block message and does not navigate', async () => {
  stashSignupDob('2020-01-01') // tampered/edge under-13 DOB reaches the backend
  mockMutateAsync.mockRejectedValueOnce({
    response: { status: 400, data: { date_of_birth: [BLOCK_MSG] } },
  })
  setup()

  expect(await screen.findByText(BLOCK_MSG)).toBeInTheDocument()
  expect(screen.queryByText('home-page')).not.toBeInTheDocument()
  expect(mockMutateAsync).toHaveBeenCalledTimes(1)
})
