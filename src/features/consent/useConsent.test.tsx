import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { readConsent } from './storage'

// Mock initAnalytics so it never hits Firebase
const mockInitAnalytics = vi.fn(async () => null)
vi.mock('@/lib/firebase', () => ({
  initAnalytics: mockInitAnalytics,
  isAnalyticsInitialized: vi.fn(() => false),
}))

// Mock the auth store — we'll control getState().user per test
const mockGetState = vi.fn(() => ({ user: null as { date_of_birth?: string | null } | null }))
vi.mock('@/features/auth/store', () => ({
  useAuthStore: Object.assign(
    // Render-time hook usage is not needed in these tests, but include a no-op
    vi.fn(() => ({ user: null })),
    { getState: mockGetState },
  ),
}))

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  mockGetState.mockReturnValue({ user: null })
})

// Import after mocks are set up
const { useConsent } = await import('./useConsent')

describe('useConsent — accept()', () => {
  it('persists analytics:true and calls initAnalytics when user is adult', async () => {
    // 25-year-old user
    const dob = new Date()
    dob.setFullYear(dob.getFullYear() - 25)
    mockGetState.mockReturnValue({ user: { date_of_birth: dob.toISOString().slice(0, 10) } })

    const { result } = renderHook(() => useConsent())
    expect(result.current.decided).toBe(false)

    await act(async () => { result.current.accept() })

    expect(readConsent()?.analytics).toBe(true)
    expect(mockInitAnalytics).toHaveBeenCalledTimes(1)
    expect(result.current.decided).toBe(true)
  })

  it('persists analytics:true but does NOT call initAnalytics for under-18 user', async () => {
    const dob = new Date()
    dob.setFullYear(dob.getFullYear() - 16)
    mockGetState.mockReturnValue({ user: { date_of_birth: dob.toISOString().slice(0, 10) } })

    const { result } = renderHook(() => useConsent())
    await act(async () => { result.current.accept() })

    expect(readConsent()?.analytics).toBe(true)
    expect(mockInitAnalytics).not.toHaveBeenCalled()
    expect(result.current.decided).toBe(true)
  })

  it('persists analytics:true but does NOT call initAnalytics for anon user (no DOB)', async () => {
    mockGetState.mockReturnValue({ user: null })

    const { result } = renderHook(() => useConsent())
    await act(async () => { result.current.accept() })

    expect(readConsent()?.analytics).toBe(true)
    expect(mockInitAnalytics).not.toHaveBeenCalled()
    expect(result.current.decided).toBe(true)
  })
})

describe('useConsent — reject()', () => {
  it('persists analytics:false and never calls initAnalytics', async () => {
    const dob = new Date()
    dob.setFullYear(dob.getFullYear() - 30)
    mockGetState.mockReturnValue({ user: { date_of_birth: dob.toISOString().slice(0, 10) } })

    const { result } = renderHook(() => useConsent())
    await act(async () => { result.current.reject() })

    expect(readConsent()?.analytics).toBe(false)
    expect(mockInitAnalytics).not.toHaveBeenCalled()
    expect(result.current.decided).toBe(true)
  })
})

describe('useConsent — initial state', () => {
  it('decided is false initially when no localStorage record exists', () => {
    const { result } = renderHook(() => useConsent())
    expect(result.current.decided).toBe(false)
    expect(result.current.consent).toBeNull()
  })

  it('decided is true when a current-version record already exists', () => {
    // Pre-seed localStorage
    localStorage.setItem('jokesfor-consent', JSON.stringify({ version: 1, analytics: true, ts: Date.now() }))
    const { result } = renderHook(() => useConsent())
    expect(result.current.decided).toBe(true)
  })
})
