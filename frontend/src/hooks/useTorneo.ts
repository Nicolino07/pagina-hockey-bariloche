import { useCallback, useEffect, useState } from "react"
import { getTorneo } from "../api/torneos.api"
import type { Torneo } from "../types/torneo"

/**
 * Hook que carga el detalle de un torneo por su ID.
 * No realiza ninguna petición si no se provee un ID.
 * @param idTorneo - ID del torneo a cargar (opcional).
 * @returns Objeto con el torneo, estado de carga, error y una función `refetch`
 *   para recargar el detalle (ej. tras editar el torneo).
 */
export function useTorneo(idTorneo?: number) {
  const [torneo, setTorneo] = useState<Torneo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    if (!idTorneo) return

    setLoading(true)

    getTorneo(idTorneo)
      .then(setTorneo)
      .catch(() => setError("Error al cargar el torneo"))
      .finally(() => setLoading(false))
  }, [idTorneo])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { torneo, loading, error, refetch }
}
