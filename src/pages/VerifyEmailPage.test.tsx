import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'

const mockVerify = vi.fn()
const mockResend = vi.fn()
const mockUpdateUser = vi.fn()
vi.mock('@/features/auth', async (orig) => ({
  ...(await orig<typeof import('@/features/auth')>()),
  useVerifyEmail: () => ({ mutateAsync: mockVerify, isPending: false }),
  useResendVerification: () => ({ mutate: mockResend, isPending: false }),
  useUpdateUser: () => ({ mutateAsync: mockUpdateUser, isPending: false }),
}))

import { VerifyEmailPage } from './VerifyEmailPage'

function renderAt(path: string) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/register" element={<div>register-page</div>} />
          <Route path="/flow" element={<div>onboarding-page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => vi.clearAllMocks())

test('shows the email being verified', () => {
  renderAt('/verify-email?email=a%40b.com')
  expect(screen.getByText(/a@b\.com/)).toBeInTheDocument()
})

test('redirects to register when email param is missing', () => {
  renderAt('/verify-email')
  expect(screen.getByText('register-page')).toBeInTheDocument()
})

test('entering the correct code verifies and redirects', async () => {
  const user = userEvent.setup()
  mockVerify.mockResolvedValue({ user: { email: 'a@b.com' } })
  renderAt('/verify-email?email=a%40b.com')
  await user.click(screen.getAllByRole('textbox')[0])
  await user.keyboard('135790')
  await waitFor(() => expect(mockVerify).toHaveBeenCalledWith({ email: 'a@b.com', code: '135790' }))
  await waitFor(() => expect(screen.getByText('onboarding-page')).toBeInTheDocument())
})

test('applies profile fields carried from registration after a successful verify', async () => {
  const user = userEvent.setup()
  mockVerify.mockResolvedValue({ user: { email: 'a@b.com' } })
  mockUpdateUser.mockResolvedValue({})
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter
        initialEntries={[
          { pathname: '/verify-email', search: '?email=a%40b.com', state: { firstName: 'Alex', handle: 'alexj' } },
        ]}
      >
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/flow" element={<div>onboarding-page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await user.click(screen.getAllByRole('textbox')[0])
  await user.keyboard('135790')
  await waitFor(() =>
    expect(mockUpdateUser).toHaveBeenCalledWith({ first_name: 'Alex', username: 'alexj' }),
  )
  await waitFor(() => expect(screen.getByText('onboarding-page')).toBeInTheDocument())
})

test('a profile-patch failure still lets the user into the app (best-effort)', async () => {
  const user = userEvent.setup()
  mockVerify.mockResolvedValue({ user: { email: 'a@b.com' } })
  mockUpdateUser.mockRejectedValue(new Error('patch failed'))
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter
        initialEntries={[
          { pathname: '/verify-email', search: '?email=a%40b.com', state: { firstName: 'Alex', handle: 'alexj' } },
        ]}
      >
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/flow" element={<div>onboarding-page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await user.click(screen.getAllByRole('textbox')[0])
  await user.keyboard('135790')
  await waitFor(() => expect(screen.getByText('onboarding-page')).toBeInTheDocument())
})

test('429 on verify locks the inputs and steers to resend', async () => {
  const user = userEvent.setup()
  mockVerify.mockRejectedValue({ response: { status: 429, data: { detail: 'Too many attempts. Request a new code.' } } })
  renderAt('/verify-email?email=a%40b.com')
  await user.click(screen.getAllByRole('textbox')[0])
  await user.keyboard('000000')
  expect(await screen.findByText(/too many attempts/i)).toBeInTheDocument()
  // inputs disabled after the lock
  for (const box of screen.getAllByRole('textbox') as HTMLInputElement[]) {
    expect(box).toBeDisabled()
  }
  expect(screen.queryByText('onboarding-page')).not.toBeInTheDocument()
})

test('wrong code shows an inline error and does not redirect', async () => {
  const user = userEvent.setup()
  mockVerify.mockRejectedValue({ response: { status: 400, data: { code: ['Incorrect code.'] } } })
  renderAt('/verify-email?email=a%40b.com')
  await user.click(screen.getAllByRole('textbox')[0])
  await user.keyboard('000000')
  expect(await screen.findByText('Incorrect code.')).toBeInTheDocument()
  expect(screen.queryByText('onboarding-page')).not.toBeInTheDocument()
})

// When sendFailed=1 the cooldown starts at 0, so the resend button is immediately clickable.
test('resend triggers the mutation and disables the button (cooldown)', async () => {
  const user = userEvent.setup()
  mockResend.mockImplementation((_email, opts) => opts?.onSuccess?.())
  renderAt('/verify-email?email=a%40b.com&sendFailed=1')
  const resendBtn = screen.getByRole('button', { name: /resend/i })
  expect(resendBtn).not.toBeDisabled()
  await user.click(resendBtn)
  expect(mockResend).toHaveBeenCalledWith('a@b.com', expect.any(Object))
  // After onSuccess fires, cooldown is reset to 45s — button becomes disabled
  expect(resendBtn).toBeDisabled()
})

// Without sendFailed, the page starts with a 45s cooldown because a code was
// just sent by registration.
test('resend button is disabled on mount (initial cooldown) and shows countdown', () => {
  renderAt('/verify-email?email=a%40b.com')
  const resendBtn = screen.getByRole('button', { name: /resend/i })
  expect(resendBtn).toBeDisabled()
  expect(resendBtn).toHaveTextContent(/\(45s\)/)
})
