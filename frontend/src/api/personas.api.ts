// src/api/personas.api.ts

import api from "./axiosAdmin"
import type { Persona } from "../types/persona"
import type { PersonaConRolesVista } from "../types/vistas"

export async function getPersonas(): Promise<Persona[]> {
  const res = await api.get("/personas")
  return res.data
}

export async function getPersonaById(
  id_persona: number
): Promise<Persona> {
  const res = await api.get(`/personas/${id_persona}`)
  return res.data
}

export async function getPersonasConRolesActivos(
  params?: {
    idClub?: number
    idPersona?: number
  }
): Promise<PersonaConRolesVista[]> {
  const res = await api.get("/personas/roles-activos", {
    params: {
      id_club: params?.idClub,
      id_persona: params?.idPersona,
    },
  })
  return res.data
}

export async function quitarRolPersona(
  id_persona_rol: number
): Promise<void> {
  await api.delete(`/persona-roles/${id_persona_rol}`)
}
