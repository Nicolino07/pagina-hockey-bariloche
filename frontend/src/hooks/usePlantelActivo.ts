import { useEffect, useState } from "react"
import { getPlantelActivoPorEquipo } from "../api/vistas/plantel.api"

import type { PlantelActivoIntegrante } from "../types/vistas"

export function usePlantelActivo(equipoId?: number) {
  const [integrantes, setIntegrantes] =
    useState<PlantelActivoIntegrante[]>([])

  const [plantelId, setPlantelId] =
    useState<number | null>(null)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const fetchData = async () => {
    if (!equipoId) return

    setLoading(true)
    setError(null)

    try {
      const data =
        await getPlantelActivoPorEquipo(equipoId)

      setIntegrantes(data)

      // 👇 si la vista devuelve plantel_id
      if (data.length > 0) {
        setPlantelId(data[0].id_plantel)
      }
    } catch (e) {
      setError("Error cargando plantel")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [equipoId])

  return {
    integrantes,
    plantelId,
    loading,
    error,
    hasData: integrantes.length > 0,
    refetch: fetchData,
  }
}
