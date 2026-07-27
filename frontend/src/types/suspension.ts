// frontend/src/types/suspension.ts
import type { TipoSuspension, TipoEstadoSuspension, TipoOrigenSuspension } from "../constants/enums"

export interface Suspension {
  id_suspension: number
  id_persona: number
  id_torneo?: number | null
  id_partido_origen?: number | null
  id_partido_a_cumplir?: number | null

  origen: TipoOrigenSuspension
  tipo_suspension: TipoSuspension
  motivo: string

  fechas_suspension?: number | null
  fecha_fin_suspension?: string | null

  cumplidas: number
  partidos_cumplidos?: number[] | null
  estado_suspension: TipoEstadoSuspension

  anulada_en?: string | null
  anulada_por?: string | null
  motivo_anulacion?: string | null

  creado_en: string
  actualizado_en?: string | null
  creado_por?: string | null
  actualizado_por?: string | null
}

export interface SuspensionCreatePayload {
  id_persona: number
  id_torneo?: number | null
  id_partido_origen?: number | null
  tipo_suspension: TipoSuspension
  motivo: string
  fechas_suspension?: number | null
  fecha_fin_suspension?: string | null
}
