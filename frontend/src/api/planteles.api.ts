// src/api/planteles.api.ts

import api from "./axios"
import type { Plantel } from "../types/plantel"
import type { PlantelIntegrante } from "../types/plantelIntegrante"

// 🔹 Obtener plantel activo de un equipo
export async function getPlantelActivoByEquipo(
  id_equipo: number
): Promise<Plantel | null> {
  const { data } = await api.get<Plantel | null>(
    `/planteles/activo/${id_equipo}`
  )
  return data
}

// 🔹 Crear plantel
export async function createPlantel(
  id_equipo: number
): Promise<Plantel> {
  const { data } = await api.post<Plantel>("/planteles", {
    id_equipo,
  })
  return data
}

// 🔹 Obtener integrantes de un plantel
export async function getIntegrantesByPlantel(
  id_plantel: number
): Promise<PlantelIntegrante[]> {
  const { data } = await api.get<PlantelIntegrante[]>(
    `/planteles/${id_plantel}/integrantes`
  )
  return data
}
