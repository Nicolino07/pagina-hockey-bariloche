// frontend/src/api/auth.api.ts
import axiosAdmin from './axiosAdmin'
import config from './config/index'
import { authUtils } from '../utils/auth'
import type { LoginResponse, RefreshResponse } from '../types/auth'

/**
 * Inicia sesión con username y password
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  console.log('🔐 Iniciando sesión para usuario:', username)
  
  // Validaciones básicas
  if (!username || !password) {
    throw new Error('Usuario y contraseña son requeridos')
  }
  
  try {
    // Crear form data para OAuth2
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    
    // Usar axiosAdmin porque necesita cookies para refresh token
    const response = await axiosAdmin.post<LoginResponse>(
      '/auth/login',
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    )
    
    const { access_token, token_type } = response.data
    
    if (!access_token) {
      throw new Error('No se recibió access_token en la respuesta')
    }
    
    console.log('✅ Login exitoso', {
      username,
      tokenLength: access_token.length,
      tokenType: token_type
    })
    
    // Guardar en auth utils
    const userData = {
      username,
      // Puedes decodificar el token para obtener más datos
      token: access_token
    }
    
    authUtils.setAuthData(access_token, userData)
    
    return response.data
    
  } catch (error: any) {
    console.error('❌ Error en login:', {
      username,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    
    // Convertir error HTTP a error de dominio
    if (error.response?.status === 401) {
      throw new Error('Credenciales incorrectas')
    } else if (error.response?.status === 403) {
      throw new Error('Usuario bloqueado o sin permisos')
    } else if (error.response?.status === 429) {
      throw new Error('Demasiados intentos, intenta más tarde')
    } else if (!error.response) {
      throw new Error('Error de conexión con el servidor')
    }
    
    throw new Error('Error al iniciar sesión')
  }
}

/**
 * Refresca el access token usando el refresh token en cookies
 */
export async function refreshToken(): Promise<RefreshResponse> {
  console.log('🔄 Intentando refresh token...')
  
  try {
    // Usar axiosAdmin porque necesita cookies (withCredentials: true)
    const response = await axiosAdmin.post<RefreshResponse>(
      '/auth/refresh',
      {},  // Body vacío, el refresh token va en cookies
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
    
    const { access_token, token_type } = response.data
    
    if (!access_token) {
      throw new Error('No se recibió access_token en la respuesta de refresh')
    }
    
    console.log('✅ Refresh token exitoso', {
      newTokenLength: access_token.length,
      tokenType: token_type
    })
    
    // Actualizar el token en localStorage
    localStorage.setItem('access_token', access_token)
    
    return response.data
    
  } catch (error: any) {
    console.error('❌ Error en refresh token:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    
    // Si es 401, el refresh token es inválido/expiró
    if (error.response?.status === 401) {
      authUtils.clearAuth()
      throw new Error('Sesión expirada, por favor inicia sesión nuevamente')
    }
    
    throw new Error('Error al refrescar la sesión')
  }
}

/**
 * Cierra la sesión actual
 */
export async function logout(): Promise<void> {
  console.log('🚪 Cerrando sesión...')
  
  try {
    // Intentar logout en el backend
    await axiosAdmin.post('/auth/logout')
    console.log('✅ Logout exitoso en backend')
  } catch (error: any) {
    console.warn('⚠️ Error en logout del backend:', {
      status: error.response?.status,
      message: error.message
    })
    // Continuamos aunque falle, para limpiar frontend
  } finally {
    // Siempre limpiar localStorage
    authUtils.clearAuth()
    console.log('🧹 Auth limpiado del frontend')
  }
}

/**
 * Obtiene la información del usuario actual
 */
export async function getCurrentUser() {
  console.log('👤 Obteniendo usuario actual...')
  
  try {
    const response = await axiosAdmin.get('/auth/me')
    console.log('✅ Usuario actual obtenido:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ Error obteniendo usuario:', {
      status: error.response?.status,
      message: error.message
    })
    
    // Si es 401, limpiar auth
    if (error.response?.status === 401) {
      authUtils.clearAuth()
    }
    
    throw error
  }
}

/**
 * Verifica si hay una sesión activa
 */
export function checkAuthStatus(): boolean {
  return authUtils.isAuthenticated()
}

/**
 * Obtiene el token actual (para debugging o uso directo)
 */
export function getCurrentToken(): string | null {
  return authUtils.getAccessToken()
}