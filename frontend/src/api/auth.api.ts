import axiosAdmin from './axiosAdmin'
import { authUtils } from '../utils/auth'
import { setAccessToken, clearAccessToken } from '../auth/TokenManager'
import type { LoginResponse, RefreshResponse } from '../types/auth'

/**
 * Inicia sesión utilizando Email y Password
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  console.log('🔐 Iniciando sesión para:', email)

  if (!email || !password) {
    throw new Error('El email y la contraseña son requeridos')
  }

  try {
    const formData = new URLSearchParams()
    formData.append('username', email) // FastAPI espera "username"
    formData.append('password', password)

    const response = await axiosAdmin.post<LoginResponse>(
      '/auth/login',
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    )

    const { access_token } = response.data

    if (!access_token) {
      throw new Error('No se recibió el token de acceso')
    }

    console.log('✅ Login exitoso para:', email)

    // 💾 Datos NO sensibles del usuario (el AuthContext completará con el JWT)
    authUtils.setUser({ email })

    // 🧠 El access token vive solo en memoria (fuente real)
    setAccessToken(access_token)

    return response.data

  } catch (error: any) {
    console.error('❌ Error en login:', {
      email,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })

    if (error.response?.status === 401) {
      throw new Error('Email o contraseña incorrectos')
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
 * Refresca el access token usando el refresh token en cookies HttpOnly
 * (El interceptor es quien decide cuándo llamarlo)
 */
export async function refreshToken(): Promise<RefreshResponse> {
  console.log('🔄 Intentando refresh token...')

  const response = await axiosAdmin.post<RefreshResponse>(
    '/auth/refresh',
    {}
  )

  const { access_token } = response.data

  if (!access_token) {
    throw new Error('No se recibió access_token en la respuesta de refresh')
  }

  return response.data
}

/**
 * Cierra la sesión actual
 */
export async function logout(): Promise<void> {
  console.log('🚪 Cerrando sesión...')

  try {
    await axiosAdmin.post('/auth/logout')
    console.log('✅ Logout exitoso en backend')
  } catch (error: any) {
    console.warn('⚠️ Error en logout del backend:', {
      status: error.response?.status,
      message: error.message
    })
  } finally {
    // 💾 Limpiar storage
    authUtils.clearAuth()

    // 🧠 Limpiar memoria
    clearAccessToken()

    console.log('🧹 Sesión limpiada completamente')
  }
}

/**
 * Obtiene la información del usuario actual
 */
export async function getCurrentUser() {
  console.log('👤 Obteniendo usuario actual...')

  try {
    const response = await axiosAdmin.get('/auth/me')
    return response.data
  } catch (error: any) {
    console.error('❌ Error obteniendo usuario:', {
      status: error.response?.status,
      message: error.message
    })

    if (error.response?.status === 401) {
      authUtils.clearAuth()
      clearAccessToken()
    }

    throw error
  }
}