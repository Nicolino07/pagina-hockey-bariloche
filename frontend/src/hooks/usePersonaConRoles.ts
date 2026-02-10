// frontend/src/hooks/usePersonaConRoles.ts
import { useEffect, useMemo, useState, useCallback } from "react"
import { getPersonasConRoles } from "../api/personas.api"
import type { PersonaRolClub } from "../types/persona"



type ClubRol = {
  id_club: number | null
  nombre_club: string
}

type RolPersona = {
  id_persona_rol: number 
  rol: string
  estado_fichaje: string
  clubes: ClubRol[]
}

export type PersonaAgrupada = {
  id_persona: number
  nombre: string
  apellido: string
  documento?: number
  roles: RolPersona[]
}

interface UsePersonaOptions {
  idPersona?: number;
}

export function usePersonaConRoles(options?: UsePersonaOptions) { // <-- Añadimos opciones
  const [personasRaw, setPersonasRaw] = useState<PersonaRolClub[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Extraemos fetch en un useCallback para poder exponerlo como "refresh"
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getPersonasConRoles()
      setPersonasRaw(data)
      setError(null)
    } catch (err) {
      console.error(err)
      setError("Error al cargar personas")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const personas = useMemo<PersonaAgrupada[]>(() => {
    // 1. Aplicamos el filtro de ID si existe antes de agrupar
    const rawFiltered = options?.idPersona 
      ? personasRaw.filter(p => p.id_persona === options.idPersona)
      : personasRaw;

    const map: Record<number, PersonaAgrupada> = {}

    for (const item of rawFiltered) {
      if (!map[item.id_persona]) {
        map[item.id_persona] = {
          id_persona: item.id_persona,
          nombre: item.nombre,
          apellido: item.apellido,
          // CORRECCIÓN: Usamos 'documento' o 'persona_documento' según lo que envíe el backend
          // Si en el JSON de la red ves "persona_documento", usa ese.
          documento: (item as any).persona_documento || (item as any).documento, 
          roles: [],
        };

      }

      const persona = map[item.id_persona]

      let rol = persona.roles.find(
        r => r.rol === item.rol && r.estado_fichaje === item.estado_fichaje
      )

      if (!rol) {
        rol = {
          // Usamos una clave compuesta ya que no existe id_persona_rol en PersonaRolClub
          id_persona_rol: Number(`${item.id_persona}${item.rol.length > 0 ? item.rol.charCodeAt(0) : 0}${item.estado_fichaje.length > 0 ? item.estado_fichaje.charCodeAt(0) : 0}`),
          rol: item.rol,
          estado_fichaje: item.estado_fichaje,
          clubes: [],
        }
        persona.roles.push(rol)
      }

      const existeClub = rol.clubes.some(c => c.id_club === item.id_club)
      if (!existeClub) {
        rol.clubes.push({
          id_club: item.id_club,
          nombre_club: item.nombre_club ?? "-",
        })
      }
    }

    return Object.values(map)
  }, [personasRaw, options?.idPersona]) // <-- Dependencia del filtro

  return {
    personas,
    loading,
    error,
    refresh: fetchData // <-- Exponemos la función de carga
  }
}