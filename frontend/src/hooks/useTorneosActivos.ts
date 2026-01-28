import { useEffect, useState } from "react"
import { getTorneos } from "../api/torneos.api"
import type { Torneo } from "../types/torneo"


export function useTorneosActivos() {
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getTorneos()
      .then(data => {
        setTorneos(data.filter(t => t.activo))
      })
      .catch(() => setError("Error al cargar torneos"))
      .finally(() => setLoading(false))
  }, [])

  return { torneos, loading, error }
}
