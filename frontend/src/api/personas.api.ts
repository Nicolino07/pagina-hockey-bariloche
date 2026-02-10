// src/api/personas.api.ts

import api from "./axiosAdmin"
import axiosAdmin from "./axiosAdmin"

import type { Persona, PersonaRolClub } from "../types/persona"
import type { PersonaConRoles } from "../types/vistas"

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
): Promise<PersonaConRoles[]> {
  const res = await api.get("/personas/roles-activos", {
    params: {
      id_club: params?.idClub,
      id_persona: params?.idPersona,
    },
  })
  return res.data
}



// =========================================
// quitarRolPersona
// =========================================
export async function quitarRolPersona(
  id_persona_rol: number
): Promise<void> {
  await api.delete(`/persona-roles/${id_persona_rol}`)
}


// Nueva función para obtener personas con roles y detalles de clubes


export async function getPersonasConRoles() {
  const res = await axiosAdmin.get<PersonaRolClub[]>(
    "/personas/roles-clubes"
  )
  return res.data
}

// Nueva función para actualizar una persona
export async function updatePersona(id: number, data: Partial<Persona>) {
  const response = await axiosAdmin.put(`/personas/${id}`, data);
  return response.data;
}


export const createPersonaConRol = async (personaData: any, rol: string) => {
  const payload = {
    persona: {
      ...personaData,
      // Normalizamos el género aquí para que el componente esté limpio
      genero: personaData.genero === "F" ? "FEMENINO" : 
              personaData.genero === "M" ? "MASCULINO" : "OTRO",
      documento: personaData.documento ? Number(personaData.documento) : null,
    },
    rol: {
      rol: rol,
      fecha_desde: new Date().toISOString().split('T')[0]
    }
  };

  const response = await axiosAdmin.post("/personas", payload);
  return response.data;
};