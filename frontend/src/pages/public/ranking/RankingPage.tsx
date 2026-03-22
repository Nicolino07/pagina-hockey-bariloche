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

const ORDEN_CATEGORIA: Record<string, number> = {
  MAYORES: 0, SUB_19: 1, SUB_16: 2, SUB_14: 3, SUB_12: 4,
}
const CATEGORIA_LABEL: Record<string, string> = {
  MAYORES: "Mayores", SUB_19: "Sub 19", SUB_16: "Sub 16", SUB_14: "Sub 14", SUB_12: "Sub 12",
}
const GENERO_ICON: Record<string, string> = {
  MASCULINO: "♂", FEMENINO: "♀", MIXTO: "⚥",
}

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
  const [selectorAbierto, setSelectorAbierto] = useState(false)

  const [goleadores, setGoleadores] = useState<GoleadorTorneo[]>([])
  const [tarjetas, setTarjetas] = useState<TarjetaAcumulada[]>([])
  const [valla, setValla] = useState<VallaMenosVencida[]>([])
  const [loading, setLoading] = useState(false)

  // Filtros y paginación de tarjetas
  const [filtroPersona, setFiltroPersona] = useState("")
  const [filtroEquipo, setFiltroEquipo] = useState("")
  const [paginaTarjetas, setPaginaTarjetas] = useState(1)
  const POR_PAGINA = 20
  const [torneosHistoricos, setTorneosHistoricos] = useState<Torneo[]>([])
  const [verHistoricos, setVerHistoricos] = useState(false)
  const [loadingHistoricos, setLoadingHistoricos] = useState(false)

  useEffect(() => {
    listarTorneos()
      .then(data => {
        const ordenados = [...data].sort((a, b) => {
          const catDiff = (ORDEN_CATEGORIA[a.categoria] ?? 99) - (ORDEN_CATEGORIA[b.categoria] ?? 99)
          if (catDiff !== 0) return catDiff
          return (a.division ?? "").localeCompare(b.division ?? "")
        })
        setTorneos(ordenados)
      })
      .catch(console.error)
  }, [])

  function cargarHistoricos() {
    if (verHistoricos) return
    setLoadingHistoricos(true)
    listarTorneos(false)
      .then(todos => {
        const activosIds = new Set(torneos.map(t => t.id_torneo))
        const historicos = todos
          .filter(t => !activosIds.has(t.id_torneo))
          .sort((a, b) => {
            const catDiff = (ORDEN_CATEGORIA[a.categoria] ?? 99) - (ORDEN_CATEGORIA[b.categoria] ?? 99)
            if (catDiff !== 0) return catDiff
            return (a.division ?? "").localeCompare(b.division ?? "")
          })
        setTorneosHistoricos(historicos)
        setVerHistoricos(true)
      })
      .catch(console.error)
      .finally(() => setLoadingHistoricos(false))
  }

  useEffect(() => {
    if (!torneoSeleccionado) return
    setLoading(true)
    Promise.all([
      obtenerGoleadoresTorneo(torneoSeleccionado),
      obtenerTarjetasAcumuladas(torneoSeleccionado),
      obtenerVallaMenosVencida(torneoSeleccionado),
    ])
      .then(([g, t, v]) => { setGoleadores(g); setTarjetas(t); setValla(v) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [torneoSeleccionado])

  function seleccionar(id: number) {
    setTorneoSeleccionado(id)
    setSelectorAbierto(false)
  }

  const torneoActual = torneos.find(t => t.id_torneo === torneoSeleccionado)
    ?? torneosHistoricos.find(t => t.id_torneo === torneoSeleccionado)

  return (
    <div className={styles.container}>

      <button className={styles.backBtn} onClick={() => navigate("/")}>← Volver</button>

      <header className={styles.header}>
        <h1 className={styles.title}>Estadísticas</h1>
        <p className={styles.subtitle}>Goleadores, valla y tarjetas por torneo</p>
      </header>

      <div className={styles.layout}>

        {/* ── Columna izquierda: selector de torneos ── */}
        <aside className={styles.colSelector}>
          {/* Toggle mobile */}
          <button
            className={styles.selectorMobileToggle}
            onClick={() => setSelectorAbierto(v => !v)}
          >
            <span>🏆 {torneoActual
              ? `${torneoActual.nombre} · ${CATEGORIA_LABEL[torneoActual.categoria] ?? torneoActual.categoria}`
              : "Seleccionar torneo"}
            </span>
            <span>{selectorAbierto ? "∧" : "∨"}</span>
          </button>

          <div className={`${styles.torneosTabla} ${selectorAbierto ? styles.torneosTablaAbierta : ""}`}>
            <div className={styles.torneosTablaHeader}>
              <span>🏆</span>
              <span>TORNEOS</span>
            </div>
            {torneos.map(t => {
              const activo = torneoSeleccionado === t.id_torneo
              return (
                <button
                  key={t.id_torneo}
                  className={`${styles.torneoFila} ${activo ? styles.torneoFilaActiva : ""}`}
                  onClick={() => seleccionar(t.id_torneo)}
                >
                  <div className={styles.torneoFilaInfo}>
                    <span className={styles.torneoFilaNombre}>{t.nombre}</span>
                    <div className={styles.torneoFilaBadges}>
                      <span className={styles.torneoFilaBadge}>
                        {CATEGORIA_LABEL[t.categoria] ?? t.categoria}
                      </span>
                      <span className={styles.torneoFilaBadge}>
                        {GENERO_ICON[t.genero]} {t.genero === "MASCULINO" ? "Masc." : t.genero === "FEMENINO" ? "Fem." : "Mixto"}
                      </span>
                      {t.division && <span className={styles.torneoFilaBadge}>{t.division}</span>}
                    </div>
                  </div>
                  {activo && <span className={styles.torneoFilaCheck}>✓</span>}
                </button>
              )
            })}
            {torneos.length === 0 && (
              <p className={styles.infoSmall}>Sin torneos activos</p>
            )}

            {verHistoricos && torneosHistoricos.length > 0 && (
              <>
                <div className={styles.historicosHeader}>Históricos</div>
                {torneosHistoricos.map(t => {
                  const activo = torneoSeleccionado === t.id_torneo
                  return (
                    <button
                      key={t.id_torneo}
                      className={`${styles.torneoFila} ${activo ? styles.torneoFilaActiva : ""}`}
                      onClick={() => seleccionar(t.id_torneo)}
                    >
                      <div className={styles.torneoFilaInfo}>
                        <span className={styles.torneoFilaNombre}>{t.nombre}</span>
                        <div className={styles.torneoFilaBadges}>
                          <span className={styles.torneoFilaBadge}>{CATEGORIA_LABEL[t.categoria] ?? t.categoria}</span>
                          <span className={styles.torneoFilaBadge}>{GENERO_ICON[t.genero]} {t.genero === "MASCULINO" ? "Masc." : t.genero === "FEMENINO" ? "Fem." : "Mixto"}</span>
                          {t.division && <span className={styles.torneoFilaBadge}>{t.division}</span>}
                        </div>
                      </div>
                      {activo && <span className={styles.torneoFilaCheck}>✓</span>}
                    </button>
                  )
                })}
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

        {/* ── Columna derecha: contenido ── */}
        <div className={styles.colContenido}>
          {!torneoSeleccionado ? (
            <div className={styles.placeholder}>Seleccioná un torneo para ver las estadísticas</div>
          ) : torneoActual?.categoria === "SUB_12" ? (
            <div className={styles.placeholder}>Esta categoría no registra estadísticas individuales.</div>
          ) : (
            <>
              {/* Título */}
              <div className={styles.sectionTitle}>
                {torneoActual?.nombre}
                <span className={styles.sectionTitleMeta}>
                  {CATEGORIA_LABEL[torneoActual?.categoria ?? ""] ?? torneoActual?.categoria}
                  {torneoActual?.division ? ` ${torneoActual.division}` : ""}
                  {" · "}
                  {torneoActual?.genero === "MASCULINO" ? "Masculino" : torneoActual?.genero === "FEMENINO" ? "Femenino" : "Mixto"}
                </span>
              </div>

              {/* Tabs */}
              <div className={styles.tabs}>
                {(["goleadores", "tarjetas", "valla"] as Tab[]).map(t => (
                  <button
                    key={t}
                    className={`${styles.tab} ${tab === t ? styles.activeTab : ""}`}
                    onClick={() => setTab(t)}
                  >
                    {t === "goleadores" && "⚽ Goleadores"}
                    {t === "tarjetas" && "🟨 Tarjetas"}
                    {t === "valla" && "🧤 Valla"}
                  </button>
                ))}
              </div>

              {loading ? (
                <p className={styles.info}>Cargando...</p>
              ) : (
                <div className={styles.tableCard}>

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
                              <th>PJ</th>
                              <th>Prom.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {goleadores.map(g => (
                              <tr key={g.id_persona}>
                                <td>{g.ranking_en_torneo}</td>
                                <td className={styles.alignLeft}>
                                  <span className={styles.playerName}>{g.apellido}, {g.nombre}</span>
                                </td>
                                <td className={styles.alignLeft}>
                                  <span className={styles.playerTeam}>{g.nombre_equipo}</span>
                                </td>
                                <td className={styles.bold}>
                                  {g.goles_netos_en_torneo}
                                  {g.autogoles_en_torneo > 0 && (
                                    <span className={styles.autogol}> ({g.autogoles_en_torneo} en contra)</span>
                                  )}
                                </td>
                                <td className={styles.muted}>{g.partidos_jugados}</td>
                                <td className={styles.muted}>{g.promedio_goles ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <p className={styles.info}>Sin goles registrados.</p>
                  )}

                  {/* TARJETAS */}
                  {tab === "tarjetas" && (() => {
                    const filtradas = tarjetas.filter(t =>
                      `${t.nombre_persona} ${t.apellido_persona}`.toLowerCase().includes(filtroPersona.toLowerCase()) &&
                      t.equipo.toLowerCase().includes(filtroEquipo.toLowerCase())
                    )
                    const totalPaginas = Math.ceil(filtradas.length / POR_PAGINA)
                    const pagina = Math.min(paginaTarjetas, totalPaginas || 1)
                    const visibles = filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

                    return tarjetas.length === 0
                      ? <p className={styles.info}>Sin tarjetas registradas.</p>
                      : (
                        <>
                          {/* Filtros */}
                          <div className={styles.filtrosRow}>
                            <input
                              className={styles.filtroInput}
                              placeholder="Buscar jugador..."
                              value={filtroPersona}
                              onChange={e => { setFiltroPersona(e.target.value); setPaginaTarjetas(1) }}
                            />
                            <input
                              className={styles.filtroInput}
                              placeholder="Buscar equipo..."
                              value={filtroEquipo}
                              onChange={e => { setFiltroEquipo(e.target.value); setPaginaTarjetas(1) }}
                            />
                          </div>

                          {filtradas.length === 0 ? (
                            <p className={styles.info}>Sin resultados.</p>
                          ) : (
                            <>
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
                                    {visibles.map((t, i) => (
                                      <tr key={t.id_persona}>
                                        <td>{(pagina - 1) * POR_PAGINA + i + 1}</td>
                                        <td className={styles.alignLeft}>
                                          <span className={styles.playerName}>{t.apellido_persona}, {t.nombre_persona}</span>
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

                              {/* Paginación */}
                              {totalPaginas > 1 && (
                                <div className={styles.paginacion}>
                                  <button
                                    className={styles.paginaBtn}
                                    disabled={pagina === 1}
                                    onClick={() => setPaginaTarjetas(p => p - 1)}
                                  >←</button>
                                  <span className={styles.paginaInfo}>
                                    {pagina} / {totalPaginas}
                                    <span className={styles.paginaTotal}> ({filtradas.length} jugadores)</span>
                                  </span>
                                  <button
                                    className={styles.paginaBtn}
                                    disabled={pagina === totalPaginas}
                                    onClick={() => setPaginaTarjetas(p => p + 1)}
                                  >→</button>
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )
                  })()}

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
                            {valla.map(v => (
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
                                <td className={styles.muted}>{v.promedio_goles_recibidos ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <p className={styles.info}>Sin datos registrados.</p>
                  )}

                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  )
}
