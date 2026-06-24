/**
 * Datos NO sensibles del usuario persistidos en localStorage.
 * El access token NUNCA se guarda aquí: vive solo en memoria (TokenManager)
 * y se rehidrata vía /auth/refresh (cookie httpOnly) al recargar la página.
 */
interface StoredAuth {
  user: any
}

/** Clave utilizada para guardar los datos de auth en localStorage. */
const AUTH_KEY = 'auth_data'

/** Utilidades para persistir datos NO sensibles de la sesión en localStorage. */
export const authUtils = {
  /**
   * Guarda los datos del usuario (sin token) en localStorage.
   * @param user - Objeto de usuario (id, email, rol). No incluir el token.
   */
  setUser(user: any) {
    const data: StoredAuth = { user }
    localStorage.setItem(AUTH_KEY, JSON.stringify(data))
  },

  /**
   * Recupera los datos del usuario almacenados.
   * @returns El objeto de usuario, o null si no existe o está corrupto.
   */
  getUser(): any | null {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null

    try {
      return (JSON.parse(raw) as StoredAuth).user ?? null
    } catch {
      return null
    }
  },

  /**
   * Indica si había una sesión iniciada (hint para intentar rehidratarla).
   * @returns true si hay datos de sesión persistidos.
   */
  hasSession(): boolean {
    return !!localStorage.getItem(AUTH_KEY)
  },

  /**
   * Elimina los datos de autenticación de localStorage.
   */
  clearAuth() {
    localStorage.removeItem(AUTH_KEY)
  }
}
