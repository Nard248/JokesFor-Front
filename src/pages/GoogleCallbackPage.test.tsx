import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { vi, beforeEach, test, expect } from 'vitest'

const mockMutateAsync = vi.fn()
// Stable object so the callback page's useCallback deps don't churn.
const googleAuthMock = { mutateAsync: mockMutateAsync }
vi.mock('@/features/auth', async (orig) => ({
  ...(await orig<typeof import('@/features/auth')>()),
  useGoogleAuth: () => googleAuthMock,
}))

import { GoogleCallbackPage } from './GoogleCallbackPage'

const BLOCK_MSG = 'You must be at least 13 years old to use Jokes For.'

function setup() {
  return render(
    <MemoryRouter initialEntries={['/auth/google/callback?code=auth-code-123']}>
      <Routes>
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
        <Route path="/" element={<div>home-page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockMutateAsync.mockReset()
  sessionStorage.clear()
})

test('returning user (200) navigates without ever prompting for DOB', async () => {
  mockMutateAsync.mockResolvedValue({ user: { pk: 1 }, access: 'jwt' })
  setup()

  await waitFor(() => expect(screen.getByText('home-page')).toBeInTheDocument())
  // No DOB prompt for an ordinary returning-user login.
  expect(screen.queryByLabelText(/date of birth/i)).not.toBeInTheDocument()
  expect(mockMutateAsync).toHaveBeenCalledTimes(1)
  expect(mockMutateAsync.mock.calls[0][0]).not.toHaveProperty('date_of_birth')
})

test('dob_required triggers the DOB prompt and resubmits code + date_of_birth', async () => {
  const user = userEvent.setup()
  mockMutateAsync
    .mockRejectedValueOnce({ response: { status: 400, data: { code: 'dob_required' } } })
    .mockResolvedValueOnce({ user: { pk: 2 }, access: 'jwt' })
  setup()

  // Prompt appears (not an error screen).
  const dobInput = await screen.findByLabelText(/date of birth/i)
  expect(screen.queryByText(/couldn't sign you in/i)).not.toBeInTheDocument()

  fireEvent.change(dobInput, { target: { value: '2000-01-01' } })
  await user.click(screen.getByRole('button', { name: /continue/i }))

  await waitFor(() => expect(screen.getByText('home-page')).toBeInTheDocument())
  expect(mockMutateAsync).toHaveBeenCalledTimes(2)
  expect(mockMutateAsync.mock.calls[1][0]).toMatchObject({
    code: 'auth-code-123',
    date_of_birth: '2000-01-01',
  })
})

test('under-13 resubmission shows the same block message and does not navigate', async () => {
  const user = userEvent.setup()
  mockMutateAsync
    .mockRejectedValueOnce({ response: { status: 400, data: { code: 'dob_required' } } })
    .mockRejectedValueOnce({ response: { status: 400, data: { date_of_birth: [BLOCK_MSG] } } })
  setup()

  const dobInput = await screen.findByLabelText(/date of birth/i)
  fireEvent.change(dobInput, { target: { value: '2020-01-01' } }) // under 13
  await user.click(screen.getByRole('button', { name: /continue/i }))

  expect(await screen.findByText(BLOCK_MSG)).toBeInTheDocument()
  expect(screen.queryByText('home-page')).not.toBeInTheDocument()
})
