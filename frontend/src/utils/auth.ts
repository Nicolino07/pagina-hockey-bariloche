/** Estructura de los datos de autenticación persistidos en localStorage. */
interface StoredAuth {
  token: string
  user: any
}

/** Clave utilizada para guardar los datos de auth en localStorage. */
const AUTH_KEY = 'auth_data'

/** Utilidades para persistir y recuperar datos de autenticación en localStorage. */
export const authUtils = {
  /**
   * Guarda el token y los datos del usuario en localStorage.
   * @param token - Token JWT de acceso.
   * @param user - Objeto de usuario retornado por el servidor.
   */
  setAuthData(token: string, user: any) {
    const data: StoredAuth = { token, user }
    localStorage.setItem(AUTH_KEY, JSON.stringify(data))
  },

  /**
   * Recupera los datos de autenticación almacenados.
   * @returns Objeto con token y usuario, o null si no existe o está corrupto.
   */
  getAuthData(): StoredAuth | null {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null

    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },

  /**
   * Elimina los datos de autenticación de localStorage.
   */
  clearAuth() {
    localStorage.removeItem(AUTH_KEY)
  }
}