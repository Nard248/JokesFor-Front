import { create } from 'zustand'

interface UIState {
  isMobileMenuOpen: boolean
  isSidebarCollapsed: boolean
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  isSidebarCollapsed: false,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}))
