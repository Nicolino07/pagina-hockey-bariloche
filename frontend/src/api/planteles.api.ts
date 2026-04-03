// src/api/planteles.api.ts
import type { TipoRolPersona } from "../constants/enums"
import api from "./axiosAdmin"
import axiosAdmin from "./axiosAdmin"
import type { Plantel } from "../types/plantel"
import type { PlantelIntegrante } from "../types/plantelIntegrante"

export interface CreatePlantelDTO {
  id_equipo: number
  nombre: string
  temporada: string
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

export async function updatePlantel(id_plantel: number, payload: UpdatePlantelDTO): Promise<Plantel> {
  const { data } = await api.put<Plantel>(`/planteles/${id_plantel}`, payload)
  return data
}

export async function cerrarPlantel(id_plantel: number): Promise<Plantel> {
  const { data } = await api.patch<Plantel>(`/planteles/${id_plantel}/cerrar`)
  return data
}

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
