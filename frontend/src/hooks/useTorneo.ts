import { useEffect, useState } from "react"
import type { Torneo } from "../types/torneo"
import { getTorneoById } from "../api/torneos.api"

export function useTorneo(idTorneo?: number) {
  const [torneo, setTorneo] = useState<Torneo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!idTorneo) return

    setLoading(true)

    getTorneoById(idTorneo)
      .then(res => setTorneo(res.data))
      .catch(() => setError("Error al cargar el torneo"))
      .finally(() => setLoading(false))
  }, [idTorneo])

  return { torneo, loading, error }
}
