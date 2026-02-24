import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

import { authUtils } from '../utils/auth'
import { decodeJwt } from '../utils/jwt'

// 1. Actualizamos la interfaz para que use 'email' como identificador principal
interface User {
  id: number
  email: string // Antes era username
  rol: string
  nombre?: string
  apellido?: string
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

  useEffect(() => {
    const initAuth = () => {
      const token = authUtils.getAccessToken()
      
      if (token && authUtils.isAuthenticated()) {
        try {
          const payload = decodeJwt(token)
          const storedUser = authUtils.getUser()
          
          if (payload) {
            setUser({
              id: Number(payload.sub),
              // En el backend pusimos el email en la clave "username" del JWT
              email: payload.username, 
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
      
      if (authUtils.isAuthenticated()) {
        authUtils.scheduleTokenCheck()
      }
    }
    
    initAuth()

    return () => {
      authUtils.clearTokenCheck()
    }
  }, [])

  const login = (token: string, userData: Partial<User>) => {
    const payload = decodeJwt(token)
    if (!payload) throw new Error('Token inválido')
    
    // 2. Mapeamos el payload del JWT a nuestra estructura de User
    const userInfo: User = {
      id: Number(payload.sub),
      email: payload.username, // El correo viene aquí desde el backend
      rol: payload.rol,
      ...userData
    }
    
    authUtils.setAuthData(token, userInfo)
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
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}