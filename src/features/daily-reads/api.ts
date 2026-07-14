import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dailyReadsApi, type DailyReadsStatus } from '@/lib/api'
import { useDailyReadsStore } from './store'

export const dailyReadsKeys = {
  all: ['daily-reads'] as const,
}

// Mirror the mock gate used across the app: with no real API URL (or mocks
// forced) there IS no /jokes/daily-reads/ endpoint, so the cap is simply
// inactive and we never fire a doomed request. Read at call time so the value
// tracks the environment (and is stubbable in tests). Named without a `use`
// prefix so it isn't mistaken for a React hook.
function isMockMode(): boolean {
  return !import.meta.env.VITE_API_URL || import.meta.env.VITE_USE_MOCKS === 'true'
}

export interface DailyReadsView {
  /** True only when the backend returned a NUMERIC limit (a real free cap). */
  active: boolean
  limit: number | null
  used: number | null
  /** Effective remaining after optimistic decrements; null when uncapped. */
  remaining: number | null
  /** True once the free cap is exhausted (server- or optimistically-derived). */
  over: boolean
  /** ISO next-reset instant (next midnight UTC), or null when unknown. */
  resetAt: string | null
  /** Has this joke already been revealed this session? Those stay open. */
  hasRevealed: (id: number) => boolean
  /** May this joke be revealed now? (already-revealed, uncapped, or remaining > 0) */
  canReveal: (id: number) => boolean
  /** Record a genuine reveal (updates session state + optimistic remaining). */
  registerReveal: (id: number) => void
}

/**
 * Freemium daily-reads state + client-side cap enforcement.
 *
 * GRACEFUL DEGRADATION: the query never throws — a 404/error (backend not
 * deployed) resolves to `null`, which reads as "no cap" (`active: false`), so
 * nothing about the paywall is visible until the backend ships.
 */
export function useDailyReads(): DailyReadsView {
  const revealedIds = useDailyReadsStore((s) => s.revealedIds)
  const optimisticSpent = useDailyReadsStore((s) => s.optimisticSpent)
  const registerReveal = useDailyReadsStore((s) => s.registerReveal)
  const resetOptimistic = useDailyReadsStore((s) => s.resetOptimistic)

  const query = useQuery({
    queryKey: dailyReadsKeys.all,
    queryFn: async (): Promise<DailyReadsStatus | null> => {
      if (isMockMode()) return null
      try {
        const { data } = await dailyReadsApi.get()
        return data
      } catch {
        // 404 (endpoint absent) or any transport error → treat as no cap.
        return null
      }
    },
    staleTime: 1000 * 30,
    retry: false,
  })

  // Reconcile optimistic reveals with the server whenever fresh data lands.
  const updatedAt = query.dataUpdatedAt
  useEffect(() => {
    resetOptimistic()
  }, [updatedAt, resetOptimistic])

  const raw = query.data ?? null
  // A cap is active only when the backend gives a numeric limit. `limit: null`
  // means paid/unlimited (no cap); missing data means the endpoint is absent.
  const active = !!raw && typeof raw.limit === 'number'
  const serverRemaining = active && typeof raw!.remaining === 'number' ? raw!.remaining : null
  const remaining =
    serverRemaining != null ? Math.max(0, serverRemaining - optimisticSpent) : null
  const over = active ? !!raw!.over || (remaining != null && remaining <= 0) : false

  const hasRevealed = (id: number) => revealedIds.has(id)
  const canReveal = (id: number) =>
    revealedIds.has(id) || !active || (remaining != null && remaining > 0)

  return {
    active,
    limit: active ? raw!.limit : null,
    used: active ? raw!.used ?? null : null,
    remaining,
    over,
    resetAt: raw?.reset_at ?? null,
    hasRevealed,
    canReveal,
    registerReveal,
  }
}
