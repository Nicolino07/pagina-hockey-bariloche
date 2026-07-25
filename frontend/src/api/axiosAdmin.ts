// frontend/src/api/axiosAdmin.ts
import axios from 'axios'
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import config from './config/index'
import { getAccessToken, clearAccessToken } from '../auth/TokenManager'
import { refreshSession, stopSession, flagSessionExpired } from '../auth/sessionManager'
import { authUtils } from '../utils/auth'



// ============================================
// TIPOS
// ============================================
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

// ============================================
// CONFIGURACIÓN AXIOS
// ============================================
const axiosAdmin = axios.create({
  // Forzamos que use la base URL del config
  baseURL: config.api.baseURL,
  withCredentials: true,
  timeout: config.api.timeout,
})

// ============================================
// INTERCEPTOR DE REQUEST (CORRECCIÓN DE RUTAS)
// ============================================
axiosAdmin.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 🔥 SOLUCIÓN AL MIXED CONTENT Y RUTAS ROTAS:
    // Si la URL empieza con "/", se la quitamos para que Axios 
    // concatene correctamente con el "/api" de la baseURL.
    if (config.url && config.url.startsWith('/')) {
      config.url = config.url.substring(1);
    }

    const token = getAccessToken()
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log para depuración en desarrollo
    if (import.meta.env.DEV) {
      console.log(`📡 Axios enviando a: ${config.baseURL}/${config.url}`);
    }
    
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// ============================================
// INTERCEPTOR DE RESPONSE (MANEJO DE 401)
// ============================================
axiosAdmin.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig
    
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error)
    }

    // 🚨 Evitar loop si falla el refresh
    if (originalRequest.url?.includes('auth/refresh')) {
      // Si el backend cortó por tope absoluto de sesión, mostramos el mensaje
      // específico en el login.
      const code = (error.response?.data as any)?.error?.code
      forceLogout(code === 'SESSION_TOO_LONG' ? 'too_long' : undefined)
      return Promise.reject(error)
    }
    
    if (originalRequest._retry) {
      forceLogout()
      return Promise.reject(error)
    }
    
    originalRequest._retry = true

    // 🔄 Renovación coordinada (deduplicada entre peticiones y pestañas).
    const newToken = await refreshSession()

    if (!newToken) {
      forceLogout()
      return Promise.reject(error)
    }

    if (originalRequest.headers) {
      originalRequest.headers.Authorization = `Bearer ${newToken}`
    }
    return axiosAdmin(originalRequest)
  }
)

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function forceLogout(reason?: 'too_long') {
  if (reason) flagSessionExpired(reason)
  stopSession(true)
  clearAccessToken()
  authUtils.clearAuth()

  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

export default axiosAdmin