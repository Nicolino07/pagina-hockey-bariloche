// frontend/src/utils/auth.ts - VERSIÓN CORREGIDA
import { isTokenExpired, isTokenAboutToExpire } from './jwt'

const AUTH_KEYS = {
  ACCESS_TOKEN: 'access_token',
  USER_DATA: 'user',
  TOKEN_EXPIRY_CHECK: 'token_expiry_check'
}

export const authUtils = {
  // ============ CORE ============
  setAuthData(accessToken: string, userData: any) {
    if (!accessToken) {
      console.error('❌ No se puede guardar token vacío')
      return
    }
    
    localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, accessToken)
    localStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(userData))
    
    // Iniciar monitoreo de token
    this.startTokenMonitor()
  },
  
  getAccessToken(): string | null {
    return localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN)
  },
  
  getUser(): any | null {
    const userStr = localStorage.getItem(AUTH_KEYS.USER_DATA)
    try {
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  },
  
  clearAuth() {
    localStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(AUTH_KEYS.USER_DATA)
    this.stopTokenMonitor()
  },
  
  // ============ VERIFICACIONES ============
  isAuthenticated(): boolean {
    const token = this.getAccessToken()
    return token ? !isTokenExpired(token) : false
  },
  
  needsTokenRefresh(): boolean {
    const token = this.getAccessToken()
    return token ? isTokenAboutToExpire(token, 5) : false  // 5 minutos antes
  },
  
  // ============ TOKEN MONITOR ============
  startTokenMonitor() {
    this.stopTokenMonitor()  // Limpiar anterior
    
    const checkInterval = 60 * 1000  // 1 minuto
    
    const intervalId = setInterval(() => {
      this.checkAndRefreshToken()
    }, checkInterval)
    
    localStorage.setItem(AUTH_KEYS.TOKEN_EXPIRY_CHECK, intervalId.toString())
  },
  
  stopTokenMonitor() {
    const intervalId = localStorage.getItem(AUTH_KEYS.TOKEN_EXPIRY_CHECK)
    if (intervalId) {
      clearInterval(Number(intervalId))
      localStorage.removeItem(AUTH_KEYS.TOKEN_EXPIRY_CHECK)
    }
  },
  
  async checkAndRefreshToken() {
    if (!this.isAuthenticated()) {
      this.clearAuth()
      return
    }
    
    if (this.needsTokenRefresh()) {
      console.log('🔄 Token por expirar, refrescando...')
      await this.refreshAccessToken()
    }
  },
  
  // ============ REFRESH TOKEN ============
  async refreshAccessToken(): Promise<boolean> {
    try {
      const { refreshToken } = await import('../api/auth.api')
      const response = await refreshToken()
      
      if (response.access_token) {
        localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, response.access_token)
        console.log('✅ Token refrescado')
        return true
      }
      return false
    } catch (error: any) {
      console.error('❌ Error refrescando token:', error)
      
      // Solo logout si es error de autenticación
      if (error.response?.status === 401) {
        this.clearAuth()
        window.location.href = '/login'
      }
      
      return false
    }
  },  // ← ¡ESTA COMA ES IMPORTANTE! Faltaba aquí

  // ============ COMPATIBILIDAD CON AuthContext ============
  scheduleTokenCheck() {
    console.log('⏰ scheduleTokenCheck llamado')
    
    // Si ya hay un monitor corriendo, no hacer nada
    if (localStorage.getItem(AUTH_KEYS.TOKEN_EXPIRY_CHECK)) {
      console.log('⏰ Ya hay un monitor activo')
      return
    }
    
    // Usar startTokenMonitor que ya está implementado
    this.startTokenMonitor()
  },
  
  clearTokenCheck() {
    this.stopTokenCheck()
  },

  // Alias para consistencia
  stopTokenCheck() {
    this.stopTokenMonitor()
  }
}