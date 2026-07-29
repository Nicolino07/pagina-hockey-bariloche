// src/api/planteles.api.ts
import type { TipoRolPersona } from "../constants/enums"
import api from "./axiosAdmin"
import axiosAdmin from "./axiosAdmin"
import type { Plantel } from "../types/plantel"
import type { Torneo } from "../types/torneo"
import type { PlantelIntegrante } from "../types/plantelIntegrante"

export interface CreatePlantelDTO {
  id_equipo: number
  /** Torneo de la nómina. Si viene, el backend deriva nombre y temporada. */
  id_torneo?: number | null
  nombre?: string
  temporada?: string
  descripcion?: string
  fecha_apertura?: string
  activo: boolean
  creado_por?: string
}

export interface UpdatePlantelDTO {
  nombre?: string
  temporada?: string
  descripcion?: string
}

export interface CopiarPlantelDTO {
  id_plantel_origen: number
  /** Destino: un plantel que ya existe (para llenarlo y luego ajustarlo)... */
  id_plantel_destino?: number
  /** ...o un torneo, creando el plantel en el acto. */
  id_torneo_destino?: number
}

export interface CopiaPlantelResultado {
  id_plantel_destino: number
  copiados: number
  omitidos: { id_persona: number; nombre: string; motivo: string }[]
}

export async function getPlantelesDeEquipo(id_equipo: number): Promise<Plantel[]> {
  const { data } = await api.get<Plantel[]>(`/planteles/equipo/${id_equipo}`)
  return data
}

export async function getPlantelActivoByEquipo(id_equipo: number): Promise<Plantel> {
  const { data } = await api.get<Plantel>(`/planteles/activo/${id_equipo}`)
  return data
}

export async function createPlantel(payload: CreatePlantelDTO): Promise<Plantel> {
  const { data } = await api.post<Plantel>("/planteles/", payload)
  return data
}

/**
 * Torneos a los que se le puede crear una nómina a este equipo: activos, con el
 * equipo inscripto, que no sean fase final y sin plantel todavía. El backend
 * aplica las mismas reglas que la creación, así que nada de lo que devuelve falla.
 */
export async function getTorneosDisponiblesParaPlantel(id_equipo: number): Promise<Torneo[]> {
  const { data } = await api.get<Torneo[]>(`/planteles/torneos-disponibles/${id_equipo}`)
  return data
}

/** Devuelve el plantel que corresponde usar para ese equipo en ese torneo. */
export async function resolverPlantelDeTorneo(
  id_equipo: number,
  id_torneo: number,
): Promise<Plantel> {
  const { data } = await api.get<Plantel>("/planteles/resolver", {
    params: { id_equipo, id_torneo },
  })
  return data
}

/** Copia la nómina de un plantel hacia otro torneo del mismo equipo. */
export async function copiarPlantel(payload: CopiarPlantelDTO): Promise<CopiaPlantelResultado> {
  const { data } = await api.post<CopiaPlantelResultado>("/planteles/copiar", payload)
  return data
}

export async function updatePlantel(id_plantel: number, payload: UpdatePlantelDTO): Promise<Plantel> {
  const { data } = await api.put<Plantel>(`/planteles/${id_plantel}`, payload)
  return data
}

// No hay cierre manual de planteles: la nómina vive junto a su torneo, así que
// se cierra al finalizarlo y se reabre al reabrirlo.

export async function deletePlantel(id_plantel: number): Promise<void> {
  await api.delete(`/planteles/${id_plantel}`)
}

export async function getIntegrantesByPlantel(id_plantel: number, soloActivos = true): Promise<PlantelIntegrante[]> {
  const { data } = await api.get<PlantelIntegrante[]>(`/planteles/${id_plantel}/integrantes`, {
    params: { solo_activos: soloActivos },
  })
  return data
}

export async function agregarIntegrante(payload: {
  id_plantel: number
  id_persona: number
  id_fichaje_rol: number
  rol_en_plantel: TipoRolPersona
  numero_camiseta?: number
}): Promise<PlantelIntegrante> {
  const { data } = await axiosAdmin.post<PlantelIntegrante>("/planteles/integrantes", payload)
  return data
}

export async function bajaIntegrantePlantel(id_integrante: number): Promise<void> {
  await axiosAdmin.delete(`/planteles/integrantes/${id_integrante}`)
}
