import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { listarTorneos } from "../../../api/torneos.api"
import { obtenerGoleadoresTorneo } from "../../../api/vistas/goleadores.api"
import { obtenerTarjetasAcumuladas } from "../../../api/vistas/tarjetas.api"
import { obtenerVallaMenosVencida } from "../../../api/vistas/valla.api"

import type { Torneo } from "../../../types/torneo"
import type { GoleadorTorneo, TarjetaAcumulada, VallaMenosVencida } from "../../../types/vistas"

import styles from "./RankingPage.module.css"

type Tab = "goleadores" | "tarjetas" | "valla"

export default function RankingPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const idTorneoParam = searchParams.get("torneo")
  const tabParam = (searchParams.get("tab") as Tab) || "goleadores"

  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [torneoSeleccionado, setTorneoSeleccionado] = useState<number | null>(
    idTorneoParam ? Number(idTorneoParam) : null
  )
  const [tab, setTab] = useState<Tab>(tabParam)

  const [goleadores, setGoleadores] = useState<GoleadorTorneo[]>([])
  const [tarjetas, setTarjetas] = useState<TarjetaAcumulada[]>([])
  const [valla, setValla] = useState<VallaMenosVencida[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listarTorneos().then(setTorneos).catch(console.error)
  }, [])

  useEffect(() => {
    if (!torneoSeleccionado) return
    setLoading(true)
    Promise.all([
      obtenerGoleadoresTorneo(torneoSeleccionado),
      obtenerTarjetasAcumuladas(torneoSeleccionado),
      obtenerVallaMenosVencida(torneoSeleccionado),
    ])
      .then(([g, t, v]) => {
        setGoleadores(g)
        setTarjetas(t)
        setValla(v)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [torneoSeleccionado])

  const nombreTorneo = torneos.find(t => t.id_torneo === torneoSeleccionado)

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        ← Volver
      </button>

      <header className={styles.header}>
        <h1 className={styles.title}>Estadisticas</h1>
      </header>

      {/* Selector de torneo */}
      <div className={styles.selectorRow}>
        <label className={styles.label}>Torneo:</label>
        <select
          className={styles.select}
          value={torneoSeleccionado ?? ""}
          onChange={e => setTorneoSeleccionado(Number(e.target.value))}
        >
          <option value="">Seleccionar torneo...</option>
          {torneos.map(t => (
            <option key={t.id_torneo} value={t.id_torneo}>
              {t.nombre} {new Date(t.fecha_inicio).getFullYear()} — {t.categoria}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(["goleadores", "tarjetas", "valla"] as Tab[]).map(t => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.activeTab : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "goleadores" && "Goleadores"}
            {t === "tarjetas" && "Tarjetas"}
            {t === "valla" && "Valla menos vencida"}
          </button>
        ))}
      </div>

      {!torneoSeleccionado ? (
        <p className={styles.info}>Seleccioná un torneo para ver el ranking.</p>
      ) : loading ? (
        <p className={styles.info}>Cargando...</p>
      ) : (
        <div className={styles.tableCard}>
          {nombreTorneo && (
            <p className={styles.torneoLabel}>
              {nombreTorneo.nombre} — Categoría {nombreTorneo.categoria}
            </p>
          )}

          {/* GOLEADORES */}
          {tab === "goleadores" && (
            goleadores.length > 0 ? (
              <div className={styles.responsiveScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th className={styles.alignLeft}>Jugador</th>
                      <th className={styles.alignLeft}>Equipo</th>
                      <th>Goles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goleadores.map((g) => (
                      <tr key={g.id_persona}>
                        <td>{g.ranking_en_torneo}</td>
                        <td className={styles.alignLeft}>
                          <span className={styles.playerName}>{g.nombre} {g.apellido}</span>
                        </td>
                        <td className={styles.alignLeft}>
                          <span className={styles.playerTeam}>{g.nombre_equipo}</span>
                        </td>
                        <td className={styles.bold}>{g.goles_netos_en_torneo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className={styles.info}>Sin goles registrados.</p>
          )}

          {/* TARJETAS */}
          {tab === "tarjetas" && (
            tarjetas.length > 0 ? (
              <div className={styles.responsiveScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th className={styles.alignLeft}>Jugador</th>
                      <th className={styles.alignLeft}>Equipo</th>
                      <th><span className={styles.boxVerde}>V</span></th>
                      <th><span className={styles.boxAmarilla}>A</span></th>
                      <th><span className={styles.boxRoja}>R</span></th>
                      <th><span className={styles.boxTotal}>T</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tarjetas.map((t, i) => (
                      <tr key={t.id_persona}>
                        <td>{i + 1}</td>
                        <td className={styles.alignLeft}>
                          <span className={styles.playerName}>{t.nombre_persona} {t.apellido_persona}</span>
                        </td>
                        <td className={styles.alignLeft}>
                          <span className={styles.playerTeam}>{t.equipo}</span>
                        </td>
                        <td>{t.total_verdes}</td>
                        <td>{t.total_amarillas}</td>
                        <td>{t.total_rojas}</td>
                        <td className={styles.bold}>{t.total_tarjetas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className={styles.info}>Sin tarjetas registradas.</p>
          )}

          {/* VALLA */}
          {tab === "valla" && (
            valla.length > 0 ? (
              <div className={styles.responsiveScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th className={styles.alignLeft}>Equipo</th>
                      <th className={styles.alignLeft}>Club</th>
                      <th>PJ</th>
                      <th>GC</th>
                      <th>Prom.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valla.map((v) => (
                      <tr key={v.id_equipo}>
                        <td>{v.ranking_en_torneo}</td>
                        <td className={styles.alignLeft}>
                          <span className={styles.playerName}>{v.nombre_equipo}</span>
                        </td>
                        <td className={styles.alignLeft}>
                          <span className={styles.playerTeam}>{v.nombre_club}</span>
                        </td>
                        <td>{v.partidos_jugados}</td>
                        <td className={styles.bold}>{v.goles_en_contra}</td>
                        <td>{v.promedio_goles_recibidos != null ? Number(v.promedio_goles_recibidos).toFixed(2) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className={styles.info}>Sin datos registrados.</p>
          )}
        </div>
      )}
    </div>
  )
}
