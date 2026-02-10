// src/api/planteles.api.ts
import type { TipoRolPersona } from "../constants/enums"
import api from "./axiosAdmin"
import axiosAdmin from "./axiosAdmin"
import type { Plantel } from "../types/plantel"
import type {
  PlantelIntegrante,
} from "../types/plantelIntegrante"

// 🔹 Definir la interfaz según tu SQL
export interface CreatePlantelDTO {
  id_equipo: number;
  nombre: string;
  temporada: string; // Formato 'YYYY' o 'YYYY-YYYY'
  descripcion?: string;
  fecha_apertura?: string; // ISO Date string
  activo: boolean;
  creado_por?: string;
}

// 🔹 Obtener plantel activo de un equipo
export async function getPlantelActivoByEquipo(
  id_equipo: number
): Promise<Plantel> {
  const { data } = await api.get<Plantel>(
    `/planteles/activo/${id_equipo}`
  )
  return data
}


// 🔹 Crear plantel (ADMIN) - Actualizado
export async function createPlantel(
  payload: CreatePlantelDTO
): Promise<Plantel> {
  const { data } = await api.post<Plantel>("/planteles/", payload);
  return data;
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
  id_fichaje_rol: number,
  rol_en_plantel: TipoRolPersona,
  numero_camiseta?: number
) {
  return api.post("/planteles/integrantes", {
    id_plantel,
    id_persona,
    id_fichaje_rol,
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
