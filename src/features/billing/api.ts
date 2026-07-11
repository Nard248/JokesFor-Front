import { useQuery, useMutation } from '@tanstack/react-query'
import { billingAdapter } from '@/lib/api-adapter'
import type { BillingPlan, MySubscription, BillingEntitlements, CheckoutSessionResponse, PortalSessionResponse } from '@/lib/api'

export type { BillingPlan, MySubscription, BillingEntitlements, CheckoutSessionResponse, PortalSessionResponse }

export const billingKeys = {
  all: ['billing'] as const,
  plans: () => [...billingKeys.all, 'plans'] as const,
  subscription: () => [...billingKeys.all, 'subscription'] as const,
  entitlements: () => [...billingKeys.all, 'entitlements'] as const,
}

/** Returns true if the error is a 503 billing_unavailable response. */
export function isBillingUnavailable(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status
  return status === 503
}

/**
 * Returns true if checkout was rejected because the user already has a live
 * paid subscription (backend 409 with code `active_subscription`). Callers must
 * route the user to the Customer Portal instead of opening a second checkout.
 */
export function isActiveSubscriptionConflict(error: unknown): boolean {
  const res = (error as { response?: { status?: number; data?: { code?: string } } })?.response
  return res?.status === 409 && res?.data?.code === 'active_subscription'
}

/** Extracts a portal_url from a 409 active_subscription response, if present. */
export function getConflictPortalUrl(error: unknown): string | null {
  return (
    (error as { response?: { data?: { portal_url?: string } } })?.response?.data?.portal_url ?? null
  )
}

export function useBillingPlans() {
  return useQuery({
    queryKey: billingKeys.plans(),
    queryFn: () => billingAdapter.listPlans(),
    staleTime: 1000 * 60 * 10,
  })
}

export function useMySubscription() {
  return useQuery({
    queryKey: billingKeys.subscription(),
    queryFn: () => billingAdapter.mySubscription(),
    staleTime: 1000 * 60 * 2,
  })
}

export function useEntitlements() {
  return useQuery({
    queryKey: billingKeys.entitlements(),
    queryFn: () => billingAdapter.entitlements(),
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: (plan_slug: string) => billingAdapter.createCheckoutSession(plan_slug),
  })
}

export function useCreatePortalSession() {
  return useMutation({
    mutationFn: () => billingAdapter.createPortalSession(),
  })
}
