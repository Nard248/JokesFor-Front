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

/**
 * Approach: mock useRegister so that mutate(vars, opts) immediately calls
 * opts.onSuccess with a gated-mode payload (no 'access' key).
 * This avoids driving the full multi-step form. We fill the Step 1 required
 * fields (firstName, email, password) and click Continue to reach Step 2,
 * then click "Create account & start setup" to trigger handleFinish which
 * calls registerMutation.mutate — the mock fires onSuccess synchronously.
 */
test('gated-mode registration routes to /verify-email with the email', async () => {
  const user = userEvent.setup()
  // Mock registers an immediate onSuccess with a gated (no-token) response
  mockRegister.mockImplementation((_vars: unknown, opts: { onSuccess: (d: unknown) => void }) =>
    opts.onSuccess({ detail: 'Verification code sent to your email.', email: 'a@b.com' }),
  )
  setup()

  // Step 1: fill required fields
  await user.type(screen.getByPlaceholderText('Alex'), 'Test')
  await user.type(screen.getByPlaceholderText('you@studio.com'), 'a@b.com')
  await user.type(screen.getByPlaceholderText('At least 8 characters'), 'password123')
  const dobInput = screen.getByLabelText(/date of birth/i)
  await user.type(dobInput, '2000-01-01')
  // Continue to Step 2 — the submit button is type="submit" with text "Continue"
  const continueButtons = screen.getAllByRole('button', { name: /continue/i })
  // There may be a Google icon button and others; the one we need is type=submit
  const submitBtn = continueButtons.find(
    (b) => (b as HTMLButtonElement).type === 'submit',
  )
  await user.click(submitBtn!)

  // Step 2: click Create account
  await user.click(screen.getByRole('button', { name: /create account/i }))

  // Should navigate to verify-page
  await waitFor(() => expect(screen.getByText('verify-page')).toBeInTheDocument())
})

test('registration 502 (email send failed) routes to verify with the form email', async () => {
  const user = userEvent.setup()
  // Mock registers an immediate onError with a 502 (account created, send failed)
  mockRegister.mockImplementation((_vars: unknown, opts: { onError: (e: unknown) => void }) =>
    opts.onError({ response: { status: 502, data: { detail: 'Email failed to send.', email: 'a@b.com' } } }),
  )
  setup()

  await user.type(screen.getByPlaceholderText('Alex'), 'Test')
  await user.type(screen.getByPlaceholderText('you@studio.com'), 'a@b.com')
  await user.type(screen.getByPlaceholderText('At least 8 characters'), 'password123')
  const dobInput = screen.getByLabelText(/date of birth/i)
  await user.type(dobInput, '2000-01-01')
  const submitBtn = screen
    .getAllByRole('button', { name: /continue/i })
    .find((b) => (b as HTMLButtonElement).type === 'submit')
  await user.click(submitBtn!)
  await user.click(screen.getByRole('button', { name: /create account/i }))

  await waitFor(() => expect(screen.getByText('verify-page')).toBeInTheDocument())
})
