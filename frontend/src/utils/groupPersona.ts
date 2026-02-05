// utils/groupPersonas.ts
import type { PersonaRolRow } from "../types/personaRol"

export interface PersonaAgrupada {
  id_persona: number
  nombre: string
  apellido: string
  roles: {
    rol: string
    estado_fichaje: string
    nombre_club: string | null
  }[]
}

export function agruparPorPersona(rows: PersonaRolRow[]): PersonaAgrupada[] {
  const map = new Map<number, PersonaAgrupada>()

  rows.forEach((r) => {
    if (!map.has(r.id_persona)) {
      map.set(r.id_persona, {
        id_persona: r.id_persona,
        nombre: r.nombre,
        apellido: r.apellido,
        roles: [],
      })
    }

    map.get(r.id_persona)!.roles.push({
      rol: r.rol,
      estado_fichaje: r.estado_fichaje,
      nombre_club: r.nombre_club,
    })
  })

  return Array.from(map.values())
}
