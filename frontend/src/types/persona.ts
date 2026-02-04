// src/types/persona.ts
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

export interface PersonaAltaConRol {
  persona: Omit<Persona, "id_persona">
  rol: {
    rol: string
  }
}
