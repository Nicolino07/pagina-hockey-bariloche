// src/types/plantel.ts

export interface Plantel {
  id_plantel: number
  id_equipo: number
  // null = plantel histórico previo a la migración 0033.
  id_torneo?: number | null
  nombre: string
  temporada?: string | null
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

/** Lo que devuelve el endpoint público `/planteles/activo/{id_equipo}`. */
export type PlantelPublico = Pick<Plantel, "id_plantel" | "id_equipo" | "id_torneo" | "nombre" | "temporada">
