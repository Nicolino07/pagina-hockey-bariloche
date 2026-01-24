// src/types/plantelIntegrante.ts

import type { TipoRolPersona } from "./enums"
import type { Persona } from "./persona"

// 🔎 Lo que viene del backend
export type PlantelIntegrante = {
  id_plantel_integrante: number
  id_plantel: number
  id_persona: number

  rol_en_plantel: TipoRolPersona
  numero_camiseta?: number | null

  fecha_alta: string
  fecha_baja?: string | null

  persona?: Persona
}

// ➕ Lo que enviamos al backend
export type PlantelIntegranteCreate = {
  id_persona: number
  rol_en_plantel: TipoRolPersona
  numero_camiseta?: number | null
}

