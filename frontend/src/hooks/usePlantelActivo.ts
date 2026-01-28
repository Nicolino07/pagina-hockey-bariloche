import { useEffect, useState } from "react"
import { getPlantelActivoPorEquipo } from "../api/vistas/plantel.api"
import type { PlantelActivoIntegrante } from "../types/vistas"

export function usePlantelActivo(id_equipo?: number) {
  const [integrantes, setIntegrantes] =
    useState<PlantelActivoIntegrante[]>([])

  const [id_plantel, setIdPlantel] =
    useState<number | null>(null)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const fetchData = async () => {
    if (!id_equipo) return

    setLoading(true)
    setError(null)

    try {
      const data =
        await getPlantelActivoPorEquipo(id_equipo)

      setIntegrantes(data)

      if (data.length > 0) {
        setIdPlantel(data[0].id_plantel)
      }
    } catch (e) {
      setError("Error cargando plantel")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id_equipo])

  return {
    integrantes,
    id_plantel, // 👈 volvemos al nombre correcto
    loading,
    error,
    hasData: integrantes.length > 0,
    refetch: fetchData,
  }
}
