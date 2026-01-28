// src/api/planteles.api.ts
import type { TipoRolPersona } from "../types/enums"
import api from "./axiosAdmin"
import axiosAdmin from "./axiosAdmin"
import type { Plantel } from "../types/plantel"
import type {
  PlantelIntegrante,
} from "../types/plantelIntegrante"

// 🔹 Obtener plantel activo de un equipo
export async function getPlantelActivoByEquipo(
  id_equipo: number
): Promise<Plantel> {
  const { data } = await api.get<Plantel>(
    `/planteles/activo/${id_equipo}`
  )
  return data
}

// 🔹 Crear plantel (ADMIN)
export async function createPlantel(
  id_equipo: number
): Promise<Plantel> {
  const { data } = await api.post<Plantel>("/planteles", {
    id_equipo,
  })
  return data
}

// 🔹 Listar integrantes de un plantel
export async function getIntegrantesByPlantel(
  id_plantel: number
): Promise<PlantelIntegrante[]> {
  const { data } = await api.get<PlantelIntegrante[]>(
    `/planteles/${id_plantel}/integrantes`
  )
  return data
}

// 🔹 Agregar integrante a un plantel (EDITOR / ADMIN)

export async function agregarIntegrantePlantel(
  id_plantel: number,
  id_persona: number,
  rol_en_plantel: TipoRolPersona,
  numero_camiseta?: number
) {
  return axiosAdmin.post("/planteles/integrantes", {
    id_plantel,
    id_persona,
    rol_en_plantel,
    numero_camiseta,
  })
}



// 🔹 Dar de baja un integrante (ADMIN)
export async function bajaIntegrantePlantel(
  id_integrante: number
): Promise<void> {
  await axiosAdmin.delete(
    `/planteles/integrantes/${id_integrante}`
  )
}
