import { useState, useEffect } from "react"
import { listarTorneos } from "../../../api/torneos.api"
import { listarProximosPartidos } from "../../../api/fixture.api"
import type { Torneo } from "../../../types/torneo"
import type { FixturePartido } from "../../../types/fixture"
import styles from "./FixturePage.module.css"

function formatHorario(horario: string | null): string {
  if (!horario) return "—"
  const hm = horario.slice(0, 5).trim()
  return hm.length === 5 ? hm : "—"
}

interface GrupoDia {
  fecha: string
  label: string
  partidos: FixturePartido[]
}

interface GrupoTorneo {
  key: string
  label: string
  categoria: string
  genero: string
  division: string | null
  dias: GrupoDia[]
}

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

function labelDia(fechaStr: string): string {
  const [year, month, day] = fechaStr.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return `${DIAS[date.getDay()]} ${day} de ${MESES[month - 1]}`
}

function agruparPorDia(partidos: FixturePartido[]): GrupoDia[] {
  const mapa = new Map<string, FixturePartido[]>()
  const orden: string[] = []
  for (const p of partidos) {
    const clave = p.fecha_programada ?? "sin-fecha"
    if (!mapa.has(clave)) { mapa.set(clave, []); orden.push(clave) }
    mapa.get(clave)!.push(p)
  }
  return orden.map(fecha => ({
    fecha,
    label: fecha === "sin-fecha" ? "Sin fecha asignada" : labelDia(fecha),
    partidos: mapa.get(fecha)!,
  }))
}

function agruparPorTorneo(partidos: FixturePartido[], torneos: Torneo[]): GrupoTorneo[] {
  const mapa = new Map<number, FixturePartido[]>()
  const orden: number[] = []
  for (const p of partidos) {
    if (!mapa.has(p.id_torneo)) { mapa.set(p.id_torneo, []); orden.push(p.id_torneo) }
    mapa.get(p.id_torneo)!.push(p)
  }
  return orden.map(id => {
    const torneo = torneos.find(t => t.id_torneo === id)
    const muestra = mapa.get(id)![0]
    return {
      key: String(id),
      label: torneo?.nombre ?? muestra.nombre_torneo ?? `Torneo #${id}`,
      categoria: torneo?.categoria ?? muestra.categoria ?? "",
      genero: torneo?.genero ?? muestra.genero ?? "",
      division: torneo?.division ?? muestra.division ?? null,
      dias: agruparPorDia(mapa.get(id)!),
    }
  })
}

const CATEGORIA_LABEL: Record<string, string> = {
  MAYORES: "Mayores", SUB_19: "Sub 19", SUB_16: "Sub 16", SUB_14: "Sub 14", SUB_12: "Sub 12",
}
const GENERO_LABEL: Record<string, string> = {
  MASCULINO: "Masculino", FEMENINO: "Femenino", MIXTO: "Mixto",
}
const GENERO_ICON: Record<string, string> = {
  MASCULINO: "♂", FEMENINO: "♀", MIXTO: "⚥",
}

