// src/hooks/usePersonasConRoles.ts
import { useEffect, useState } from "react"
import { getPersonasConRolesActivos } from "../api/personas.api"
import type { PersonaConRoles } from "../types/persona"

export function usePersonasConRoles(idClub?: number) {
  const [data, setData] = useState<PersonaConRoles[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getPersonasConRolesActivos(idClub)
      .then(setData)
      .finally(() => setLoading(false))
  }, [idClub])

  return { data, loading }
}
