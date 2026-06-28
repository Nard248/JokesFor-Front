import { sharesApi, type SharePlatform } from '@/lib/api'
import { getAccessToken } from '@/lib/axios'
import { useAuthStore } from '@/features/auth/store'

const USE_MOCKS =
  !import.meta.env.VITE_API_URL || import.meta.env.VITE_USE_MOCKS === 'true'

/**
 * Fire-and-forget POST /jokes/:id/share/ alongside a clipboard copy. Only
 * runs in real-API mode for an authenticated user; otherwise a no-op. Never
 * throws — share UX must not depend on the analytics call succeeding.
 */
export function recordShare(jokeId: number, platform: SharePlatform = 'copy'): void {
  try {
    if (USE_MOCKS) return
    if (!getAccessToken()) return
    if (!useAuthStore.getState().isAuthenticated) return
    if (!Number.isFinite(jokeId) || jokeId <= 0) return

    void sharesApi.share(jokeId, platform).catch(() => { /* fire-and-forget */ })
  } catch {
    /* never throw */
  }
}
