import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'

const mockRegister = vi.fn()
vi.mock('@/features/auth', async (orig) => ({
  ...(await orig<typeof import('@/features/auth')>()),
  useRegister: () => ({ mutate: mockRegister, isPending: false }),
  useUpdateUser: () => ({ mutate: vi.fn(), isPending: false }),
}))

import { RegisterPage } from './RegisterPage'

function setup() {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<div>verify-page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const BLOCK_MSG = 'You must be at least 13 years old to use Jokes For.'

async function fillStep1(user: ReturnType<typeof userEvent.setup>, dobValue?: string) {
  await user.type(screen.getByPlaceholderText('Alex'), 'Test')
  await user.type(screen.getByPlaceholderText('you@studio.com'), 'a@b.com')
  await user.type(screen.getByPlaceholderText('At least 8 characters'), 'password123')
  if (dobValue !== undefined) {
    const dobInput = screen.getByLabelText(/date of birth/i)
    await user.clear(dobInput)
    await user.type(dobInput, dobValue)
  }
}

function clickContinue(user: ReturnType<typeof userEvent.setup>) {
  const submitBtn = screen
    .getAllByRole('button', { name: /continue/i })
    .find((b) => (b as HTMLButtonElement).type === 'submit')
  return user.click(submitBtn!)
}

test('DOB field is present and required to advance past step 1', async () => {
  const user = userEvent.setup()
  setup()
  expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument()
  // Fill everything EXCEPT dob, then try to continue — should stay on step 1.
  await fillStep1(user) // no dob
  await clickContinue(user)
  // Still on step 1: the "Create account" button (step 2) is absent.
  expect(screen.queryByRole('button', { name: /create account/i })).not.toBeInTheDocument()
})

test('an under-13 DOB surfaces the block message and does not navigate', async () => {
  const user = userEvent.setup()
  mockRegister.mockImplementation((_vars: unknown, opts: { onError: (e: unknown) => void }) =>
    opts.onError({ response: { status: 400, data: { date_of_birth: [BLOCK_MSG] } } }),
  )
  setup()
  await fillStep1(user, '2020-01-01') // clearly under 13
  await clickContinue(user)
  await user.click(screen.getByRole('button', { name: /create account/i }))
  expect(await screen.findByText(BLOCK_MSG)).toBeInTheDocument()
  expect(screen.queryByText('verify-page')).not.toBeInTheDocument()
})

test('a 13+ DOB includes date_of_birth and proceeds to verify-email', async () => {
  const user = userEvent.setup()
  mockRegister.mockImplementation((vars: { date_of_birth?: string }, opts: { onSuccess: (d: unknown) => void }) => {
    expect(vars.date_of_birth).toBe('2000-01-01')
    opts.onSuccess({ detail: 'Verification code sent to your email.', email: 'a@b.com' })
  })
  setup()
  await fillStep1(user, '2000-01-01')
  await clickContinue(user)
  await user.click(screen.getByRole('button', { name: /create account/i }))
  await waitFor(() => expect(screen.getByText('verify-page')).toBeInTheDocument())
  expect(mockRegister).toHaveBeenCalledWith(
    expect.objectContaining({ date_of_birth: '2000-01-01' }),
    expect.any(Object),
  )
})
