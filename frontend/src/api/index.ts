// src/api/index.ts

export { default as axiosPublic } from './axiosPublic'
export { default as axiosAdmin } from './axiosAdmin'

console.log("🌍 VITE_API_URL =", import.meta.env.VITE_API_URL)

export {
  login,
  refreshToken,
  logout,
  getCurrentUser,
  checkAuthStatus,
  getCurrentToken,
} from './auth.api'

export {
  getPlantelActivoPorEquipo,
} from './vistas/plantel.api'

// Exportar otros APIs según los vayas creando
// export * from './equipos.api'
// export * from './jugadores.api'
// export * from './clubes.api'