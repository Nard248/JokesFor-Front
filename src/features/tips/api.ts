import { useQuery, useMutation } from '@tanstack/react-query'
import { tipsAdapter } from '@/lib/api-adapter'
import type { TipCheckoutInput, TipCheckoutResponse, TipsSummary, Tip, PaginatedResponse } from '@/lib/api'
import { TIP_TIERS } from '@/lib/api'

export type { TipCheckoutInput, TipCheckoutResponse, TipsSummary, Tip }
export { TIP_TIERS }

export const tipsKeys = {
  all: ['tips'] as const,
  summary: (creatorId: number) => [...tipsKeys.all, 'summary', creatorId] as const,
  mine: () => [...tipsKeys.all, 'mine'] as const,
}

/** Returns true if the error is a 503 billing_unavailable response — same
 * dormant signal the subscription checkout flow reacts to (billing not
 * configured on the backend yet). */
export function isTipsBillingUnavailable(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status
  return status === 503
}

/** POST /tips/checkout/ — creates a Stripe Checkout Session (payment mode)
 * for a fixed-tier tip. Callers redirect to `checkout_url` on success and
 * must treat a 503 as dormant billing (see isTipsBillingUnavailable). */
export function useCreateTipCheckout() {
  return useMutation({
    mutationFn: (input: TipCheckoutInput) => tipsAdapter.createCheckout(input),
  })
}

/** GET /creators/{id}/tips/summary/ — public. {count:0,total_cents:0} for an
 * unknown/zero creator, never 404 — callers render nothing when count is 0. */
export function useCreatorTipsSummary(creatorId: number) {
  return useQuery({
    queryKey: tipsKeys.summary(creatorId),
    queryFn: () => tipsAdapter.creatorSummary(creatorId),
    staleTime: 1000 * 60,
    enabled: Number.isFinite(creatorId),
  })
}

/** GET /users/me/tips/ — auth. DRF-paginated; read .results. */
export function useMyTips() {
  return useQuery<PaginatedResponse<Tip>>({
    queryKey: tipsKeys.mine(),
    queryFn: () => tipsAdapter.mySentTips(),
    staleTime: 1000 * 30,
  })
}
