import api from "./axiosAdmin"
import axiosPublic from "./axiosPublic"
import type { Torneo, TorneoCreate, TorneoUpdate } from "../types/torneo"
import type { InscripcionTorneoDetalle} from "../types/inscripcion"


// LISTAR (público - no requiere autenticación)
export async function listarTorneosPublico(soloActivos: boolean = true): Promise<Torneo[]> {
  const res = await axiosPublic.get<Torneo[]>("/torneos/", {
    params: { solo_activos: soloActivos }
  })
  return res.data
}

// LISTAR (admin - requiere autenticación)
export async function listarTorneos(soloActivos: boolean = true): Promise<Torneo[]> {
  const res = await api.get<Torneo[]>("/torneos/", {
    params: { solo_activos: soloActivos }
  })
  return res.data
}

// DETALLE
export async function getTorneo(id: number): Promise<Torneo> {
  const res = await api.get<Torneo>(`/torneos/${id}`)
  return res.data
}


// 🔐 ADMIN
export async function crearTorneo(
  data: TorneoCreate
): Promise<Torneo> {
  const response = await api.post("/torneos/", data)
  return response.data
}

// =======================
// LISTAR INSCRIPCIONES
// GET /torneos/{id}/inscripciones/
// =======================
export const listarInscripcionesTorneo = async (
  id_torneo: number
): Promise<InscripcionTorneoDetalle[]> => {
  const res = await api.get<InscripcionTorneoDetalle[]>(
    `/torneos/${id_torneo}/inscripciones/`
  )
  return res.data
}


// =======================
// INSCRIBIR EQUIPO
// POST /torneos/{id}/inscripciones/
// BODY: { id_equipo }
// =======================
export const inscribirEquipoTorneo = (
  idTorneo: number,
  idEquipo: number
) =>
  api.post(`/torneos/${idTorneo}/inscripciones/`, {
    id_equipo: idEquipo,
  })



// =======================
// DAR DE BAJA
// DELETE /torneos/{id}/inscripciones/{id_equipo}/BAJA
// =======================
export const darDeBajaEquipoTorneo = async (
  id_torneo: number,
  id_equipo: number
): Promise<void> => {
  await api.delete(
    `/torneos/${id_torneo}/inscripciones/${id_equipo}/BAJA`
  )
}


// ✏️ Actualizar torneo
export async function actualizarTorneo(
  id_torneo: number,
  data: TorneoUpdate
): Promise<Torneo> {
  const { data: res } = await api.put(`/torneos/${id_torneo}`, data)
  return res
}

// Radio de impacto de una eliminación definitiva
export interface ImpactoEliminacion {
  id_torneo: number
  nombre: string
  finalizado: boolean
  fases: number
  partidos: number
  goles: number
  tarjetas: number
  inscripciones: number
}

// 🔎 Preview: qué se borraría si se elimina el torneo (no borra nada)
export async function impactoEliminacionTorneo(
  id_torneo: number
): Promise<ImpactoEliminacion> {
  const { data } = await api.get(`/torneos/${id_torneo}/impacto-eliminacion`)
  return data
}

// 🗑 Eliminación DEFINITIVA (borrado físico con cascada, irreversible)
export async function eliminarTorneo(id_torneo: number) {
  const { data } = await api.delete(`/torneos/${id_torneo}`)
  return data
}

// 🔁 Reabrir torneo
export async function reabrirTorneo(id_torneo: number): Promise<Torneo> {
  const { data } = await api.post(`/torneos/${id_torneo}/reabrir`)
  return data
}

// 🏁 Finalizar torneo
export async function finalizarTorneo(
  id_torneo: number,
  fecha_fin?: string
): Promise<Torneo> {
  const { data } = await api.post(
    `/torneos/${id_torneo}/finalizar`,
    fecha_fin ? { fecha_fin } : null
  )
  return data
}