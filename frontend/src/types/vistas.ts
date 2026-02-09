// src/types/vistas.ts
import type { Key, ReactNode } from "react"
import type { TipoGenero, TipoRolPersona } from "../constants/enums"

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

// lista de personas con roles completa
export interface PersonasRolesVista {
  rol: ReactNode
  id_persona_rol: Key | null | undefined
  id_persona: number
  nombre: string
  apellido: string
  id_rol: number
  rol_codigo: TipoRolPersona
  genero: TipoGenero   // 👈 esta línea
  nombre_club?: string | null
  fecha_desde?: string | null
  fecha_hasta?: string | null
}

// Ver una persona con sus roles asociados utiliza la vista
export interface PersonaConRoles {
  id_persona: number
  nombre: string
  apellido: string
  roles: PersonasRolesVista[]
}
