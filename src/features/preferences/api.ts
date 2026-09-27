import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query'
import {
  setAccountAnalyticsPreference, withdrawAccountAnalytics, isAccountAnalyticsWithdrawn,
  getAccountAnalyticsWithdrawalRevision,
} from '@/features/telemetry/session'
import { preferencesAdapter, type PreferencesTransport } from '@/lib/api-adapter'
import {
  accountRequest, assertAccountIntent, captureAccountIntent, isAccountIntentCurrent,
  useAccountIdentity, type AccountIntent,
} from '@/lib/account-request'
import type { UserPreferences } from '@/lib/mock-data'

export const preferencesKeys = {
  all: ['preferences'] as const,
  user: (owner: number | undefined) => ['preferences', owner] as const,
  session: (owner: number | undefined, revision: number) => ['preferences', owner, revision] as const,
}

function transport(intent: AccountIntent, signal?: AbortSignal): PreferencesTransport {
  return {
    get: () => accountRequest(intent, 'GET', '/users/me/preferences/', undefined, signal),
    update: (data) => accountRequest(intent, 'PATCH', '/users/me/preferences/', data),
  }
}

export function usePreferences() {
  const { owner, revision } = useAccountIdentity()
  const query = useQuery({
    queryKey: preferencesKeys.session(owner, revision),
    queryFn: async ({ signal }) => {
      const intent = { ...captureAccountIntent(), owner, revision }
      assertAccountIntent(intent)
      const data = await preferencesAdapter.get(transport(intent, signal))
      assertAccountIntent(intent)
      return data
    },
    enabled: owner !== undefined,
    staleTime: 1000 * 60 * 10,
    retry: false,
  })
  useEffect(() => {
    if (owner !== undefined && query.data && isAccountIntentCurrent({ owner, revision, token: null })) {
      setAccountAnalyticsPreference(owner, query.data.privacy.shareAnalytics)
    }
  }, [owner, revision, query.data])
  return {
    ...query,
    data: query.data && isAccountAnalyticsWithdrawn(owner)
      ? { ...query.data, privacy: { ...query.data.privacy, shareAnalytics: false } }
      : query.data,
  }
}

type PreferenceIntent = {
  account: AccountIntent
  data: Partial<UserPreferences>
  withdrawalRevision: string | null
}
type MutationContext = { owner: number | undefined }
type PreferenceOptions = MutateOptions<UserPreferences, Error, Partial<UserPreferences>, MutationContext>

function capturePreferenceIntent(data: Partial<UserPreferences>): PreferenceIntent {
  const account = captureAccountIntent()
  return {
    account, data,
    withdrawalRevision: account.owner === undefined ? null : getAccountAnalyticsWithdrawalRevision(account.owner),
  }
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ account, data }: PreferenceIntent) => {
      assertAccountIntent(account)
      const updated = await preferencesAdapter.update(data, transport(account))
      assertAccountIntent(account)
      return updated
    },
    retry: false,
    onMutate: async ({ account, data }: PreferenceIntent) => {
      assertAccountIntent(account)
      const { owner, revision } = account
      if (owner !== undefined && data.privacy?.shareAnalytics === false) {
        withdrawAccountAnalytics(owner)
        queryClient.setQueryData<UserPreferences>(preferencesKeys.session(owner, revision), (previous) => previous
          ? { ...previous, privacy: { ...previous.privacy, shareAnalytics: false } }
          : previous)
      }
      await queryClient.cancelQueries({ queryKey: preferencesKeys.user(owner) })
      return { owner }
    },
    onSuccess: (updated, intent) => {
      if (!isAccountIntentCurrent(intent.account)) return
      const { owner, revision } = intent.account
      if (owner === undefined) return
      queryClient.setQueryData(preferencesKeys.session(owner, revision), updated)
      setAccountAnalyticsPreference(owner, updated.privacy.shareAnalytics,
        intent.data.privacy?.shareAnalytics === true, intent.withdrawalRevision)
      void queryClient.invalidateQueries({ queryKey: ['daily-joke', 'today'] })
    },
  })
  const bindOptions = (options?: PreferenceOptions): MutateOptions<UserPreferences, Error, PreferenceIntent, MutationContext> => ({
    onSuccess: (data, intent, result, context) => {
      if (isAccountIntentCurrent(intent.account)) options?.onSuccess?.(data, intent.data, result, context)
    },
    onError: (error, intent, result, context) => {
      if (isAccountIntentCurrent(intent.account)) options?.onError?.(error, intent.data, result, context)
    },
    onSettled: (data, error, intent, result, context) => {
      if (isAccountIntentCurrent(intent.account)) options?.onSettled?.(data, error, intent.data, result, context)
    },
  })
  return {
    ...mutation,
    variables: mutation.variables?.data,
    mutate: (data: Partial<UserPreferences>, options?: PreferenceOptions) => {
      mutation.mutate(capturePreferenceIntent(data), bindOptions(options))
    },
    mutateAsync: (data: Partial<UserPreferences>, options?: PreferenceOptions) => {
      return mutation.mutateAsync(capturePreferenceIntent(data), bindOptions(options))
    },
  }
}
