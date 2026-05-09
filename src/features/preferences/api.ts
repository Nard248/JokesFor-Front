import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { preferencesAdapter } from '@/lib/api-adapter'
import type { UserPreferences } from '@/lib/mock-data'

export const preferencesKeys = {
  all: ['preferences'] as const,
}

export function usePreferences() {
  return useQuery({
    queryKey: preferencesKeys.all,
    queryFn: () => preferencesAdapter.get(),
    staleTime: 1000 * 60 * 10,
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<UserPreferences>) => preferencesAdapter.update(data),
    onSuccess: (updated) => {
      // Set cache directly — preferences are a single object, no need to refetch
      queryClient.setQueryData(preferencesKeys.all, updated)
      // Preference changes may affect daily joke personalization
      queryClient.invalidateQueries({ queryKey: ['daily-joke', 'today'] })
    },
  })
}
