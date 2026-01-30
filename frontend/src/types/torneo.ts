import type { TipoGenero, TipoCategoria } from "../constants/enums"


export interface Torneo {
  id_torneo: number
  nombre: string
  categoria: TipoCategoria
  genero: TipoGenero
  fecha_inicio: string
  fecha_fin: string | null
  activo: boolean
  creado_en: string
  actualizado_en: string | null
  creado_por: string
  actualizado_por: string | null
}

export interface TorneoCreate {
  nombre: string
  categoria: TipoCategoria
  genero: TipoGenero
  fecha_inicio?: string | null
  fecha_fin?: string | null
}