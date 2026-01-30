// api/equipos.api.ts

import api from "./axiosAdmin"
import type { Equipo, EquipoCreate, EquipoUpdate } from "../types/equipo"


export function getEquipos() {
  return api.get<Equipo[]>("/equipos")
}

export function getEquipoById(id: number) {
  return api  
    .get<Equipo>(`/equipos/${id}`)
    .then(res => res.data)
}

export function crearEquipo(equipoData: EquipoCreate) {
  return api  
    .post<Equipo>('/equipos', equipoData)
    .then(res => res.data)
}


export function inscribirEquipo(
  idTorneo: number,
  idEquipo: number
) {
  return api.post(
    `/torneos/${idTorneo}/inscripciones`,
    { id_equipo: idEquipo }
  )
}


export async function getEquiposByClub(id_club: number): Promise<Equipo[]> {
  const res = await api.get("/equipos", {
    params: { id_club },
  })
  return res.data.map(mapEquipoFromApi)
}


export async function updateEquipo(
  id_equipo: number,
  payload: EquipoUpdate
): Promise<Equipo> {
  const res = await api.put(`/equipos/${id_equipo}`, payload)
  return mapEquipoFromApi(res.data)
}

export async function deleteEquipo(id_equipo: number): Promise<void> {
  await api.delete(`/equipos/${id_equipo}`)
}


// funcion auxiliar para mapear los campos de la API a los de la aplicacion
function mapEquipoFromApi(data: any): Equipo {
  return {
    id_equipo: data.id_equipo ?? data.id,
    nombre: data.nombre,
    id_club: data.id_club,
    categoria: data.categoria,
    genero: data.genero,

    creado_en: data.creado_en,
    actualizado_en: data.actualizado_en,
    borrado_en: data.borrado_en,

    creado_por: data.creado_por,
    actualizado_por: data.actualizado_por,
  }
}
