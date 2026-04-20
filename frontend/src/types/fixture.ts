export type EstadoPartido = "BORRADOR" | "PENDIENTE" | "TERMINADO" | "SUSPENDIDO" | "ANULADO" | "REPROGRAMADO"
export type TipoFixture = "simple" | "ida_y_vuelta"

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
}

export interface FixturePartidoUpdate {
  fecha_programada?: string | null
  horario?: string | null
  ubicacion?: string | null
  numero_fecha?: number | null
  estado?: EstadoPartido | null
}
