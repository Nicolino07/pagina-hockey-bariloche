// src/types/plantel.ts

import type { PlantelIntegrante } from "./plantelIntegrante"

export type Plantel = {
  id_plantel: number
  id_equipo: number
  fecha_creacion: string
  activo: boolean

  creado_en: string
  actualizado_en?: string | null
  borrado_en?: string | null

  integrantes?: PlantelIntegrante[]  
}

export type PlantelCreate = {
  id_equipo: number
}

export type PlantelUpdate = {
  activo?: boolean
}
