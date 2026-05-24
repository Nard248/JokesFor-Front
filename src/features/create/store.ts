/**
 * store.ts — Phase 6 creator store.
 *
 * Persists `lastSeenAt` timestamp (epoch ms) so the header dot
 * can tell the user whether a submission status changed since they
 * last visited the creator hub.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useDrafts } from './queries'

// ── useCreatorStore ───────────────────────────────────────────────────────────

interface CreatorState {
  lastSeenAt: number
  markSeen: () => void
}

export const useCreatorStore = create<CreatorState>()(
  persist(
    (set) => ({
      lastSeenAt: 0,
      markSeen: () => set({ lastSeenAt: Date.now() }),
    }),
    { name: 'jokesfor-creator' },
  ),
)

// ── useUnseenSubmissionChange ─────────────────────────────────────────────────

/**
 * Returns true if any draft with status 'published' or 'rejected'
 * has a lastEditedAt newer than the stored lastSeenAt.
 *
 * Safe to call unconditionally (for unauthenticated users useDrafts
 * simply returns empty data; no effect on hook ordering).
 */
export function useUnseenSubmissionChange(): boolean {
  const { data } = useDrafts()
  const { lastSeenAt } = useCreatorStore()
  return (data ?? []).some(
    (d) =>
      (d.status === 'published' || d.status === 'rejected') &&
      Date.parse(d.lastEditedAt) > lastSeenAt,
  )
}
