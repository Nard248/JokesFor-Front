import { create } from 'zustand'
import { setAccessToken } from '@/lib/axios'
import type { User } from '@/lib/api'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  setAuth: (user: User, token: string) => void
  setUser: (user: User) => void
  setToken: (token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true, // Start loading until we check auth status

  setAuth: (user, token) => {
    setAccessToken(token) // Sync with axios
    set({
      user,
      accessToken: token,
      isAuthenticated: true,
      isLoading: false,
    })
  },

  setUser: (user) => set({ user }),

  setToken: (token) => {
    setAccessToken(token) // Sync with axios
    set({ accessToken: token })
  },

  logout: () => {
    setAccessToken(null) // Clear axios token
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  setLoading: (loading) => set({ isLoading: loading }),
}))
