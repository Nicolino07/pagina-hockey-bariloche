import api from "./axiosAdmin"
import type { Persona } from "../types/persona"
import type { TipoRolPersona } from "../types/enums"
import type { PersonaConRol } from "../types/vistas"

/* =========================
   PERSONAS BÁSICAS
========================= */

export async function listarPersonas(): Promise<Persona[]> {
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
   PERSONAS + ROL
========================= */

/**
 * Trae personas filtradas por rol
 * (para el modal de "Agregar persona")
 */
export async function getPersonasConRol(
  rol: TipoRolPersona
): Promise<PersonaConRol[]> {
  const res = await api.get("/personas", {
    params: { rol },
  })
  return res.data
}

/**
 * Crea una persona y la asocia a un plantel con un rol
 */
export async function crearPersonaConRol(data: {
  nombre: string
  apellido: string
  dni: string
  rol: TipoRolPersona
  id_plantel: number
}): Promise<void> {
  await api.post("/personas", data)
}
