// src/api/personas.api.ts

import api from "./axios"
import type { Persona } from "../types/persona"

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
