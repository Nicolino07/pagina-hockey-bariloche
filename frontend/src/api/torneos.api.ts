import api from "./axiosAdmin"
import type { Torneo } from "../types/torneo"

export async function getTorneos(): Promise<Torneo[]> {
  const { data } = await api.get<Torneo[]>("/torneos")
  return data
}

export const getInscripcionesTorneo = async (idTorneo: number) => {
  const { data } = await api.get(
    `/torneos/${idTorneo}/inscripciones`
  )
  return data
}

export const darBajaInscripcion = async (
  idTorneo: number,
  idEquipo: number
) => {
  await api.delete(
    `/torneos/${idTorneo}/inscripciones/${idEquipo}/BAJA`
  )
}

export const inscribirEquipo = async (
  idTorneo: number,
  idEquipo: number
) => {
  await api.post(
    `/torneos/${idTorneo}/inscripciones`,
    { id_equipo: idEquipo }
  )
}

export function getTorneoById(idTorneo: number) {
  return api.get<Torneo>(`/torneos/${idTorneo}`)
}