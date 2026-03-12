import { useState, useEffect } from "react"
import { listarTorneos } from "../../../api/torneos.api"
import { listarProximosPartidos } from "../../../api/fixture.api"
import type { Torneo } from "../../../types/torneo"
import type { FixturePartido } from "../../../types/fixture"
import styles from "./FixturePage.module.css"

function formatFecha(fechaStr: string | null): string {
  if (!fechaStr) return "—"
  const [year, month, day] = fechaStr.split("-")
  return `${day}/${month}/${year}`
}

function formatHorario(horario: string | null): string {
  if (!horario) return "—"
  return horario.slice(0, 5) + " hs"
}

function agruparPorTorneo(
  partidos: FixturePartido[],
  torneos: Torneo[]
): { torneo: Torneo | null; key: string; label: string; partidos: FixturePartido[] }[] {
  const mapaGrupos = new Map<number, FixturePartido[]>()
  const ordenIds: number[] = []

  for (const p of partidos) {
    if (!mapaGrupos.has(p.id_torneo)) {
      mapaGrupos.set(p.id_torneo, [])
      ordenIds.push(p.id_torneo)
    }
    mapaGrupos.get(p.id_torneo)!.push(p)
  }

  return ordenIds.map(id => {
    const torneoInfo = torneos.find(t => t.id_torneo === id) ?? null
    const año = torneoInfo?.fecha_inicio ? torneoInfo.fecha_inicio.slice(0, 4) : ""
    const label = torneoInfo
      ? `${torneoInfo.nombre} · ${torneoInfo.genero} · ${torneoInfo.categoria}${año ? ` · ${año}` : ""}`
      : (mapaGrupos.get(id)![0].nombre_torneo ?? `Torneo #${id}`)
    return {
      torneo: torneoInfo,
      key: String(id),
      label,
      partidos: mapaGrupos.get(id)!,
    }
  })
}

export default function FixturePage() {
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [torneoId, setTorneoId] = useState<number | null>(null)
  const [partidos, setPartidos] = useState<FixturePartido[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTorneos, setLoadingTorneos] = useState(true)

  useEffect(() => {
    listarTorneos()
      .then(setTorneos)
      .catch(console.error)
      .finally(() => setLoadingTorneos(false))
  }, [])

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
      <header className={styles.header}>
        <h1 className={styles.title}>Próximos Partidos</h1>
        <p className={styles.subtitle}>Fixture de la temporada</p>
      </header>

      {/* Filtro por torneo */}
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

      {loading ? (
        <p className={styles.infoMsg}>Cargando partidos...</p>
      ) : partidos.length === 0 ? (
        <p className={styles.infoMsg}>No hay partidos programados próximamente.</p>
      ) : (
        <div>
          {grupos.map(grupo => (
            <section key={grupo.key} className={styles.grupo}>
              <h2 className={styles.grupoTitle}>{grupo.label}</h2>
              <div className={styles.tabla}>
                {grupo.partidos.map(p => (
                  <div key={p.id_fixture_partido} className={styles.row}>
                    <div className={styles.equipos}>
                      <span className={styles.equipo}>{p.nombre_equipo_local ?? "Local"}</span>
                      <span className={styles.vs}>vs</span>
                      <span className={styles.equipo}>{p.nombre_equipo_visitante ?? "Visitante"}</span>
                    </div>
                    <div className={styles.info}>
                      <span className={styles.infoItem}>📅 {formatFecha(p.fecha_programada)}</span>
                      <span className={styles.infoItem}>🕐 {formatHorario(p.horario)}</span>
                      {p.ubicacion && (
                        <span className={styles.infoItem}>📍 {p.ubicacion}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
