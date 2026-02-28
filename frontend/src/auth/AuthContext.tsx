import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

import { authUtils } from '../utils/auth'
import { decodeJwt } from '../utils/jwt'
import { setAccessToken, clearAccessToken } from '../auth/TokenManager'

interface User {
  id: number
  email: string
  rol: string
  nombre?: string
  apellido?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (token: string, userData?: Partial<User>) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = () => {
      const stored = authUtils.getAuthData()

      if (stored?.token) {
        try {
          // 🧠 Restaurar token en memoria
          setAccessToken(stored.token)

          const payload = decodeJwt(stored.token)

          if (payload) {
            const userInfo: User = {
              id: Number(payload.sub),
              email: payload.username,
              rol: payload.rol,
              ...stored.user
            }

            setUser(userInfo)
          }
        } catch (error) {
          console.error('❌ Error inicializando auth:', error)
          authUtils.clearAuth()
          clearAccessToken()
          setUser(null)
        }
      }

      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = (token: string, userData?: Partial<User>) => {
    const payload = decodeJwt(token)
    if (!payload) throw new Error('Token inválido')

    const userInfo: User = {
      id: Number(payload.sub),
      email: payload.username,
      rol: payload.rol,
      ...userData
    }

    // 💾 Guardar en localStorage
    authUtils.setAuthData(token, userInfo)

    // 🧠 Guardar en memoria
    setAccessToken(token)

    setUser(userInfo)
  }

  const logout = async () => {
    try {
      const { logout: apiLogout } = await import('../api/auth.api')
      await apiLogout()
    } catch (error) {
      console.warn('⚠️ Error en logout backend:', error)
    }

    authUtils.clearAuth()
    clearAccessToken()
    setUser(null)

    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}