// Archivo: frontend/src/api/temporadas.api.ts
//
// La tabla anual todavía no es pública: el backend exige ADMIN/SUPERUSUARIO
// incluso para leerla, así que va por el cliente autenticado. Cuando se
// publique, estas tres lecturas vuelven a AxiosPublic.
import AxiosAdmin from "./axiosAdmin"
import type {
  Temporada,
  FilaTablaAnual,
  SelectorTablaAnual,
  CrearPlayoffAnualRequest,
  PlayoffAnualResponse,
} from "../types/temporada"

/** Lista las temporadas con los torneos que las componen. */
export async function listarTemporadas(params?: {
  anio?: number
  soloActivas?: boolean
}): Promise<Temporada[]> {
  const res = await AxiosAdmin.get<Temporada[]>("/temporadas/", {
    params: {
      anio: params?.anio,
      solo_activas: params?.soloActivas,
    },
  })
  return res.data
}

export async function obtenerTemporada(idTemporada: number): Promise<Temporada> {
  const res = await AxiosAdmin.get<Temporada>(`/temporadas/${idTemporada}`)
  return res.data
}

/**
 * Tabla de posiciones anual: suma de los torneos marcados como REGULAR.
 * Devuelve [] si la temporada todavía no tiene ningún torneo que compute.
 */
export async function obtenerTablaAnual(idTemporada: number): Promise<FilaTablaAnual[]> {
  const res = await AxiosAdmin.get<FilaTablaAnual[]>(`/temporadas/${idTemporada}/posiciones`)
  return res.data
}

/** Torneos de una liga en un año, con el tilde puesto en los que suman. */
export async function obtenerSelectorTablaAnual(params: {
  anio: number
  categoria: string
  genero: string
  division?: string | null
}): Promise<SelectorTablaAnual> {
  const res = await AxiosAdmin.get<SelectorTablaAnual>("/temporadas/selector/torneos", {
    params: {
      anio: params.anio,
      categoria: params.categoria,
      genero: params.genero,
      division: params.division ?? undefined,
    },
  })
  return res.data
}

/**
 * Aplica la selección completa y devuelve la tabla anual recalculada.
 * Se manda el estado final de los tildes, no altas y bajas sueltas.
 */
export async function definirTorneosComputables(body: {
  anio: number
  categoria: string
  genero: string
  division?: string | null
  id_torneos: number[]
}): Promise<FilaTablaAnual[]> {
  const res = await AxiosAdmin.put<FilaTablaAnual[]>("/temporadas/selector/torneos", {
    ...body,
    division: body.division ?? null,
  })
  return res.data
}

/**
 * Crea el playoff por el campeón del año y arma su bracket.
 *
 * La respuesta trae lo que no se pudo resolver solo (integrantes omitidos,
 * equipos sin nómina del año): hay que mostrarlo, no descartarlo.
 */
export async function crearPlayoffAnual(
  idTemporada: number,
  body: CrearPlayoffAnualRequest,
): Promise<PlayoffAnualResponse> {
  const res = await AxiosAdmin.post<PlayoffAnualResponse>(
    `/temporadas/${idTemporada}/playoff`,
    body,
  )
  return res.data
}
