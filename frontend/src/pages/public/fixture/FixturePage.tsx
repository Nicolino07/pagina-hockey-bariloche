import { useState, useEffect } from "react"
import { listarTorneos } from "../../../api/torneos.api"
import { listarProximosPartidos } from "../../../api/fixture.api"
import type { Torneo } from "../../../types/torneo"
import type { FixturePartido } from "../../../types/fixture"
import styles from "./FixturePage.module.css"

/**
 * Convierte un horario "HH:MM" a formato legible con sufijo "hs".
 * @param horario - Hora en formato HH:MM o null.
 * @returns Horario formateado si existe, sino retorna "—".
 */
function formatHorario(horario: string | null): string {
  if (!horario) return "—"
  const hm = horario.slice(0, 5).trim()
  return hm.length === 5 ? `${hm} hs` : "—"
}

/** Estructura de partidos agrupados por día dentro de un torneo. */
interface GrupoDia {
  fecha: string        // YYYY-MM-DD (clave de orden)
  label: string        // "Domingo 8 de Marzo"
  partidos: FixturePartido[]
}

/** Estructura de un grupo de partidos agrupados por torneo. */
interface GrupoTorneo {
  key: string
  label: string
  dias: GrupoDia[]
}

/**
 * Construye la etiqueta del encabezado de grupo usando los datos del torneo.
 * @param torneo - Objeto Torneo con metadatos, o null si no se encontró.
 * @param partido - Partido de referencia usado como fallback para el nombre.
 * @returns Etiqueta con nombre, género, categoría y año del torneo.
 */
function buildLabel(torneo: Torneo | null, partido: FixturePartido): string {
  if (torneo) {
    const año = torneo.fecha_inicio ? torneo.fecha_inicio.slice(0, 4) : ""
    return `${torneo.nombre} · ${torneo.genero} · ${torneo.categoria}${año ? ` · ${año}` : ""}`
  }
  return partido.nombre_torneo ?? `Torneo #${partido.id_torneo}`
}

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

/** Convierte "YYYY-MM-DD" a "Domingo 8 de Marzo". */
function labelDia(fechaStr: string): string {
  const [year, month, day] = fechaStr.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return `${DIAS[date.getDay()]} ${day} de ${MESES[month - 1]}`
}

/** Agrupa los partidos de un torneo por fecha. */
function agruparPorDia(partidos: FixturePartido[]): GrupoDia[] {
  const mapa = new Map<string, FixturePartido[]>()
  const orden: string[] = []

  for (const p of partidos) {
    const clave = p.fecha_programada ?? "sin-fecha"
    if (!mapa.has(clave)) {
      mapa.set(clave, [])
      orden.push(clave)
    }
    mapa.get(clave)!.push(p)
  }

  return orden.map(fecha => ({
    fecha,
    label: fecha === "sin-fecha" ? "Sin fecha asignada" : labelDia(fecha),
    partidos: mapa.get(fecha)!,
  }))
}

/**
 * Agrupa una lista plana de partidos por id_torneo y luego por día.
 */
function agruparPorTorneo(partidos: FixturePartido[], torneos: Torneo[]): GrupoTorneo[] {
  const mapa = new Map<number, FixturePartido[]>()
  const orden: number[] = []

  for (const p of partidos) {
    if (!mapa.has(p.id_torneo)) {
      mapa.set(p.id_torneo, [])
      orden.push(p.id_torneo)
    }
    mapa.get(p.id_torneo)!.push(p)
  }

  return orden.map(id => ({
    key: String(id),
    label: buildLabel(torneos.find(t => t.id_torneo === id) ?? null, mapa.get(id)![0]),
    dias: agruparPorDia(mapa.get(id)!),
  }))
}

/**
 * Página pública que muestra el fixture de próximos partidos.
 * Permite filtrar por torneo y agrupa los partidos bajo el encabezado de cada torneo.
 */
export default function FixturePage() {
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [torneoId, setTorneoId] = useState<number | null>(null)
  const [partidos, setPartidos] = useState<FixturePartido[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTorneos, setLoadingTorneos] = useState(true)

  // Carga inicial de torneos para poblar los filtros.
  useEffect(() => {
    listarTorneos()
      .then(setTorneos)
      .catch(console.error)
      .finally(() => setLoadingTorneos(false))
  }, [])

  // Recarga los partidos cada vez que cambia el torneo seleccionado.
  useEffect(() => {
    setLoading(true)
    listarProximosPartidos(torneoId ?? undefined)
      .then(setPartidos)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [torneoId])

  if (loadingTorneos) return <div className={styles.loader}>Cargando...</div>

  const grupos = agruparPorTorneo(partidos, torneos)

  return (
    <div className={styles.container}>

      {/* Encabezado de la página */}
      <header className={styles.header}>
        <h1 className={styles.title}>Próximos Partidos</h1>
        <p className={styles.subtitle}>Fixture de la temporada</p>
      </header>

      {/* Filtros por torneo */}
      <div className={styles.filtroRow}>
        <button
          className={`${styles.filtroBtn} ${torneoId === null ? styles.filtroBtnActive : ""}`}
          onClick={() => setTorneoId(null)}
        >
          Todos
        </button>
        {torneos.map(t => (
          <button
            key={t.id_torneo}
            className={`${styles.filtroBtn} ${torneoId === t.id_torneo ? styles.filtroBtnActive : ""}`}
            onClick={() => setTorneoId(t.id_torneo)}
          >
            {t.nombre} · {t.genero} · {t.categoria}
          </button>
        ))}
      </div>

      {/* Lista de partidos agrupados por torneo */}
      {loading ? (
        <p className={styles.infoMsg}>Cargando partidos...</p>
      ) : partidos.length === 0 ? (
        <p className={styles.infoMsg}>No hay partidos programados próximamente.</p>
      ) : (
        <div>
          {grupos.map(grupo => (
            <section key={grupo.key} className={styles.grupo}>

              {/* Encabezado del grupo: nombre, género, categoría y año del torneo */}
              <h2 className={styles.grupoTitle}>{grupo.label}</h2>

              {/* Partidos agrupados por día */}
              {grupo.dias.map(dia => (
                <div key={dia.fecha} className={styles.diaBloque}>
                  <h3 className={styles.diaTitle}>{dia.label}</h3>
                  <div className={styles.tabla}>
                    {dia.partidos.map(p => (
                      <div key={p.id_fixture_partido} className={styles.row}>

                        {/* Enfrentamiento: local vs visitante */}
                        <div className={styles.equipos}>
                          <span className={styles.equipo}>{p.nombre_equipo_local ?? "Local"}</span>
                          <span className={styles.vs}>vs</span>
                          <span className={styles.equipo}>{p.nombre_equipo_visitante ?? "Visitante"}</span>
                        </div>

                        {/* Metadatos: horario y ubicación (fecha ya está en el encabezado del día) */}
                        <div className={styles.info}>
                          <span className={styles.infoItem}>🕐 {formatHorario(p.horario)}</span>
                          {p.ubicacion && (
                            <span className={styles.infoItem}>📍 {p.ubicacion}</span>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              ))}

            </section>
          ))}
        </div>
      )}

    </div>
  )
}
