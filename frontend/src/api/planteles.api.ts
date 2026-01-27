// src/api/planteles.api.ts
import type { TipoRolPersona } from "../types/enums"
import api from "./axiosAdmin"
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
  plantelId: number,
  personaId: number,
  rol: TipoRolPersona
) {
  const res = await fetch(`/planteles/${plantelId}/integrantes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_persona: personaId,
      rol,
    }),
  })

  if (!res.ok) {
    const error = await res.json()
    throw {
      status: res.status,
      ...error,
    }
  }
}




// 🔹 Dar de baja un integrante (EDITOR / ADMIN)
export async function deleteIntegrante(
  id_integrante: number
): Promise<void> {
  await api.delete(`/planteles/integrantes/${id_integrante}`)
}
