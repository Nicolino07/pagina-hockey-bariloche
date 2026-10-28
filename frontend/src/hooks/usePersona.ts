// src/hooks/usePersonas.ts
import { useEffect, useState } from "react"
import { getPersonas } from "../api/personas.api"
import type { Persona } from "../types/persona"

/**
 * Hook que carga la lista completa de personas al montar el componente.
 * @returns Objeto con la lista de personas y estado de carga.
 */
export function usePersonas() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPersonas()
      .then(setPersonas)
      .finally(() => setLoading(false))
  }, [])

  return { personas, loading }
}
