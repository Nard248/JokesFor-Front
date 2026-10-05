import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { EMPTY_SELECTION, normalizeSelection, type ContentSelection } from './selection'

interface DiscoveryState {
  selection: ContentSelection
  setSelection: (selection: ContentSelection) => void
}

export const useDiscoveryStore = create<DiscoveryState>()(persist(
  (set) => ({ selection: EMPTY_SELECTION, setSelection: (selection) => set({ selection: normalizeSelection(selection) }) }),
  {
    name: 'jokesfor-content-selection',
    version: 1,
    partialize: (state) => ({ selection: state.selection }),
    merge: (persisted, current) => ({ ...current, selection: normalizeSelection((persisted as Partial<DiscoveryState> | undefined)?.selection) }),
  },
))
