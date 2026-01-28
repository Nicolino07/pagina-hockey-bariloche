// src/types/vistas.ts
import type { TipoGenero, TipoRolPersona } from "./enums"

export interface PlantelActivoIntegrante {
  id_equipo: number
  id_plantel: number
  id_plantel_integrante: number

  rol_en_plantel: TipoRolPersona
  numero_camiseta: number | null
  fecha_alta: string
  fecha_baja: string | null

  id_persona: number
  nombre: string
  apellido: string
  documento: number
}

export interface PersonaConRol {
  id_persona: number
  nombre: string
  apellido: string
  id_rol: number
  rol_codigo: TipoRolPersona
  genero: TipoGenero   // 👈 esta línea
}
