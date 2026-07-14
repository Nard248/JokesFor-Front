import { create } from 'zustand'

/**
 * Session-scoped paywall state (client-side enforcement + optimistic UX).
 *
 * The SERVER strip (`is_locked`) is the hard freemium boundary; this store is
 * the tightening + nice UX on top of it:
 *   - `revealedIds`     jokes genuinely revealed THIS page-session. Already-
 *                       revealed cards stay open even after the cap is hit.
 *   - `optimisticSpent` reveals since the last successful /daily-reads/ fetch,
 *                       used to decrement `remaining` immediately. Reconciled
 *                       (reset to 0) whenever fresh server data lands.
 *   - `nudgeDismissed`  the one-time "go unlimited" nudge is shown once per
 *                       session, then dismissed for good.
 */
interface DailyReadsState {
  revealedIds: Set<number>
  optimisticSpent: number
  nudgeDismissed: boolean
  /** Record a genuine, distinct reveal. No-op (and no decrement) if already seen. */
  registerReveal: (id: number) => void
  /** Drop the optimistic offset once authoritative server data arrives. */
  resetOptimistic: () => void
  /** Dismiss the one-time over-cap nudge for the rest of the session. */
  dismissNudge: () => void
}

export const useDailyReadsStore = create<DailyReadsState>((set) => ({
  revealedIds: new Set<number>(),
  optimisticSpent: 0,
  nudgeDismissed: false,
  registerReveal: (id) =>
    set((s) => {
      if (s.revealedIds.has(id)) return s
      const next = new Set(s.revealedIds)
      next.add(id)
      return { revealedIds: next, optimisticSpent: s.optimisticSpent + 1 }
    }),
  resetOptimistic: () => set((s) => (s.optimisticSpent === 0 ? s : { optimisticSpent: 0 })),
  dismissNudge: () => set((s) => (s.nudgeDismissed ? s : { nudgeDismissed: true })),
}))

/** Test-only: reset the session store between cases. */
export function __resetDailyReadsStore(): void {
  useDailyReadsStore.setState({
    revealedIds: new Set<number>(),
    optimisticSpent: 0,
    nudgeDismissed: false,
  })
}
