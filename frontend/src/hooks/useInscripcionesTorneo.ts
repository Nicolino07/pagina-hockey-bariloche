// src/hooks/useInscripcionesTorneo
import { useEffect, useState, useCallback } from "react"
import {
  listarInscripcionesTorneo,
  darDeBajaEquipoTorneo,
} from "../api/torneos.api"

import type { InscripcionTorneoDetalle } from "../types/inscripcion"

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
