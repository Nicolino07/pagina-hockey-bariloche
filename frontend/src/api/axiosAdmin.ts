// frontend/src/api/axiosAdmin.ts
import axios from 'axios'
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import config from './config/index'

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
  baseURL: config.api.baseURL,
  withCredentials: true, // IMPORTANTE para cookies (refresh token)
  timeout: config.api.timeout,
})

// ============================================
// SISTEMA DE REFRESH TOKEN CON COLA
// ============================================
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

/**
 * Notifica a todas las requests en cola que el token fue refrescado
 */
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

/**
 * Agrega una request a la cola de espera
 */
const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback)
}

// ============================================
// INTERCEPTOR DE REQUEST
// ============================================
axiosAdmin.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token')
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error: AxiosError) => {
    console.error('❌ Error en request interceptor:', error.message)
    return Promise.reject(error)
  }
)

// ============================================
// INTERCEPTOR DE RESPONSE (HEART DEL REFRESH)
// ============================================
axiosAdmin.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig
    
    // Si no es error 401, o ya reintentamos, rechazar
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error)
    }
    
    // Evitar loop infinito
    if (originalRequest._retry) {
      console.log('⚠️ Request ya reintentada, forzando logout')
      forceLogout()
      return Promise.reject(error)
    }
    
    originalRequest._retry = true
    
    // Si ya estamos refrescando, poner request en cola
    if (isRefreshing) {
      console.log('⏳ Refresh en progreso, request en cola...')
      return new Promise((resolve) => {
        addRefreshSubscriber((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          resolve(axiosAdmin(originalRequest))
        })
      })
    }
    
    isRefreshing = true
    
    try {
      console.log('🔄 Token expirado, iniciando refresh...')
      
      // Importar dinámicamente para evitar ciclos
      const { refreshToken } = await import('./auth.api')
      const response = await refreshToken()
      
      if (!response.access_token) {
        throw new Error('No se recibió access_token')
      }
      
      console.log('✅ Token refrescado exitosamente')
      
      // Actualizar localStorage
      localStorage.setItem('access_token', response.access_token)
      
      // Actualizar header de la request original
      originalRequest.headers.Authorization = `Bearer ${response.access_token}`
      
      // Notificar a todas las requests en cola
      onRefreshed(response.access_token)
      
      // Reintentar la request original
      return axiosAdmin(originalRequest)
      
    } catch (refreshError: any) {
      console.error('❌ Error crítico en refresh token:', {
        message: refreshError.message,
        status: refreshError.response?.status,
        data: refreshError.response?.data
      })
      
      // Limpiar todo y redirigir a login
      forceLogout()
      return Promise.reject(refreshError)
      
    } finally {
      isRefreshing = false
    }
  }
)

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function forceLogout() {
  console.log('🚪 Forzando logout...')
  
  // Limpiar localStorage
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
  
  // Limpiar sessionStorage si usas
  sessionStorage.clear()
  
  // Redirigir a login
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

// ============================================
// FUNCIONES PÚBLICAS (OPCIONAL)
// ============================================
/**
 * Verifica si hay una solicitud de refresh en progreso
 */
export const isRefreshingToken = (): boolean => isRefreshing

/**
 * Obtiene el número de requests en cola esperando refresh
 */
export const getPendingRequestsCount = (): number => refreshSubscribers.length

/**
 * Cancela todas las requests pendientes y limpia el estado
 */
export const cancelPendingRequests = (): void => {
  refreshSubscribers = []
  isRefreshing = false
  console.log('🧹 Requests pendientes canceladas')
}

// ============================================
// LOG INICIAL
// ============================================
if (config.app.isDev) {
  console.log('🔐 AxiosAdmin configurado:', {
    baseURL: config.api.baseURL,
    withCredentials: true,
    timeout: config.api.timeout
  })
}

export default axiosAdmin