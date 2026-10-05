import { useEffect, useMemo } from 'react'
import { Outlet, useLocation } from 'react-router'
import { ContentSelectionContext } from './context'
import { resolveSelection, selectionKey } from './selection'
import { useDiscoveryStore } from './store'

/** URL selection is available to every request on the very first render. */
export function ContentSelectionBoundary() {
  const { search } = useLocation()
  const saved = useDiscoveryStore((state) => state.selection)
  const selection = useMemo(() => resolveSelection(search, saved), [search, saved])
  useEffect(() => {
    if (selectionKey(saved) !== selectionKey(selection)) useDiscoveryStore.getState().setSelection(selection)
  }, [selection, saved])
  return <ContentSelectionContext.Provider value={selection}><Outlet /></ContentSelectionContext.Provider>
}
