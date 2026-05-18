import { create } from 'zustand'

interface AuthState {
  token: string | null
  userId: string | null
  setAuth: (token: string, userId: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('access_token') : null,
  userId: typeof window !== 'undefined' ? localStorage.getItem('user_id') : null,
  setAuth: (token, userId) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('user_id', userId)
    set({ token, userId })
  },
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_id')
    set({ token: null, userId: null })
  },
}))