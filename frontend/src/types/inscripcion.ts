// frontend/src/types/inscripcion.ts
import type { TipoCategoria, TipoGenero } from "../constants/enums"

export interface InscripcionTorneo {
  id_inscripcion: number
  id_equipo: number
  id_torneo: number
  fecha_inscripcion: string
  fecha_baja: string | null
}



export interface InscripcionTorneoDetalle {
  id_inscripcion: number
  id_equipo: number
  id_torneo: number

  nombre_equipo: string
  nombre_club: string

  categoria_equipo: TipoCategoria
  genero_equipo: TipoGenero

  fecha_inscripcion: string
  fecha_baja: string | null
}