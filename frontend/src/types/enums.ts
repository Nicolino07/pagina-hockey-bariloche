// src/types/enums.ts

// =====================
// Género
// =====================
export type TipoGenero =
  | "MASCULINO"
  | "FEMENINO"

// =====================
// Categoría deportiva
// =====================
export type TipoCategoria =
  | "A"
  | "B"
  | "SUB_19"
  | "SUB_16"
  | "SUB_14"
  | "SUB_14_DESARROLLO"
  | "SUB_12"

// =====================
// Rol de persona
// =====================
export type TipoRolPersona =
  | "JUGADOR"
  | "ENTRENADOR"
  | "ARBITRO"
  | "ASISTENTE"
  | "MEDICO"
  | "PREPARADOR_FISICO"
  | "DELEGADO"

// =====================
// Partido
// =====================
export type TipoEstadoPartido =
  | "BORRADOR"
  | "TERMINADO"
  | "SUSPENDIDO"
  | "ANULADO"
  | "REPROGRAMADO"

// =====================
// Tarjetas
// =====================
export type TipoTarjeta =
  | "VERDE"
  | "AMARILLA"
  | "ROJA"

export type TipoEstadoTarjeta =
  | "VALIDA"
  | "ANULADA"
  | "CORREGIDA"

// =====================
// Suspensión
// =====================
export type TipoSuspension =
  | "POR_PARTIDOS"
  | "POR_FECHA"

export type TipoEstadoSuspension =
  | "ACTIVA"
  | "CUMPLIDA"
  | "ANULADA"

// =====================
// Gol
// =====================
export type TipoGol =
  | "GJ"
  | "GC"
  | "GP"
  | "DP"

export type TipoEstadoGol =
  | "VALIDO"
  | "ANULADO"
  | "CORREGIDO"

// =====================
// Fase
// =====================
export type TipoFase =
  | "LIGA"
  | "ELIMINACION"
  | "GRUPOS"

// =====================
// Usuario
// =====================
export type TipoUsuario =
  | "SUPERUSUARIO"
  | "ADMIN"
  | "EDITOR"
  | "LECTOR"
