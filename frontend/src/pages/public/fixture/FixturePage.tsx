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
            {t.nombre} — {t.categoria}
          </button>
        ))}
      </div>

      {loading ? (
        <p className={styles.infoMsg}>Cargando partidos...</p>
      ) : partidos.length === 0 ? (
        <p className={styles.infoMsg}>No hay partidos programados próximamente.</p>
      ) : (
        <div className={styles.cards}>
          {partidos.map(p => (
            <article key={p.id_fixture_partido} className={styles.card}>
              <div className={styles.torneo}>{p.nombre_torneo}</div>
              <div className={styles.equipos}>
                <span className={styles.equipo}>{p.nombre_equipo_local ?? "Local"}</span>
                <span className={styles.vs}>vs</span>
                <span className={styles.equipo}>{p.nombre_equipo_visitante ?? "Visitante"}</span>
              </div>
              <div className={styles.info}>
                <span className={styles.infoItem}>
                  📅 {formatFecha(p.fecha_programada)}
                </span>
                <span className={styles.infoItem}>
                  🕐 {formatHorario(p.horario)}
                </span>
                {p.ubicacion && (
                  <span className={styles.infoItem}>
                    📍 {p.ubicacion}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
