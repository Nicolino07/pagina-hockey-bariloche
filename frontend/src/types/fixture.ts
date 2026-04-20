export type EstadoPartido = "BORRADOR" | "PENDIENTE" | "TERMINADO" | "SUSPENDIDO" | "ANULADO" | "REPROGRAMADO"
export type TipoFixture = "simple" | "ida_y_vuelta" | "ida_y_vuelta_aleatorio"
export type TipoFormatoPlayoff = "ida" | "ida_y_vuelta"
export type TipoAsignacion = "automatico" | "manual"

export interface DueloManual {
  id_equipo_local: number
  id_equipo_visitante: number
}

export interface PlayoffRonda {
  id_fixture_playoff_ronda: number
  id_torneo: number
  nombre: string
  orden: number
  ida_y_vuelta: boolean
}

export interface PlayoffPartidoPreview {
  local?: string | null
  visitante?: string | null
  placeholder_local?: string | null
  placeholder_visitante?: string | null
  bye?: string
}

export interface PlayoffRondaPreview {
  nombre: string
  orden: number
  ida_y_vuelta: boolean
  partidos: PlayoffPartidoPreview[]
}

export interface PlayoffPreviewResponse {
  total_rondas: number
  total_partidos: number
  formato: TipoFormatoPlayoff
  rondas: PlayoffRondaPreview[]
}

export interface FixturePartidoPreview {
  numero_fecha: number
  rueda: string
  id_equipo_local: number
  id_equipo_visitante: number
  nombre_equipo_local: string
  nombre_equipo_visitante: string
}

export interface FixtureDescansoPreview {
  numero_fecha: number
  rueda: string
  id_equipo: number
  nombre_equipo: string
}

export interface FixturePreviewResponse {
  total_fechas: number
  total_partidos: number
  tipo: TipoFixture
  partidos: FixturePartidoPreview[]
  descansos: FixtureDescansoPreview[]
}

export interface FixturePartido {
  id_fixture_partido: number
  id_torneo: number
  id_equipo_local: number
  id_equipo_visitante: number
  nombre_equipo_local: string | null
  nombre_equipo_visitante: string | null
  nombre_torneo: string | null
  categoria: string | null
  division: string | null
  genero: string | null
  fecha_programada: string | null
  horario: string | null
  ubicacion: string | null
  numero_fecha: number | null
  estado: EstadoPartido
  id_partido_real: number | null
  goles_local: number | null
  goles_visitante: number | null
  nombre_equipo_descansa: string | null
  rueda: string | null
  placeholder_local: string | null
  placeholder_visitante: string | null
  id_fixture_playoff_ronda: number | null
  nombre_ronda_playoff: string | null
  creado_en: string
  creado_por: string | null
}

export interface FixturePartidoCreate {
  id_torneo: number
  id_equipo_local: number
  id_equipo_visitante: number
  fecha_programada?: string | null
  horario?: string | null
  ubicacion?: string | null
  numero_fecha?: number | null
  id_fixture_playoff_ronda?: number | null
  estado?: EstadoPartido | null
}

export interface FixturePartidoUpdate {
  fecha_programada?: string | null
  horario?: string | null
  ubicacion?: string | null
  numero_fecha?: number | null
  estado?: EstadoPartido | null
}