export default function FixturePage() {
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [torneoId, setTorneoId] = useState<number | null>(null)
  const [partidos, setPartidos] = useState<FixturePartido[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTorneos, setLoadingTorneos] = useState(true)
  const [colapsados, setColapsados] = useState<Set<string>>(new Set())
  const [selectorAbierto, setSelectorAbierto] = useState(false)
  const [torneosHistoricos, setTorneosHistoricos] = useState<Torneo[]>([])
  const [verHistoricos, setVerHistoricos] = useState(false)
  const [loadingHistoricos, setLoadingHistoricos] = useState(false)

  useEffect(() => {
    listarTorneos()
      .then(setTorneos)
      .catch(console.error)
      .finally(() => setLoadingTorneos(false))
  }, [])

  function cargarHistoricos() {
    if (verHistoricos) return
    setLoadingHistoricos(true)
    listarTorneos(false)
      .then(todos => {
        const activosIds = new Set(torneos.map(t => t.id_torneo))
        const historicos = todos.filter(t => !activosIds.has(t.id_torneo))
        setTorneosHistoricos(historicos)
        setVerHistoricos(true)
      })
      .catch(console.error)
      .finally(() => setLoadingHistoricos(false))
  }

  useEffect(() => {
    setLoading(true)
    listarProximosPartidos(torneoId ?? undefined)
      .then(setPartidos)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [torneoId])

  function toggleColapso(key: string) {
    setColapsados(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (loadingTorneos) return <div className={styles.loader}>Cargando...</div>

  const grupos = agruparPorTorneo(partidos, torneos)

  return (
    <div className={styles.container}>

      <header className={styles.header}>
        <h1 className={styles.title}>Fixture</h1>
        <p className={styles.subtitle}>Próximos partidos de la temporada</p>
      </header>

      <div className={styles.layout}>

        {/* ── Columna lateral: torneos ── */}
        <aside className={styles.colTorneos}>
          {/* Mobile: selector colapsable */}
          <button
            className={styles.selectorMobileToggle}
            onClick={() => setSelectorAbierto(v => !v)}
          >
            <span>
              🏆{" "}
              {torneoId === null
                ? "Todos los torneos"
                : torneos.find(t => t.id_torneo === torneoId)?.nombre ?? "Torneo"}
            </span>
            <span className={styles.grupoChevron}>{selectorAbierto ? "∧" : "∨"}</span>
          </button>

          {/* Tarjeta (siempre visible en desktop, toggle en mobile) */}
          <div className={`${styles.torneosCard} ${selectorAbierto ? styles.torneosCardAbierta : ""}`}>
            <div className={styles.torneosCardHeader}>
              <span>🏆</span>
              <span>Torneos activos</span>
            </div>

            <div className={styles.torneosFiltroTodos}>
              <button
                className={`${styles.torneoFila} ${torneoId === null ? styles.torneoFilaActiva : ""}`}
                onClick={() => { setTorneoId(null); setSelectorAbierto(false) }}
              >
                <span className={styles.torneoFilaNombre}>Todos los torneos</span>
              </button>
            </div>

            {torneos.map(t => (
              <button
                key={t.id_torneo}
                className={`${styles.torneoFila} ${torneoId === t.id_torneo ? styles.torneoFilaActiva : ""}`}
                onClick={() => { setTorneoId(t.id_torneo); setSelectorAbierto(false) }}
              >
                <div className={styles.torneoFilaInfo}>
                  <span className={styles.torneoFilaNombre}>{t.nombre}</span>
                  <div className={styles.torneoFilaBadges}>
                    <span className={styles.torneoFilaBadge}>
                      {CATEGORIA_LABEL[t.categoria] ?? t.categoria}
                    </span>
                    <span className={styles.torneoFilaBadge}>
                      {GENERO_ICON[t.genero]} {GENERO_LABEL[t.genero] ?? t.genero}
                    </span>
                    {t.division && (
                      <span className={styles.torneoFilaBadge}>{t.division}</span>
                    )}
                  </div>
                </div>
                {torneoId === t.id_torneo && (
                  <span className={styles.torneoFilaCheck}>✓</span>
                )}
              </button>
            ))}

            {torneos.length === 0 && (
              <p className={styles.torneosVacio}>Sin torneos activos</p>
            )}

            {verHistoricos && torneosHistoricos.length > 0 && (
              <>
                <div className={styles.historicosHeader}>Históricos</div>
                {torneosHistoricos.map(t => (
                  <button
                    key={t.id_torneo}
                    className={`${styles.torneoFila} ${torneoId === t.id_torneo ? styles.torneoFilaActiva : ""}`}
                    onClick={() => { setTorneoId(t.id_torneo); setSelectorAbierto(false) }}
                  >
                    <div className={styles.torneoFilaInfo}>
                      <span className={styles.torneoFilaNombre}>{t.nombre}</span>
                      <div className={styles.torneoFilaBadges}>
                        <span className={styles.torneoFilaBadge}>{CATEGORIA_LABEL[t.categoria] ?? t.categoria}</span>
                        <span className={styles.torneoFilaBadge}>{GENERO_ICON[t.genero]} {GENERO_LABEL[t.genero] ?? t.genero}</span>
                        {t.division && <span className={styles.torneoFilaBadge}>{t.division}</span>}
                      </div>
                    </div>
                    {torneoId === t.id_torneo && <span className={styles.torneoFilaCheck}>✓</span>}
                  </button>
                ))}
              </>
            )}

            {!verHistoricos && (
              <button
                className={styles.historicosBtn}
                onClick={cargarHistoricos}
                disabled={loadingHistoricos}
              >
                {loadingHistoricos ? "Cargando..." : "Ver torneos históricos"}
              </button>
            )}
          </div>
        </aside>

        {/* ── Columna principal: partidos ── */}
        <div className={styles.colPartidos}>
          {loading ? (
            <p className={styles.infoMsg}>Cargando partidos...</p>
          ) : partidos.length === 0 ? (
            <p className={styles.infoMsg}>No hay partidos programados próximamente.</p>
          ) : (
            <div className={styles.grupos}>
              {grupos.map(grupo => {
                const colapsado = colapsados.has(grupo.key)
                return (
                  <section key={grupo.key} className={styles.grupo}>

                    <button
                      className={styles.grupoHeader}
                      onClick={() => toggleColapso(grupo.key)}
                      aria-expanded={!colapsado}
                    >
                      <div className={styles.grupoHeaderIzq}>
                        <span className={styles.grupoIcono}>🏑</span>
                        <span className={styles.grupoNombre}>{grupo.label.toUpperCase()}</span>
                        <span className={styles.grupoBadge}>
                          {CATEGORIA_LABEL[grupo.categoria] ?? grupo.categoria}
                        </span>
                        <span className={styles.grupoBadge}>
                          {GENERO_ICON[grupo.genero]} {GENERO_LABEL[grupo.genero] ?? grupo.genero}
                        </span>
                        {grupo.division && (
                          <span className={styles.grupoBadge}>{grupo.division}</span>
                        )}
                      </div>
                      <span className={styles.grupoChevron}>{colapsado ? "∨" : "∧"}</span>
                    </button>

                    {!colapsado && (
                      <div className={styles.grupoCuerpo}>
                        {grupo.dias.map(dia => (
                          <div key={dia.fecha} className={styles.diaBloque}>
                            <div className={styles.diaLabel}>{dia.label}</div>
                            {dia.partidos.map(p => (
                              <div key={p.id_fixture_partido} className={styles.row}>
                                <div className={styles.horarioCol}>
                                  <span className={styles.horario}>{formatHorario(p.horario)}</span>
                                  {p.ubicacion && (
                                    <span className={styles.ubicacion}>📍 {p.ubicacion}</span>
                                  )}
                                </div>
                                <div className={styles.equipos}>
                                  <span className={styles.equipo}>{p.nombre_equipo_local ?? "Local"}</span>
                                  <span className={styles.separador}>-</span>
                                  <span className={styles.equipo}>{p.nombre_equipo_visitante ?? "Visitante"}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                  </section>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
