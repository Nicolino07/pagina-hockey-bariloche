// src/types/persona.ts

import type { TipoGenero } from "../constants/enums"

export interface Persona {
  id_persona: number
  documento?: number | null
  nombre: string
  apellido: string
  fecha_nacimiento?: string | null
  genero: TipoGenero
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  creado_en: string
  actualizado_en?: string | null
  borrado_en?: string | null
}

export type PersonaFormData = Omit<Persona, "id_persona" | "creado_en" | "actualizado_en" | "borrado_en">;

export interface PersonaAltaConRol {
  persona: Omit<Persona, "id_persona">
  rol: {
    rol: string
  }
}


export type PersonaRolClub = {
  id_persona: number
  nombre: string
  apellido: string
  genero?: string
  rol: string

  fichaje_activo: boolean | null
  fecha_fichaje: string | null
  fecha_fin_fichaje: string | null

  id_club: number | null
  nombre_club: string | null
  provincia_club: string | null
  ciudad_club: string | null

  estado_fichaje: "FICHADO" | "SIN_FICHAR"
  orden_roles: number
}
