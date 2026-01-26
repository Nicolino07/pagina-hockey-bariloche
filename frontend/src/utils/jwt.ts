// frontend/src/utils/jwt.ts - VERSIÓN COMPLETA Y CORRECTA
export type JwtPayload = {
  sub: string
  username: string
  rol: string
  exp: number
  iat?: number
  type?: string
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    // Verificar formato básico
    if (!token || typeof token !== 'string') {
      console.error('❌ Token inválido:', token)
      return null
    }
    
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('❌ Token mal formado, no tiene 3 partes')
      return null
    }
    
    const payloadBase64 = parts[1]
    
    // Añadir padding si es necesario para base64
    const padded = payloadBase64.padEnd(payloadBase64.length + (4 - payloadBase64.length % 4) % 4, '=')
    
    // Decodificar
    const payloadJson = atob(padded)
    const payload = JSON.parse(payloadJson) as JwtPayload
    
    console.log('🔐 Token decodificado:', {
      sub: payload.sub,
      username: payload.username,
      rol: payload.rol,
      exp: new Date(payload.exp * 1000).toLocaleString(),
      expUnix: payload.exp,
      nowUnix: Date.now() / 1000,
      timeLeft: (payload.exp - Date.now() / 1000).toFixed(0) + 's'
    })
    
    return payload
  } catch (error) {
    console.error('❌ Error decodificando JWT:', error, 'Token:', token?.substring(0, 50) + '...')
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token)
  if (!payload || !payload.exp) return true
  
  const now = Date.now() / 1000 // segundos
  const isExpired = payload.exp < now
  
  if (isExpired) {
    console.log('⚠️ Token expirado hace:', (now - payload.exp).toFixed(0), 'segundos')
  }
  
  return isExpired
}

export function getTokenTimeLeft(token: string): number {
  const payload = decodeJwt(token)
  if (!payload?.exp) return 0
  
  const now = Date.now() / 1000
  return Math.max(0, payload.exp - now) // segundos restantes
}

export function isTokenAboutToExpire(token: string, thresholdMinutes = 5): boolean {
  try {
    const timeLeft = getTokenTimeLeft(token)
    const thresholdSeconds = thresholdMinutes * 60
    
    console.log('⏰ Check token expiración:', {
      timeLeft: timeLeft.toFixed(0) + 's',
      threshold: thresholdSeconds + 's',
      aboutToExpire: timeLeft > 0 && timeLeft < thresholdSeconds
    })
    
    return timeLeft > 0 && timeLeft < thresholdSeconds
  } catch (error) {
    console.error('❌ Error en isTokenAboutToExpire:', error)
    return false
  }
}