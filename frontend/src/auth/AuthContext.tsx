/**
 * AuthContext.tsx
 * Contexto global de autenticación de la aplicación.
 *
 * Provee el estado del usuario autenticado, métodos de login/logout
 * y un indicador de carga mientras se valida el token contra el servidor.
 *
 * Al iniciar, intenta restaurar la sesión desde localStorage y valida
 * el token con el endpoint /auth/me antes de renderizar las rutas protegidas.
 */
import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import axiosAdmin from '../api/axiosAdmin' 
import { authUtils } from '../utils/auth'
import { decodeJwt } from '../utils/jwt'
import { setAccessToken, clearAccessToken } from '../auth/TokenManager'
import {
  startSession,
  stopSession,
  refreshSession,
  flagSessionExpired,
  wasLastRefreshNetworkError,
  esErrorBackendCaido,
} from '../auth/sessionManager'
import type { ExpiryReason } from '../auth/sessionManager'

interface User {
  id: number
  email: string
  rol: string
  nombre?: string
  apellido?: string
  telefono?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (token: string, userData?: Partial<User>) => void
  logout: () => void
  updateUser: (partial: Partial<User>) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /** Cierra la sesión localmente cuando expira por inactividad, tope o revocación. */
  const handleSessionExpired = (reason: ExpiryReason = 'inactivity') => {
    // Dejamos registrado el motivo para que el login muestre el mensaje adecuado
    // (p. ej. "sesión demasiado larga, ingresá tu contraseña nuevamente").
    if (reason !== 'logout') flagSessionExpired(reason)
    stopSession()
    authUtils.clearAuth()
    clearAccessToken()
    setUser(null)
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  useEffect(() => {
  const initAuth = async () => {
    // Sin hint de sesión previa no intentamos rehidratar (evita pegarle a
    // /auth/refresh en visitantes anónimos del sitio público).
    if (!authUtils.hasSession()) {
      setIsLoading(false);
      return;
    }

    try {
      // 🔑 Rehidratamos el access token SOLO en memoria desde la cookie httpOnly.
      const token = await refreshSession();
      if (!token) {
        if (wasLastRefreshNetworkError()) {
          // Backend inalcanzable (p. ej. reconstruyendo contenedores): NO
          // destruimos el hint de sesión. El usuario puede reintentar
          // recargando una vez que el backend vuelva a estar arriba.
          return;
        }
        authUtils.clearAuth();
        clearAccessToken();
        setUser(null);
        return;
      }

      // 🛡️ Confirmamos la sesión contra el servidor.
      const response = await axiosAdmin.get('/auth/me');
      const payload = decodeJwt(token);

      if (payload) {
        setUser({
          id: Number(payload.sub),
          email: payload.username,
          rol: payload.rol,
          ...response.data
        });
        // 🔄 Sesión deslizante: renueva el token mientras haya actividad.
        startSession(handleSessionExpired);
      }
    } catch (error: any) {
      console.error('❌ No se pudo restaurar la sesión:', error);
      if (esErrorBackendCaido(error)) {
        // Backend no disponible momentáneamente (red caída, gateway 502/503,
        // contenedor reiniciando): no borramos el hint de sesión, se puede
        // reintentar recargando la página.
        return;
      }
      authUtils.clearAuth();
      clearAccessToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  initAuth();
}, []);

  const login = (token: string, userData?: Partial<User>) => {
    const payload = decodeJwt(token)
    if (!payload) throw new Error('Token inválido')

    const userInfo: User = {
      id: Number(payload.sub),
      email: payload.username,
      rol: payload.rol,
      ...userData
    }

    // 💾 Guardar datos NO sensibles del usuario (sin token) en localStorage
    authUtils.setUser(userInfo)

    // 🧠 El access token vive solo en memoria
    setAccessToken(token)

    setUser(userInfo)

    // 🔄 Iniciar la sesión deslizante tras el login.
    startSession(handleSessionExpired)
  }

  const logout = async () => {
    try {
      const { logout: apiLogout } = await import('../api/auth.api')
      await apiLogout()
    } catch (error) {
      console.warn('⚠️ Error en logout backend:', error)
    }

    // 🛑 Detener la sesión deslizante y avisar a las demás pestañas.
    stopSession(true)
    authUtils.clearAuth()
    clearAccessToken()
    setUser(null)

    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  /** Actualiza los datos del usuario en memoria y en localStorage tras editar el perfil. */
  const updateUser = (partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev
      const actualizado = { ...prev, ...partial }
      authUtils.setUser(actualizado)
      return actualizado
    })
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
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