// src/hooks/useInscripcionesTorneo
import { useEffect, useState, useCallback } from "react"
import {
  listarInscripcionesTorneo,
  darDeBajaEquipoTorneo,
} from "../api/torneos.api"

import type { InscripcionTorneoDetalle } from "../types/inscripcion"

/**
 * Hook que gestiona las inscripciones de equipos a un torneo.
 * No realiza peticiones si no se provee un ID de torneo.
 * @param id_torneo - ID del torneo cuyas inscripciones se cargan (opcional).
 * @returns Objeto con inscripciones, estado de carga, error, función de baja y recarga.
 */
export function useInscripcionesTorneo(id_torneo?: number) {
  const [inscripciones, setInscripciones] =
    useState<InscripcionTorneoDetalle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!id_torneo) return

    try {
      setLoading(true)
      setError(null)

      const data = await listarInscripcionesTorneo(id_torneo)
      setInscripciones(data)
    } catch (e: any) {
      setError(
        e.response?.data?.message ?? "Error al cargar inscripciones"
      )
    } finally {
      setLoading(false)
    }
  }, [id_torneo])

  /**
   * Da de baja a un equipo del torneo y recarga la lista de inscripciones.
   * @param idEquipo - ID del equipo a dar de baja.
   */
  const baja = async (idEquipo: number) => {
    if (!id_torneo) return

    await darDeBajaEquipoTorneo(id_torneo, idEquipo)
    await fetchData()
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    inscripciones,
    loading,
    error,
    baja,
    refetch: fetchData,
  }
}
