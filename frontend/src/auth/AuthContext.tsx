// frontend/src/auth/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

import { authUtils } from '../utils/auth'
import { decodeJwt } from '../utils/jwt'


interface User {
  id: number
  username: string
  rol: string
  email?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (token: string, userData: Partial<User>) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Inicializar auth desde localStorage
  useEffect(() => {
    const initAuth = () => {
      const token = authUtils.getAccessToken()
      
      if (token && authUtils.isAuthenticated()) {
        try {
          const payload = decodeJwt(token)
          const storedUser = authUtils.getUser()
          
          if (payload && storedUser) {
            setUser({
              id: Number(payload.sub),
              username: payload.username,
              rol: payload.rol,
              ...storedUser
            })
          }
        } catch (error) {
          console.error('❌ Error inicializando auth:', error)
          authUtils.clearAuth()
        }
      }
      
      setIsLoading(false)
      
      // Iniciar chequeo de token (si está autenticado)
      if (authUtils.isAuthenticated()) {
        authUtils.scheduleTokenCheck()
      }
    }
    
    initAuth()

    // Cleanup
    return () => {
      authUtils.clearTokenCheck()
    }
  }, [])

  const login = (token: string, userData: Partial<User>) => {
    const payload = decodeJwt(token)
    if (!payload) throw new Error('Token inválido')
    
    const userInfo: User = {
      id: Number(payload.sub),
      username: payload.username,
      rol: payload.rol,
      ...userData
    }
    
    authUtils.setAuthData(token, userInfo)
    setUser(userInfo)
  }

  const logout = async () => {
    // Primero intentar logout en backend
    try {
      const { logout: apiLogout } = await import('../api/auth.api')
      await apiLogout()
    } catch (error) {
      console.warn('⚠️ Error en logout backend:', error)
    }
    
    // Siempre limpiar frontend
    authUtils.clearAuth()
    setUser(null)
    
    // Redirigir a login
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
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}