// frontend/src/api/axiosAdmin.ts
import axios from 'axios'
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import config from './config/index'
import { getAccessToken, setAccessToken, clearAccessToken } from '../auth/TokenManager'



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
// SISTEMA DE REFRESH TOKEN CON COLA
// ============================================
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback)
}

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
      forceLogout()
      return Promise.reject(error)
    }
    
    if (originalRequest._retry) {
      forceLogout()
      return Promise.reject(error)
    }
    
    originalRequest._retry = true
    
    if (isRefreshing) {
      return new Promise((resolve) => {
        addRefreshSubscriber((token: string) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          resolve(axiosAdmin(originalRequest))
        })
      })
    }
    
    isRefreshing = true
    
    try {
      const { refreshToken } = await import('./auth.api')
      const response = await refreshToken()
      
      if (!response.access_token) throw new Error()
      
      setAccessToken(response.access_token)
      
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${response.access_token}`
      }
      
      onRefreshed(response.access_token)
      return axiosAdmin(originalRequest)
      
    } catch (refreshError) {
      forceLogout()
      return Promise.reject(refreshError)
    }
     finally {
      isRefreshing = false
    }
  }
)

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function forceLogout() {
  clearAccessToken()
  localStorage.removeItem('user')

  // 🔥 Siempre limpiar estado interno
  refreshSubscribers = []
  isRefreshing = false

  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

export default axiosAdmin