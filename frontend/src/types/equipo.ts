import type { TipoCategoria, TipoGenero } from "./enums"

export type Equipo = {
  id_equipo: number
  nombre: string
  id_club: number
  categoria: TipoCategoria
  genero: TipoGenero

  creado_en: string
  actualizado_en?: string | null
  borrado_en?: string | null

  creado_por?: string | null
  actualizado_por?: string | null
}

export type EquipoCreate = {
  nombre: string
  id_club: number
  categoria: TipoCategoria
  genero: TipoGenero
}

export type EquipoUpdate = Partial<EquipoCreate>

export type EquipoListItem = Equipo & {
  club_nombre?: string
}
