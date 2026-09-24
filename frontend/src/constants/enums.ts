// src/constants/enums.ts

// =====================
// Género
// =====================
export const GENEROS = [
  "MASCULINO",
  "FEMENINO",
  "MIXTO",
] as const

export type TipoGenero = typeof GENEROS[number]

// =====================
// Categoría deportiva
// =====================
export const CATEGORIAS = [
  "MAYORES",
  "SUB_19",
  "SUB_16",
  "SUB_14",
  "SUB_12",
] as const

export type TipoCategoria = typeof CATEGORIAS[number]

export const DIVISIONES_MAYORES = ["A", "B"] as const
export const DIVISIONES = ["A", "B", "DESARROLLO"] as const
export type TipoDivision = typeof DIVISIONES[number] | string | null

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

export const ORIGENES_SUSPENSION = [
  "AUTOMATICA_AMARILLAS",
  "AUTOMATICA_ROJA",
  "MANUAL",
] as const

export type TipoOrigenSuspension = typeof ORIGENES_SUSPENSION[number]

// =====================
// Gol
// =====================
// `DP` (definición por penales) ya NO es un tipo de gol: la tanda vive en su
// propia tabla (`penal_definicion`) porque no suma al marcador, ni al ranking de
// goleadores, ni a la diferencia de gol. El valor sigue existiendo en el enum de
// la base por compatibilidad, pero no se puede elegir desde la interfaz.
export const TIPOS_GOL = [
  "GJ",
  "GC",
  "GP",
] as const

export type TipoGol = typeof TIPOS_GOL[number]

/** Etiquetas legibles para el selector de tipo de gol. */
export const TIPOS_GOL_LABEL: Record<string, string> = {
  GJ: "Jugada",
  GC: "Corto",
  GP: "Penal",
  DP: "Definición por penales (histórico)",
}

export const ESTADOS_GOL = [
  "VALIDO",
  "ANULADO",
  "CORREGIDO",
] as const

export type TipoEstadoGol = typeof ESTADOS_GOL[number]

// =====================
// Tipo de torneo
// =====================
export const TIPOS_TORNEO = [
  "LIGA",
  "PLAYOFF",
  "COPA",
] as const

export type TipoTorneo = typeof TIPOS_TORNEO[number]

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

// =====================
// Entrega de puntos (walkover)
// =====================
export const MOTIVOS_PUNTOS = [
  "NO_PRESENTO_LOCAL",
  "NO_PRESENTO_VISITANTE",
  "NO_PRESENTARON_AMBOS",
  "DESCALIFICADO_LOCAL",
  "DESCALIFICADO_VISITANTE",
  "OTRO",
] as const

export type MotivoPuntos = typeof MOTIVOS_PUNTOS[number]

/**
 * Etiquetas del motivo con los nombres de equipo interpolados.
 * Se usan tanto en el panel de carga como en las vistas públicas.
 */
export function etiquetaMotivoPuntos(
  motivo: string | null | undefined,
  equipoLocal = "El equipo local",
  equipoVisitante = "El equipo visitante",
): string | null {
  switch (motivo) {
    case "NO_PRESENTO_LOCAL":       return `${equipoLocal} no se presentó`
    case "NO_PRESENTO_VISITANTE":   return `${equipoVisitante} no se presentó`
    case "NO_PRESENTARON_AMBOS":    return "Ningún equipo se presentó"
    case "DESCALIFICADO_LOCAL":     return `${equipoLocal} fue descalificado`
    case "DESCALIFICADO_VISITANTE": return `${equipoVisitante} fue descalificado`
    case "OTRO":                    return "Puntos otorgados por decisión administrativa"
    default:                        return null
  }
}
