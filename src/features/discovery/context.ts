import { createContext, useContext, useMemo } from 'react'
import { useLocation } from 'react-router'
import { resolveSelection, type ContentSelection } from './selection'
import { useDiscoveryStore } from './store'

export const ContentSelectionContext = createContext<ContentSelection | null>(null)

export function useContentSelection(): ContentSelection {
  const saved = useDiscoveryStore((state) => state.selection)
  return useContext(ContentSelectionContext) ?? saved
}

/** Also supports standalone route previews and tests without the root boundary. */
export function useBrowseSelection(): ContentSelection {
  const saved = useContentSelection()
  const { search } = useLocation()
  return useMemo(() => resolveSelection(search, saved), [search, saved])
}
