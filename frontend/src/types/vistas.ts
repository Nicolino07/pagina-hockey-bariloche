// frontend/src/types/vistas.ts
import type { Key, ReactNode } from "react"
import type { TipoGenero, TipoRolPersona } from "../constants/enums"



export interface PlantelActivoIntegrante {
  id_plantel: number;
  id_equipo: number;
  nombre_plantel: string;
  temporada: string;
  plantel_activo: boolean;

  // Estos campos son opcionales porque el plantel puede estar vacío
  id_persona?: number | null;
  nombre_persona?: string | null;
  apellido_persona?: string | null;
  rol_en_plantel?: string | null;
  numero_camiseta?: number | null;
  id_plantel_integrante?: number | null;
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
