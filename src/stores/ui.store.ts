import { create } from 'zustand'

interface UIState {
  isMobileMenuOpen: boolean
  isSidebarCollapsed: boolean
  isSearchFocused: boolean
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
  toggleSidebar: () => void
  setSearchFocused: (focused: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  isSidebarCollapsed: false,
  isSearchFocused: false,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSearchFocused: (focused) => set({ isSearchFocused: focused }),
}))
