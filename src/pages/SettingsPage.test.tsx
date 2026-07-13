/**
 * SettingsPage tests — GDPR / account control wiring.
 *
 *  1. Change password: submitting the modal form sends old_password +
 *     new_password1 + new_password2 (OLD_PASSWORD_FIELD_ENABLED on the backend).
 *  2. Delete account: the confirm button stays disabled until the user types
 *     DELETE, then calls the delete mutation and redirects to a logged-out page.
 *  3. Export data: clicking Export my data calls the export mutation (which
 *     performs the blob download).
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

// ── Router: keep everything real except useNavigate ──────────────────────────
const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── Passthrough / stub components ────────────────────────────────────────────
vi.mock('@/components/FlowAppShell', () => ({
  FlowAppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="shell">{children}</div>,
}))
vi.mock('@/components/PublicIdentityEditor', () => ({ PublicIdentityEditor: () => <div /> }))
vi.mock('@/components/BlockedUsersList', () => ({ BlockedUsersList: () => <div /> }))

const mockToast = vi.fn()
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ toast: mockToast }) }))

// ── Preferences hooks ────────────────────────────────────────────────────────
vi.mock('@/features/preferences', () => ({
  usePreferences: () => ({
    data: {
      theme: 'light',
      notifications: { dailyJoke: true, trendingAlerts: false, collectionUpdates: true, emailDigest: false },
      privacy: { publicProfile: true, showActivity: true, shareAnalytics: false },
    },
  }),
  useUpdatePreferences: () => ({ mutate: vi.fn() }),
}))

// ── Auth hooks ───────────────────────────────────────────────────────────────
const mockPasswordChangeMutate = vi.fn()
const mockDeleteMutate = vi.fn((_payload: unknown, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.())
const mockExportMutate = vi.fn()
const mockLogoutMutate = vi.fn()

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { pk: 1, email: 'a@b.com', username: 'ab', first_name: 'A', last_name: 'B' } }),
  useLogout: () => ({ mutate: mockLogoutMutate, isPending: false }),
  usePasswordChange: () => ({ mutate: mockPasswordChangeMutate, isPending: false }),
  useDeleteAccount: () => ({ mutate: mockDeleteMutate, isPending: false }),
  useDataExport: () => ({ mutate: mockExportMutate, isPending: false }),
}))

import { SettingsPage } from './SettingsPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SettingsPage — change password', () => {
  it('sends old_password + new_password1 + new_password2', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /change password/i }))
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'oldpass123' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpass456' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'newpass456' } })

    // Modal content is portaled to document.body, so query the document.
    fireEvent.submit(document.getElementById('change-password-form') as HTMLFormElement)

    expect(mockPasswordChangeMutate).toHaveBeenCalledTimes(1)
    expect(mockPasswordChangeMutate.mock.calls[0][0]).toEqual({
      old_password: 'oldpass123',
      new_password1: 'newpass456',
      new_password2: 'newpass456',
    })
  })

  it('blocks submit when the new passwords differ (no request sent)', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /change password/i }))
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'oldpass123' } })
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'newpass456' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'different99' } })
    fireEvent.submit(document.getElementById('change-password-form') as HTMLFormElement)

    expect(mockPasswordChangeMutate).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/do not match/i)
  })
})

describe('SettingsPage — delete account', () => {
  it('requires typing DELETE, then calls the endpoint and redirects logged-out', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /delete my account/i }))

    // Confirm button is disabled until the user types DELETE.
    const confirmBtn = screen.getByRole('button', { name: /delete forever/i })
    expect(confirmBtn).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/type delete to confirm/i), { target: { value: 'DELETE' } })
    expect(confirmBtn).toBeEnabled()

    fireEvent.click(confirmBtn)

    expect(mockDeleteMutate).toHaveBeenCalledTimes(1)
    expect(mockDeleteMutate.mock.calls[0][0]).toMatchObject({ confirm: 'DELETE' })
    // On success the hook clears auth; the page redirects to a logged-out page.
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true }))
  })

  it('includes the current password in the payload when provided', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /delete my account/i }))
    fireEvent.change(screen.getByLabelText(/type delete to confirm/i), { target: { value: 'DELETE' } })
    fireEvent.change(screen.getByLabelText(/current password for account deletion/i), { target: { value: 'mypw' } })
    fireEvent.click(screen.getByRole('button', { name: /delete forever/i }))

    expect(mockDeleteMutate.mock.calls[0][0]).toEqual({ confirm: 'DELETE', password: 'mypw' })
  })
})

describe('SettingsPage — export data', () => {
  it('triggers the export/download mutation', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /export my data/i }))
    expect(mockExportMutate).toHaveBeenCalledTimes(1)
  })
})
