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
