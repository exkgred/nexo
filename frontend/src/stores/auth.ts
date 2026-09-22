import { create } from 'zustand'
import type { PublicUser } from '@/lib/types'

interface AuthState {
  user: PublicUser | null
  accessToken: string | null
  refreshToken: string | null
  setSession: (user: PublicUser, accessToken: string, refreshToken: string) => void
  setUser: (user: PublicUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: readJson('nexo.user'),
  accessToken: localStorage.getItem('nexo.access'),
  refreshToken: localStorage.getItem('nexo.refresh'),
  setSession: (user, accessToken, refreshToken) => {
    localStorage.setItem('nexo.user', JSON.stringify(user))
    localStorage.setItem('nexo.access', accessToken)
    localStorage.setItem('nexo.refresh', refreshToken)
    set({ user, accessToken, refreshToken })
  },
  setUser: (user) => {
    localStorage.setItem('nexo.user', JSON.stringify(user))
    set({ user })
  },
  logout: () => {
    localStorage.removeItem('nexo.user')
    localStorage.removeItem('nexo.access')
    localStorage.removeItem('nexo.refresh')
    set({ user: null, accessToken: null, refreshToken: null })
  },
}))

function readJson(key: string): PublicUser | null {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PublicUser
  } catch {
    return null
  }
}
