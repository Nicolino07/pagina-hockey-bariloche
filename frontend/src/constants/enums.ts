// src/constants/enums.ts

// =====================
// Género
// =====================
export const GENEROS = [
  "MASCULINO",
  "FEMENINO",
] as const

export type TipoGenero = typeof GENEROS[number]

// =====================
// Categoría deportiva
// =====================
export const CATEGORIAS = [
  "A",
  "B",
  "SUB_19",
  "SUB_16",
  "SUB_14",
  "SUB_14_DESARROLLO",
  "SUB_12",
] as const

export type TipoCategoria = typeof CATEGORIAS[number]

// =====================
// Rol de persona
// =====================
export const ROLES_PERSONA = [
  "JUGADOR",
  "DT",
  "ARBITRO",
  "ASISTENTE",
  "MEDICO",
  "PREPARADOR_FISICO",
  "DELEGADO",
] as const

export type TipoRolPersona = typeof ROLES_PERSONA[number]

// =====================
// Partido
// =====================
export const ESTADOS_PARTIDO = [
  "BORRADOR",
  "TERMINADO",
  "SUSPENDIDO",
  "ANULADO",
  "REPROGRAMADO",
] as const

export type TipoEstadoPartido = typeof ESTADOS_PARTIDO[number]

// =====================
// Tarjetas
// =====================
export const TIPOS_TARJETA = [
  "VERDE",
  "AMARILLA",
  "ROJA",
] as const

export type TipoTarjeta = typeof TIPOS_TARJETA[number]

export const ESTADOS_TARJETA = [
  "VALIDA",
  "ANULADA",
  "CORREGIDA",
] as const

export type TipoEstadoTarjeta = typeof ESTADOS_TARJETA[number]

// =====================
// Suspensión
// =====================
export const TIPOS_SUSPENSION = [
  "POR_PARTIDOS",
  "POR_FECHA",
] as const

export type TipoSuspension = typeof TIPOS_SUSPENSION[number]

export const ESTADOS_SUSPENSION = [
  "ACTIVA",
  "CUMPLIDA",
  "ANULADA",
] as const

export type TipoEstadoSuspension = typeof ESTADOS_SUSPENSION[number]

// =====================
// Gol
// =====================
export const TIPOS_GOL = [
  "GJ",
  "GC",
  "GP",
  "DP",
] as const

export type TipoGol = typeof TIPOS_GOL[number]

export const ESTADOS_GOL = [
  "VALIDO",
  "ANULADO",
  "CORREGIDO",
] as const

export type TipoEstadoGol = typeof ESTADOS_GOL[number]

// =====================
// Fase
// =====================
export const FASES = [
  "LIGA",
  "ELIMINACION",
  "GRUPOS",
] as const

export type TipoFase = typeof FASES[number]

// =====================
// Usuario
// =====================
export const TIPOS_USUARIO = [
  "SUPERUSUARIO",
  "ADMIN",
  "EDITOR",
  "LECTOR",
] as const

export type TipoUsuario = typeof TIPOS_USUARIO[number]
