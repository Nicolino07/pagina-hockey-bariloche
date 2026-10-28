// src/hooks/useTorneosActivos.ts
import { listarTorneos } from "../api/torneos.api"
import type { Torneo } from "../types/torneo"
import { useEffect, useState, useCallback } from "react"

/**
 * Hook que carga la lista de torneos activos.
 * Expone `refetch` para recargar manualmente cuando sea necesario.
 * @returns Objeto con la lista de torneos, estado de carga, error y función de recarga.
 */
export function useTorneosActivos() {
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTorneos = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listarTorneos()
      setTorneos(data)
    } catch {
      setError("Error al cargar torneos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTorneos()
  }, [fetchTorneos])

  return {
    torneos,
    loading,
    error,
    refetch: fetchTorneos,
  }
}
