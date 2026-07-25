/**
 * sessionManager.ts
 * Gestor de sesión deslizante (sliding session) para el panel administrativo.
 *
 * Mantiene viva la sesión mientras el usuario está activo, renovando el access
 * token de forma proactiva un poco antes de que expire. Si el usuario permanece
 * inactivo más allá del límite definido, deja de renovar y la sesión se cierra
 * de forma natural al vencer el token.
 *
 * Coordina la renovación entre múltiples pestañas para evitar disparar la
 * detección de reuso de refresh tokens del backend (que revoca toda la sesión):
 *   - Web Locks API   → serializa el refresh entre pestañas del mismo navegador.
 *   - localStorage    → comparte el último token fresco de forma síncrona.
 *   - BroadcastChannel→ propaga el token nuevo (y el logout) al resto de pestañas.
 */
import { getAccessToken, setAccessToken } from './TokenManager'

/** Motivo por el que se cierra la sesión (para mostrar el mensaje adecuado). */
export type ExpiryReason = 'inactivity' | 'too_long' | 'logout'

/** Segundos de margen para renovar el token antes de su expiración real. */
const SKEW_MS = 60 * 1000
/** Tiempo sin actividad tras el cual dejamos de renovar la sesión. */
const INACTIVITY_LIMIT_MS = 20 * 60 * 1000
/**
 * Tope absoluto de sesión: aun con actividad continua, pasado este tiempo desde
 * el login cortamos la sesión y pedimos la contraseña nuevamente. Debe coincidir
 * con `session_max_hours` del backend (que es quien lo hace cumplir de verdad).
 */
const SESSION_MAX_MS = 4 * 60 * 60 * 1000
/** Frecuencia con la que evaluamos si corresponde renovar el token. */
const CHECK_EVERY_MS = 20 * 1000
/** Nombre del canal de coordinación entre pestañas. */
const CHANNEL_NAME = 'hbp_auth'
/** Clave donde persistimos el inicio de sesión (sobrevive recargas). */
const SESSION_START_KEY = 'hbp_session_start'

/** Eventos del DOM considerados como actividad del usuario. */
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']

let started = false
let lastActivity = Date.now()
let intervalId: number | null = null
let channel: BroadcastChannel | null = null
let inFlight: Promise<string | null> | null = null
let onExpired: ((reason: ExpiryReason) => void) | null = null

/**
 * Marca el inicio de una sesión nueva (login). Reinicia el reloj del tope
 * absoluto de 4 h; persiste para que las recargas no lo reseteen.
 */
export function beginSession() {
  localStorage.setItem(SESSION_START_KEY, String(Date.now()))
}

/** Momento de inicio de la sesión actual; si no hay registro, asume ahora. */
function getSessionStart(): number {
  const raw = localStorage.getItem(SESSION_START_KEY)
  const n = raw ? parseInt(raw, 10) : NaN
  return Number.isFinite(n) ? n : Date.now()
}

/** Limpia el registro de inicio de sesión. */
function clearSessionStart() {
  localStorage.removeItem(SESSION_START_KEY)
}

/** Clave del motivo de cierre, para que la pantalla de login lo muestre. */
const EXPIRED_FLAG_KEY = 'hbp_session_expired_reason'

/** Deja registrado el motivo del último cierre para mostrarlo en el login. */
export function flagSessionExpired(reason: ExpiryReason) {
  try {
    sessionStorage.setItem(EXPIRED_FLAG_KEY, reason)
  } catch {
    /* sessionStorage no disponible: ignoramos, es solo informativo. */
  }
}

/** Lee y consume (una sola vez) el motivo del último cierre de sesión. */
export function takeSessionExpiredReason(): ExpiryReason | null {
  try {
    const r = sessionStorage.getItem(EXPIRED_FLAG_KEY)
    if (r) sessionStorage.removeItem(EXPIRED_FLAG_KEY)
    return (r as ExpiryReason) || null
  } catch {
    return null
  }
}

/**
 * Lee el campo `exp` (en ms) de un JWT sin verificar la firma y sin loguear.
 * @param token - Token JWT a inspeccionar.
 * @returns Timestamp de expiración en milisegundos, o null si es inválido.
 */
