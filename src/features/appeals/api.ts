import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appealsAdapter } from '@/lib/api-adapter'
import type { AppealDTO, CreateAppealInput } from '@/lib/api'

export const appealKeys = {
  all: ['appeals'] as const,
  mine: () => [...appealKeys.all, 'mine'] as const,
}

/** The caller's own appeals with status. Graceful-absent: the adapter maps a
 * 404 (endpoint not yet deployed) to an empty list rather than an error. */
export function useMyAppeals() {
  return useQuery<AppealDTO[]>({
    queryKey: appealKeys.mine(),
    queryFn: () => appealsAdapter.myAppeals(),
    staleTime: 1000 * 30,
  })
}

export function useCreateAppeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAppealInput) => appealsAdapter.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appealKeys.all })
    },
  })
}
