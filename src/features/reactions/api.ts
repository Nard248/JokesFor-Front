import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reactionsApi, type ReactionSlug } from '@/lib/api'

export const reactionsKeys = {
  all: ['reactions'] as const,
  joke: (jokeId: number) => [...reactionsKeys.all, jokeId] as const,
}

/** GET /jokes/{id}/reactions/ — counts + my_reaction. */
export function useReactions(jokeId: number, enabled = true) {
  return useQuery({
    queryKey: reactionsKeys.joke(jokeId),
    queryFn: () => reactionsApi.get(jokeId).then((r) => r.data),
    enabled,
    staleTime: 1000 * 30,
  })
}

/** POST /jokes/{id}/react/ — toggle/switch reaction. */
export function useReactToJoke(jokeId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reaction: ReactionSlug) =>
      reactionsApi.react(jokeId, reaction).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(reactionsKeys.joke(jokeId), data)
    },
  })
}
