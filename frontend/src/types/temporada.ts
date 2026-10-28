import type { TipoGenero, TipoCategoria, TipoTorneo } from "../constants/enums"

/** Papel de un torneo dentro de su temporada anual. */
export type RolEnTemporada = "REGULAR" | "NO_COMPUTA" | "FINAL_ANUAL"

export interface TorneoEnTemporada {
  id_torneo: number
  nombre: string
  tipo: TipoTorneo
  rol_en_temporada: RolEnTemporada | null
  fecha_inicio: string | null
  fecha_fin: string | null
  activo: boolean
}

/** Agrupación anual de torneos de una misma liga (apertura + clausura). */
export interface Temporada {
  id_temporada: number
  nombre: string
  anio: number
  categoria: TipoCategoria
  division?: string | null
  genero: TipoGenero
  activa: boolean
  torneos: TorneoEnTemporada[]
  creado_en: string
  actualizado_en: string | null
  borrado_en: string | null
  creado_por: string | null
  actualizado_por: string | null
}

/** Fila de la tabla anual: la campaña de un equipo a lo largo del año. */
export interface FilaTablaAnual {
  id_temporada: number
  temporada: string
  anio: number
  categoria: TipoCategoria
  division?: string | null
  genero: TipoGenero

  id_equipo: number
  equipo: string
  id_club: number

  puesto: number
  /** De cuántos torneos REGULAR viene la campaña (para ver quién jugó medio año). */
  torneos_computados: number
  partidos_jugados: number
  ganados: number
  empatados: number
  perdidos: number
  goles_a_favor: number
  goles_en_contra: number
  diferencia_gol: number
  puntos: number
}

/** Torneo candidato del selector de la tabla anual, con su estado actual. */
export interface TorneoComputable {
  id_torneo: number
  nombre: string
  tipo: TipoTorneo
  fecha_inicio: string | null
  activo: boolean
  /** Si hoy suma a la tabla anual. */
  computa: boolean
}

/** Datos del selector: la liga, su temporada si ya existe, y los candidatos. */
export interface SelectorTablaAnual {
  anio: number
  categoria: TipoCategoria
  division?: string | null
  genero: TipoGenero
  id_temporada: number | null
  nombre_temporada: string | null
  torneos: TorneoComputable[]
}

/** Ronda con la que arranca el playoff anual; define cuántos clasifican. */
export type RondaInicialAnual = "octavos" | "cuartos" | "semifinal" | "final"

export const EQUIPOS_POR_RONDA_ANUAL: Record<RondaInicialAnual, number> = {
  octavos: 16,
  cuartos: 8,
  semifinal: 4,
  final: 2,
}

/** Duelo de la primera ronda cuando el bracket se arma a mano. */
export interface DueloAnual {
  id_equipo_local: number
  id_equipo_visitante: number
}

export interface CrearPlayoffAnualRequest {
  nombre: string
  fecha_inicio?: string | null
  ronda_inicial: RondaInicialAnual
  formato: "ida" | "ida_y_vuelta"
  asignacion: "automatico" | "manual"
  duelos?: DueloAnual[] | null
  tercer_puesto: boolean
  es_competitiva?: boolean
  /** Heredar al playoff la última nómina del año de cada clasificado. */
  copiar_planteles: boolean
}

/** Integrante que no se pudo heredar al playoff, con el motivo. */
export interface PlantelOmitido {
  equipo: string
  id_persona: number
  nombre: string
  motivo: string
}

export interface PlayoffAnualResponse {
  id_torneo: number
  nombre: string
  id_temporada: number
  /** Clasificados, en orden de mérito. */
  equipos: string[]
  planteles_copiados: number
  planteles_omitidos: PlantelOmitido[]
  /** Equipos que no tenían nómina propia en ningún torneo del año. */
  avisos: string[]
}
