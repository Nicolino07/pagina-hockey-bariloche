import { useEffect, useState } from "react"
import {
  getInscripcionesTorneo,
  darBajaInscripcion,
} from "../api/torneos.api"

export function useInscripcionesTorneo(idTorneo?: number) {
  const [inscripciones, setInscripciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!idTorneo) return
    try {
      setLoading(true)
      const data = await getInscripcionesTorneo(idTorneo)
      setInscripciones(data)
    } catch {
      setError("Error al cargar inscripciones")
    } finally {
      setLoading(false)
    }
  }

  const baja = async (idEquipo: number) => {
    if (!idTorneo) return
    await darBajaInscripcion(idTorneo, idEquipo)
    fetchData()
  }

  useEffect(() => {
    fetchData()
  }, [idTorneo])

  return {
    inscripciones,
    loading,
    error,
    baja,
    refetch: fetchData,
  }
}
