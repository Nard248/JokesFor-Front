import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store'
import { billingKeys } from '@/features/billing'
import { billingAdapter } from '@/lib/api-adapter'

/** Entitlement feature keys that make up the paid Creator Pro plan. */
export const CREATOR_PRO_FEATURES = [
  'creator_content_explorer',
  'creator_exports',
  'creator_community_insights',
] as const

export type CreatorProFeature = (typeof CREATOR_PRO_FEATURES)[number]
export type CreatorPlanFeatures = Record<CreatorProFeature, boolean>

const NO_FEATURES: CreatorPlanFeatures = {
  creator_content_explorer: false,
  creator_exports: false,
  creator_community_insights: false,
}

/** Keyed under the billing entitlements prefix (so billing invalidations reach
 *  it) and by account, so one account's plan never renders for another. */
export const creatorPlanKeys = {
  plan: (account: number | string | null) => [...billingKeys.entitlements(), 'creator-plan', account] as const,
}

export interface CreatorPlan {
  /** True when the account holds any Creator Pro tool. */
  isPro: boolean
  features: CreatorPlanFeatures
  isLoading: boolean
  isError: boolean
}

/**
 * The single source of Creator Pro state for Creator Studio pages. The server
 * stays authoritative — every Pro endpoint enforces its own entitlement; this
 * only drives labels, badges and which locked state a 403 should explain.
 */
export function useCreatorPlan(): CreatorPlan {
  const account = useAuthStore((state) => (state.isAuthenticated ? (state.user?.pk ?? 'me') : null))
  const query = useQuery({
    queryKey: creatorPlanKeys.plan(account),
    queryFn: () => billingAdapter.entitlements(),
    enabled: account !== null,
    staleTime: 1000 * 60 * 2,
    retry: false,
  })
  const raw = query.data?.features
  const features: CreatorPlanFeatures = raw
    ? {
        creator_content_explorer: raw.creator_content_explorer === true,
        creator_exports: raw.creator_exports === true,
        creator_community_insights: raw.creator_community_insights === true,
      }
    : NO_FEATURES
  return {
    isPro: CREATOR_PRO_FEATURES.some((key) => features[key]),
    features,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
