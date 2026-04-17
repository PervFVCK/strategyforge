import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  tempPhone: string; // For OTP flow
  tempUserId: number | null; // For PIN setup
  
  // Actions
  setUser: (user: User) => void;
  setTempPhone: (phone: string) => void;
  setTempUserId: (id: number) => void;
  logout: () => void;
  clearTemp: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      tempPhone: '',
      tempUserId: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      setTempPhone: (phone) =>
        set({ tempPhone: phone }),

      setTempUserId: (id) =>
        set({ tempUserId: id }),

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({
          user: null,
          isAuthenticated: false,
          tempPhone: '',
          tempUserId: null,
        });
      },

      clearTemp: () =>
        set({
          tempPhone: '',
          tempUserId: null,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
