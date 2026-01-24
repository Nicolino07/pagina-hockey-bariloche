// src/types/plantel.ts

export type Plantel = {
  id_plantel: number
  id_equipo: number
  fecha_creacion: string
  activo: boolean

  creado_en: string
  actualizado_en?: string | null
  borrado_en?: string | null
}

export type PlantelCreate = {
  id_equipo: number
}

export type PlantelUpdate = {
  activo?: boolean
}
