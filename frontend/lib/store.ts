import { create } from 'zustand'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  hydrated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Initialize hydrated state - on server, mark as hydrated immediately
  // On client, we'll hydrate from localStorage
  const initialHydrated = typeof window === 'undefined' ? true : false
  
  return {
    user: null,
    token: null,
    hydrated: initialHydrated,
    setAuth: (user, token) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
      }
      set({ user, token, hydrated: true })
    },
    clearAuth: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
      set({ user: null, token: null, hydrated: true })
    },
    hydrate: () => {
      if (typeof window !== 'undefined') {
        try {
          const storedUser = localStorage.getItem('user')
          const storedToken = localStorage.getItem('token')
          set({
            user: storedUser ? JSON.parse(storedUser) : null,
            token: storedToken,
            hydrated: true
          })
        } catch (error) {
          console.error('Error hydrating auth store:', error)
          // Even if there's an error, mark as hydrated so the app doesn't get stuck
          set({ hydrated: true })
        }
      } else {
        // If we're on the server, just mark as hydrated
        set({ hydrated: true })
      }
    },
  }
})

// Auto-hydrate on client side - run immediately when module loads
if (typeof window !== 'undefined') {
  // Run hydration immediately
  useAuthStore.getState().hydrate()
  
  // Also set up a fallback to ensure hydration happens
  // This handles edge cases where the store might not hydrate properly
  if (typeof window !== 'undefined') {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      const state = useAuthStore.getState()
      if (!state.hydrated) {
        state.hydrate()
      }
    })
    
    // Fallback timeout - if still not hydrated after 100ms, force it
    setTimeout(() => {
      const state = useAuthStore.getState()
      if (!state.hydrated) {
        console.warn('Auth store not hydrated after timeout, forcing hydration')
        state.hydrate()
      }
    }, 100)
  }
}

