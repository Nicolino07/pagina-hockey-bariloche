// src/types/plantel.ts

export interface Plantel {
  id_plantel: number
  id_equipo: number
  nombre: string
  temporada: string
  descripcion?: string | null
  fecha_apertura: string
  fecha_cierre?: string | null
  activo: boolean
  creado_en: string
  actualizado_en?: string | null
  borrado_en?: string | null
  creado_por?: string | null
  actualizado_por?: string | null
}
