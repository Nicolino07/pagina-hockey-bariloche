import type { TipoRolPersona } from "./enums"

export type PersonaRol = {
  id_persona_rol: number
  id_persona: number
  rol: TipoRolPersona
  fecha_desde: string
  fecha_hasta?: string | null

  creado_en: string
  actualizado_en?: string | null
}
