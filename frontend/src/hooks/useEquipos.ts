import { useEffect, useState } from "react"
import { getEquipos } from "../api/equipos.api"
import type { Equipo } from "../types/equipo"

/**
 * Hook que carga la lista completa de equipos al montar el componente.
 * @returns Objeto con la lista de equipos, estado de carga y mensaje de error.
 */
export function useEquipos() {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)

    getEquipos()
      .then(res => setEquipos(res.data))
      .catch(() => setError("Error al cargar equipos"))
      .finally(() => setLoading(false))
  }, [])

  return { equipos, loading, error }
}
