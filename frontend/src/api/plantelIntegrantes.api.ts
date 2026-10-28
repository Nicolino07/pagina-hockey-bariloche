
// src/api/plantelIntegrantes.api.ts

import type { TipoRolPersona } from "../constants/enums"
import type {
  PlantelIntegrante,
} from "../types/plantelIntegrante"
import api from "./axiosAdmin"


// 📄 Listar integrantes
export async function getIntegrantesByPlantel(
  id_plantel: number
): Promise<PlantelIntegrante[]> {
  const res = await api.get(
    `/planteles/${id_plantel}/integrantes`
  )
  return res.data
}

// ➕ Crear integrante
export async function agregarIntegrante(
  data: {
    id_plantel: number
    id_persona: number
    rol_en_plantel: TipoRolPersona
    id_fichaje_rol: number;
    numero_camiseta?: number | null
  }
) {
  const res = await api.post(
    "/planteles/integrantes",
    data
  )
  return res.data
}


// ❌ Baja integrante
export async function darBajaIntegrante(
  id_integrante: number
): Promise<void> {
  await api.delete(
    `/planteles/integrantes/${id_integrante}`
  )
}
