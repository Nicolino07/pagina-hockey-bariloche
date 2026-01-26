import api from "./axiosAdmin"
// src/api/plantelIntegrantes.api.ts

import type {
  PlantelIntegrante,
  PlantelIntegranteCreate,
} from "../types/plantelIntegrante"

export async function getIntegrantesByPlantel(
  id_plantel: number
): Promise<PlantelIntegrante[]> {
  const res = await api.get(
    `/planteles/${id_plantel}/integrantes`
  )
  return res.data
}

export async function agregarIntegrante(
  id_plantel: number,
  data: PlantelIntegranteCreate
): Promise<PlantelIntegrante> {
  const res = await api.post(
    `/planteles/${id_plantel}/integrantes`,
    data
  )
  return res.data
}

export async function darBajaIntegrante(
  id_integrante: number
): Promise<void> {
  await api.post(
    `/plantel-integrantes/${id_integrante}/baja`
  )
}