function tokenExpMs(token: string | null): number | null {
  if (!token) return null
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const padded = part.padEnd(part.length + ((4 - (part.length % 4)) % 4), '=')
    const payload = JSON.parse(atob(padded)) as { exp?: number }
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

/** Marca el instante de la última actividad del usuario. */
function markActivity() {
  lastActivity = Date.now()
}

/**
 * Aplica un access token nuevo: lo guarda en memoria (nunca en disco) y
 * opcionalmente lo propaga al resto de pestañas.
 * @param token - Nuevo access token.
 * @param broadcast - Si debe notificarse al resto de pestañas.
 */
export function applyAccessToken(token: string, broadcast = true) {
  setAccessToken(token)
  if (broadcast && channel) {
    channel.postMessage({ type: 'token', token })
  }
}

/**
 * Ejecuta el refresh real contra el backend de forma serializada entre pestañas.
 * Si otra pestaña ya propagó un token fresco (vía broadcast), lo reutiliza.
 */
async function doRefresh(): Promise<string | null> {
  const run = async (): Promise<string | null> => {
    // ¿Otra pestaña ya renovó y nos propagó el token? Evitamos rotar de nuevo.
    const current = getAccessToken()
    const currentExp = tokenExpMs(current)
    if (current && currentExp && currentExp - Date.now() > SKEW_MS) {
      return current
    }

    try {
      const { refreshToken } = await import('../api/auth.api')
      const { access_token } = await refreshToken()
      if (!access_token) return null
      applyAccessToken(access_token, true)
      return access_token
    } catch {
      return null
    }
  }

  // Web Locks serializa la renovación entre todas las pestañas del navegador.
  if ('locks' in navigator && navigator.locks?.request) {
    return navigator.locks.request('hbp_auth_refresh', run)
  }
  return run()
}

/**
 * Renueva el access token, deduplicando llamadas concurrentes dentro de la pestaña.
 * @returns El nuevo token, o null si la renovación falló.
 */
export function refreshSession(): Promise<string | null> {
  if (inFlight) return inFlight
  inFlight = doRefresh().finally(() => {
    inFlight = null
  })
  return inFlight
}

/** Evalúa periódicamente si corresponde renovar el token o cerrar la sesión. */
async function check() {
  const token = getAccessToken()
  const exp = tokenExpMs(token)
  if (!token || !exp) return

  // 🔒 Tope absoluto de sesión: pasadas 4 h desde el login cerramos aunque el
  // usuario esté activo. Pedirá la contraseña nuevamente.
  if (Date.now() - getSessionStart() >= SESSION_MAX_MS) {
    onExpired?.('too_long')
    return
  }

  // ⏱️ Cierre por inactividad real: si pasaron 20 min sin actividad, cerramos
  // ya mismo, sin esperar a que venza el token.
  if (Date.now() - lastActivity >= INACTIVITY_LIMIT_MS) {
    onExpired?.('inactivity')
    return
  }

  // Si el token todavía tiene margen, no hacemos nada.
  if (exp - Date.now() > SKEW_MS) return

  // El usuario está activo y el token está por vencer → lo renovamos.
  // (Sesión deslizante mientras trabaje, hasta el tope absoluto de 4 h.)
  const newToken = await refreshSession()
  const stillValid = tokenExpMs(newToken ?? getAccessToken())
  if (!newToken && (!stillValid || stillValid <= Date.now())) {
    onExpired?.('inactivity')
  }
}

/** Configura el canal de comunicación entre pestañas. */
function setupChannel() {
  if (!('BroadcastChannel' in window)) return
  channel = new BroadcastChannel(CHANNEL_NAME)
  channel.onmessage = (ev) => {
    const data = ev.data
    if (data?.type === 'token' && data.token) {
      setAccessToken(data.token)
    } else if (data?.type === 'logout') {
      onExpired?.('logout')
    }
  }
}

/**
 * Inicia el seguimiento de actividad y la renovación proactiva de la sesión.
 * Es idempotente: múltiples llamadas no duplican listeners ni timers.
 * @param onSessionExpired - Callback a ejecutar cuando la sesión debe cerrarse;
 *   recibe el motivo del cierre para mostrar el mensaje adecuado.
 */
export function startSession(onSessionExpired: (reason: ExpiryReason) => void) {
  onExpired = onSessionExpired
  if (started) return
  started = true
  lastActivity = Date.now()
  // Rehidratación tras recargar: si no hay inicio registrado, lo fijamos ahora
  // (el login ya lo fija explícitamente vía beginSession()).
  if (!localStorage.getItem(SESSION_START_KEY)) beginSession()

  ACTIVITY_EVENTS.forEach((e) =>
    window.addEventListener(e, markActivity, { passive: true })
  )
  document.addEventListener('visibilitychange', markActivity)
  setupChannel()

  intervalId = window.setInterval(check, CHECK_EVERY_MS)
  void check()
}

/**
 * Detiene el seguimiento de la sesión y libera todos los recursos.
 * @param broadcast - Si debe notificarse el cierre al resto de pestañas.
 */
export function stopSession(broadcast = false) {
  if (broadcast && channel) {
    channel.postMessage({ type: 'logout' })
  }
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
  ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, markActivity))
  document.removeEventListener('visibilitychange', markActivity)
  channel?.close()
  channel = null
  started = false
  inFlight = null
  clearSessionStart()
}
