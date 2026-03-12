/** Token de acceso almacenado en memoria (no en localStorage) para mayor seguridad. */
let accessToken: string | null = null

/**
 * Almacena el access token en memoria.
 * @param token - Token JWT recibido del servidor, o null para limpiar.
 */
export function setAccessToken(token: string | null) {
  accessToken = token
}

/**
 * Retorna el access token actual almacenado en memoria.
 * @returns El token JWT o null si no hay sesión activa.
 */
export function getAccessToken(): string | null {
  return accessToken
}

/**
 * Elimina el access token de memoria, cerrando la sesión en curso.
 */
export function clearAccessToken() {
  accessToken = null
}