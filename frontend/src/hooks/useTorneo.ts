import { useEffect, useState } from "react"
import { getTorneo } from "../api/torneos.api"
import type { Torneo } from "../types/torneo"

export function useTorneo(idTorneo?: number) {
  const [torneo, setTorneo] = useState<Torneo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!idTorneo) return

    setLoading(true)

    getTorneo(idTorneo)
      .then(setTorneo)
      .catch(() => setError("Error al cargar el torneo"))
      .finally(() => setLoading(false))
  }, [idTorneo])

  return { torneo, loading, error }
}
