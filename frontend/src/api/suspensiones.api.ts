// frontend/src/api/suspensiones.api.ts
import api from "./axiosAdmin"
import axiosPublic from "./axiosPublic"
import type { Suspension, SuspensionCreatePayload } from "../types/suspension"

export const listarSuspensiones = async (params?: {
  id_persona?: number
  id_torneo?: number
  estado_suspension?: string
}): Promise<Suspension[]> => {
  const response = await axiosPublic.get("/suspensiones/", { params })
  return response.data
}

export const obtenerSuspensionesActivasPorPersona = async (idPersona: number): Promise<Suspension[]> => {
  const response = await axiosPublic.get(`/suspensiones/activas-por-persona/${idPersona}`)
  return response.data
}

export const obtenerSuspensionesActivasPorPersonas = async (
  idsPersona: number[]
): Promise<Record<number, Suspension[]>> => {
  if (idsPersona.length === 0) return {}
  const response = await axiosPublic.get("/suspensiones/activas-por-personas", {
    params: { ids: idsPersona.join(",") },
  })
  return response.data
}

export const crearSuspensionManual = async (data: SuspensionCreatePayload): Promise<Suspension> => {
  try {
    const response = await api.post("/suspensiones/manual", data, { withCredentials: true })
    return response.data
  } catch (error: any) {
    const mensaje = error.response?.data?.detail || error.response?.data?.message || "Error al crear la suspensión"
    throw new Error(mensaje)
  }
}

export const anularSuspension = async (idSuspension: number, motivoAnulacion: string): Promise<Suspension> => {
  try {
    const response = await api.patch(
      `/suspensiones/${idSuspension}/anular`,
      { motivo_anulacion: motivoAnulacion },
      { withCredentials: true }
    )
    return response.data
  } catch (error: any) {
    const mensaje = error.response?.data?.detail || error.response?.data?.message || "Error al anular la suspensión"
    throw new Error(mensaje)
  }
}
