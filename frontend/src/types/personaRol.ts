// src/types/personaRol.ts

// types/personaRol.ts
export interface PersonaRolRow {
  id_persona: number
  nombre: string
  apellido: string
  rol: string
  estado_fichaje: "FICHADO" | "SIN_FICHAR"
  nombre_club: string | null
}
