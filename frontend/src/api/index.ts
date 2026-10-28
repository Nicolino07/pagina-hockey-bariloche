// src/api/index.ts

export { default as axiosPublic } from './axiosPublic'
export { default as axiosAdmin } from './axiosAdmin'


export {
  login,
  refreshToken,
  logout,
  getCurrentUser,
} from './auth.api'

export {
  getPlantelActivoPorEquipo,
} from './vistas/plantel.api'

// Exportar otros APIs según los vayas creando
// export * from './equipos.api'
// export * from './jugadores.api'
// export * from './clubes.api'