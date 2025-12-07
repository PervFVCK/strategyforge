import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  isPro: boolean
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  setUser: (user: User) => void
  setTokens: (token: string, refreshToken: string) => void
  login: (user: User, token: string, refreshToken: string) => void
  logout: () => void
  clearError: () => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),

      setTokens: (token, refreshToken) =>
        set({ token, refreshToken, isAuthenticated: true }),

      login: (user, token, refreshToken) =>
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          error: null,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        }),

      clearError: () => set({ error: null }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isLoading: false }),
    }),
    {
      name: 'strategyforge-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
