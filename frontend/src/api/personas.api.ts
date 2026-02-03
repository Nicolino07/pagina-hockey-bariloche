import api from "./axiosAdmin"
import type {
  Persona,
  PersonaAltaConRol,
  PersonaConRolesActivos,
} from "../types/persona"
import type { PersonaConRol } from "../types/vistas"

/* =========================
   PERSONAS (ABM)
========================= */

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

/* =========================
   PERSONAS + ROLES
========================= */

/**
 * Personas con roles activos
 * Opcionalmente filtradas por club
 */
export async function getPersonasConRolesActivos(
  params?: {
    idClub?: number
    idPersona?: number
  }
): Promise<PersonaConRolesActivos[]> {
  const res = await api.get("/personas/roles-activos", {
    params: {
      id_club: params?.idClub,
      id_persona: params?.idPersona,
    },
  })
  return res.data
}


/**
 * Crear persona + rol inicial
 */
export async function crearPersona(
  data: PersonaAltaConRol
): Promise<Persona> {
  const res = await api.post("/personas", data)
  return res.data
}
/**
 * Quitar rol a persona
 */
export async function quitarRolPersona(
  id_persona_rol: number
): Promise<void> {
  await api.delete(`/persona-roles/${id_persona_rol}`)
}
