export interface FixturePartido {
  id_fixture_partido: number
  id_torneo: number
  id_equipo_local: number
  id_equipo_visitante: number
  nombre_equipo_local: string | null
  nombre_equipo_visitante: string | null
  nombre_torneo: string | null
  fecha_programada: string | null
  horario: string | null
  ubicacion: string | null
  numero_fecha: number | null
  jugado: boolean
  id_partido_real: number | null
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
}
