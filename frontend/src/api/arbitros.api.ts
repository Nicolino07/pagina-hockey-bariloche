import api from "./axiosAdmin"

/**
 * API de designación de árbitros.
 * Todas las rutas requieren rol ADMIN_ARBITROS (o SUPERUSUARIO).
 */

export interface PartidoDesignable {
  id_partido: number
  id_torneo: number
  nombre_torneo: string | null
  es_competitiva: boolean
  fecha: string | null
  horario: string | null
  estado_partido: string
  equipo_local: string | null
  equipo_visitante: string | null
  id_arbitro1: number | null
  id_arbitro2: number | null
  nombre_arbitro1: string | null
  nombre_arbitro2: string | null
}

export interface ArbitroDisponible {
  id_persona: number
  nombre: string
  apellido: string
  disponible: boolean
  motivo: string | null
}

/** Extrae el mensaje de error del backend ({error:{message}} o {detail}). */
function mensajeError(error: any, fallback: string): string {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.detail ||
    fallback
  )
}

/** Lista los partidos en estado BORRADOR/PENDIENTE candidatos a designación. */
export const getPartidosDesignables = async (
  torneoId?: number
): Promise<PartidoDesignable[]> => {
  try {
    const response = await api.get(`/arbitros/partidos-designables`, {
      params: torneoId ? { torneo_id: torneoId } : {},
      withCredentials: true,
    })
    return response.data
  } catch (error: any) {
    throw new Error(mensajeError(error, "Error al cargar los partidos"))
  }
}

/** Lista los árbitros con su disponibilidad para un partido concreto. */
export const getArbitrosDisponibles = async (
  idPartido: number
): Promise<ArbitroDisponible[]> => {
  try {
    const response = await api.get(
      `/arbitros/partidos/${idPartido}/disponibles`,
      { withCredentials: true }
    )
    return response.data
  } catch (error: any) {
    throw new Error(mensajeError(error, "Error al cargar los árbitros"))
  }
}

/** Designa (o quita, enviando null) los árbitros de un partido. */
export const designarArbitros = async (
  idPartido: number,
  idArbitro1: number | null,
  idArbitro2: number | null
) => {
  try {
    const response = await api.put(
      `/arbitros/partidos/${idPartido}`,
      { id_arbitro1: idArbitro1, id_arbitro2: idArbitro2 },
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    )
    return response.data
  } catch (error: any) {
    throw new Error(mensajeError(error, "No se pudieron designar los árbitros"))
  }
}
