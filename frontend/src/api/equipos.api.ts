// api/equipos.api.ts

// src/api/equipos.api.ts
import axiosAdmin from './axiosAdmin' // ← Cambia esto

export function getEquipoById(id: number) {
  return axiosAdmin  // ← Usa axiosAdmin
    .get<Equipo>(`/equipos/${id}`)
    .then(res => res.data)
}

export function createEquipo(equipoData: EquipoCreate) {
  return axiosAdmin  // ← Usa axiosAdmin
    .post<Equipo>('/equipos', equipoData)
    .then(res => res.data)
}

// ... resto de funciones
import api from "./axiosAdmin"
import type { Equipo, EquipoCreate, EquipoUpdate } from "../types/equipo"

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

export async function getEquipos(): Promise<Equipo[]> {
  const res = await api.get("/equipos")
  return res.data.map(mapEquipoFromApi)
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
