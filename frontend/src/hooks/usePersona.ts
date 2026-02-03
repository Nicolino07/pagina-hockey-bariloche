// src/hooks/usePersonas.ts
import { useEffect, useState } from "react"
import { getPersonas } from "../api/personas.api"
import type { Persona } from "../types/persona"

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
