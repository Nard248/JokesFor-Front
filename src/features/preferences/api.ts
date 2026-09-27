import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth/store'
import { setAccountAnalyticsPreference, withdrawAccountAnalytics, isAccountAnalyticsWithdrawn } from '@/features/telemetry/session'
import { useQuery, useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import { preferencesAdapter } from '@/lib/api-adapter'
import type { UserPreferences } from '@/lib/mock-data'

export const preferencesKeys = {
  all: ['preferences'] as const,
  user: (owner: number | undefined) => ['preferences', owner] as const,
}

export function usePreferences() {
  const owner = useAuthStore((state) => state.isAuthenticated ? state.user?.pk : undefined)
  const query = useQuery({
    queryKey: preferencesKeys.user(owner),
    queryFn: () => preferencesAdapter.get(),
    enabled: owner !== undefined,
    staleTime: 1000 * 60 * 10,
  })
  useEffect(() => {
    if (owner !== undefined && query.data) {
      setAccountAnalyticsPreference(owner, query.data.privacy.shareAnalytics)
    }
  }, [owner, query.data])
  return {
    ...query,
    data: query.data && isAccountAnalyticsWithdrawn(owner)
      ? { ...query.data, privacy: { ...query.data.privacy, shareAnalytics: false } }
      : query.data,
  }
}

type PreferenceIntent = { owner: number | undefined; data: Partial<UserPreferences> }
type MutationContext = { owner: number | undefined }
type PreferenceOptions = MutateOptions<UserPreferences, Error, Partial<UserPreferences>, MutationContext>

export function useUpdatePreferences() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ owner, data }: PreferenceIntent) => {
      const current = useAuthStore.getState()
      // cancelQueries is asynchronous: a different reader may have signed in
      // since the click. Never send this account's intent with their credentials.
      if (owner === undefined || !current.isAuthenticated || current.user?.pk !== owner) {
        throw new Error('Your account changed. Please retry this setting.')
      }
      return preferencesAdapter.update(data)
    },
    onMutate: async ({ owner, data }: PreferenceIntent) => {
      if (owner !== undefined && data.privacy?.shareAnalytics === false) {
        withdrawAccountAnalytics(owner)
        queryClient.setQueryData<UserPreferences>(preferencesKeys.user(owner), (previous) => previous
          ? { ...previous, privacy: { ...previous.privacy, shareAnalytics: false } }
          : previous)
      }
      await queryClient.cancelQueries({ queryKey: preferencesKeys.user(owner) })
      return { owner }
    },
    onSuccess: (updated, intent) => {
      const owner = intent.owner
      if (owner === undefined) return
      queryClient.setQueryData(preferencesKeys.user(owner), updated)
      setAccountAnalyticsPreference(owner, updated.privacy.shareAnalytics, intent.data.privacy?.shareAnalytics === true)
      queryClient.invalidateQueries({ queryKey: ['daily-joke', 'today'] })
    },
  })
  const bindOptions = (options?: PreferenceOptions): MutateOptions<UserPreferences, Error, PreferenceIntent, MutationContext> => ({
    onSuccess: (data, intent, result, context) => options?.onSuccess?.(data, intent.data, result, context),
    onError: (error, intent, result, context) => options?.onError?.(error, intent.data, result, context),
    onSettled: (data, error, intent, result, context) => options?.onSettled?.(data, error, intent.data, result, context),
  })
  return {
    ...mutation,
    variables: mutation.variables?.data,
    mutate: (data: Partial<UserPreferences>, options?: PreferenceOptions) => {
      mutation.mutate({ owner: useAuthStore.getState().user?.pk, data }, bindOptions(options))
    },
    mutateAsync: (data: Partial<UserPreferences>, options?: PreferenceOptions) => {
      return mutation.mutateAsync({ owner: useAuthStore.getState().user?.pk, data }, bindOptions(options))
    },
  }
}
