import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, token) => {
        setAccessToken(token)
        set({
          user,
          accessToken: token,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      setUser: (user) => set({ user }),

      setToken: (token) => {
        setAccessToken(token)
        set({ accessToken: token })
      },

      logout: () => {
        setAccessToken(null)
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'jokesfor-auth',
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name)
          return str ? JSON.parse(str) : null
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name)
        },
      },
      // Only persist what's needed — don't persist isLoading or actions
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }) as unknown as AuthState,
      // On rehydrate, sync the token back to the axios instance
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          setAccessToken(state.accessToken)
        }
        // Mark loading done after rehydration
        state?.setLoading(false)
      },
    }
  )
)
