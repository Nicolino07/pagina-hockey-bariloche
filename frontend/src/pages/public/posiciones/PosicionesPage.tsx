import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { listarTorneosPublico } from "../../../api/torneos.api"
import { obtenerPosiciones } from "../../../api/vistas/posiciones.api"
import { obtenerTarjetasAcumuladas } from "../../../api/vistas/tarjetas.api"
import { obtenerGoleadoresTorneo } from "../../../api/vistas/goleadores.api"
import { obtenerVallaMenosVencida } from "../../../api/vistas/valla.api"
import { listarInscripcionesTorneo } from "../../../api/torneos.api"
import { listarFixturePorTorneo } from "../../../api/fixture.api"
import BracketPlayoff from "./BracketPlayoff"

import type { Torneo } from "../../../types/torneo"
import type { FilaPosiciones, TarjetaAcumulada, GoleadorTorneo, VallaMenosVencida } from "../../../types/vistas"
import type { InscripcionTorneoDetalle } from "../../../types/inscripcion"
import type { FixturePartido } from "../../../types/fixture"

import styles from "./PosicionesPage.module.css"
import { useSeo } from "../../../hooks/useSeo"

const ORDEN_CATEGORIA: Record<string, number> = {
  MAYORES: 0, SUB_19: 1, SUB_16: 2, SUB_14: 3, SUB_12: 4,
}

const CATEGORIA_LABEL: Record<string, string> = {
  MAYORES: "Mayores", SUB_19: "Sub 19", SUB_16: "Sub 16", SUB_14: "Sub 14", SUB_12: "Sub 12",
}

const GENERO_ICON: Record<string, string> = {
  MASCULINO: "♂", FEMENINO: "♀", MIXTO: "⚥",
}

export default function PosicionesPage() {
  useSeo({
    title: "Tabla de posiciones",
    description:
      "Tabla de posiciones actualizada de los torneos de hockey sobre pista de Bariloche, por categoría, zona y fase de playoff.",
  })

  const navigate = useNavigate()
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectorAbierto, setSelectorAbierto] = useState(false)
  const [torneoSeleccionado, setTorneoSeleccionado] = useState<Torneo | null>(null)
  const [tabla, setTabla] = useState<FilaPosiciones[]>([])
  const [tarjetas, setTarjetas] = useState<TarjetaAcumulada[]>([])
  const [goleadores, setGoleadores] = useState<GoleadorTorneo[]>([])
  const [valla, setValla] = useState<VallaMenosVencida[]>([])
  const [equipos, setEquipos] = useState<InscripcionTorneoDetalle[]>([])
  const [loadingDatos, setLoadingDatos] = useState(false)
  const [verHistoricos, setVerHistoricos] = useState(false)
  const [bracket, setBracket] = useState<FixturePartido[]>([])
  // Playoff abierto como pestaña dentro del torneo elegido. null = la liga.
  const [subTabPlayoff, setSubTabPlayoff] = useState<number | null>(null)

  const porCategoria = (a: Torneo, b: Torneo) => {
    const catDiff = (ORDEN_CATEGORIA[a.categoria] ?? 99) - (ORDEN_CATEGORIA[b.categoria] ?? 99)
    if (catDiff !== 0) return catDiff
    return (a.division ?? "").localeCompare(b.division ?? "")
  }

  // Se traen activos y finalizados juntos. Hace falta: el playoff de una liga en
  // curso puede estar ya terminado, y aun así es una pestaña de esa liga.
  useEffect(() => {
    listarTorneosPublico(false)
      .then((data: Torneo[]) => setTorneos([...data].sort(porCategoria)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Los playoffs no se listan sueltos: se abren como pestaña dentro del torneo
  // que los originó. Uno sin torneo base sí aparece — no hay otro lado desde
  // donde llegar a él.
  const enSelector = torneos.filter(t => !t.torneo_base_id)
  const torneosActivos = enSelector.filter(t => t.activo)
  const torneosHistoricos = enSelector.filter(t => !t.activo)

  /** Fases finales colgadas del torneo elegido, en orden cronológico. */
  const playoffsDelTorneo = torneoSeleccionado
    ? torneos
        .filter(t => t.torneo_base_id === torneoSeleccionado.id_torneo)
        .sort((a, b) => (a.fecha_inicio ?? "").localeCompare(b.fecha_inicio ?? ""))
    : []

  /** Lo que se está mirando: la liga, o el playoff abierto en su pestaña. */
  const torneoVista =
    playoffsDelTorneo.find(t => t.id_torneo === subTabPlayoff) ?? torneoSeleccionado

  const esPlayoff = torneoVista?.tipo === "PLAYOFF" || torneoVista?.tipo === "COPA"

  useEffect(() => {
    if (!torneoVista) return
    setLoadingDatos(true)
    setBracket([])

    if (esPlayoff) {
      Promise.all([
        listarFixturePorTorneo(torneoVista.id_torneo),
        listarInscripcionesTorneo(torneoVista.id_torneo),
        obtenerGoleadoresTorneo(torneoVista.id_torneo),
        obtenerTarjetasAcumuladas(torneoVista.id_torneo),
      ])
        .then(([dataFixture, dataEq, dataGol, dataTar]) => {
          setBracket(dataFixture.filter(p => p.id_fixture_playoff_ronda !== null))
          setEquipos(dataEq)
          setGoleadores(dataGol)
          setTarjetas(dataTar)
        })
        .catch(console.error)
        .finally(() => setLoadingDatos(false))
    } else {
      Promise.all([
        obtenerPosiciones(torneoVista.id_torneo),
        obtenerTarjetasAcumuladas(torneoVista.id_torneo),
        obtenerGoleadoresTorneo(torneoVista.id_torneo),
        listarInscripcionesTorneo(torneoVista.id_torneo),
        obtenerVallaMenosVencida(torneoVista.id_torneo),
      ])
        .then(([dataPos, dataTar, dataGol, dataEq, dataValla]) => {
          setTabla(dataPos)
          setTarjetas(dataTar)
          setGoleadores(dataGol)
          setEquipos(dataEq)
          setValla(dataValla)
        })
        .catch(console.error)
        .finally(() => setLoadingDatos(false))
    }
  }, [torneoVista?.id_torneo])

  function seleccionar(torneo: Torneo) {
    setTorneoSeleccionado(torneo)
    setSubTabPlayoff(null)
    setSelectorAbierto(false)
  }

  if (loading) return <div className={styles.loader}>Cargando torneos...</div>

  return (
    <div className={styles.container}>

      <button className={styles.backBtn} onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")}>← Volver</button>

      <header className={styles.header}>
        <h1 className={styles.title}>Posiciones</h1>
        <p className={styles.subtitle}>Seleccioná un torneo para ver sus estadísticas</p>
      </header>

      <div className={styles.layout}>

        {/* ── Columna izquierda: selector de torneos ── */}
        <aside className={styles.colSelector}>
          {/* Toggle mobile */}
          <button
            className={styles.selectorMobileToggle}
            onClick={() => setSelectorAbierto(v => !v)}
          >
            <span>🏆 {torneoSeleccionado
              ? `${torneoSeleccionado.nombre} · ${CATEGORIA_LABEL[torneoSeleccionado.categoria] ?? torneoSeleccionado.categoria}`
              : "Seleccionar torneo"}
            </span>
            <span>{selectorAbierto ? "∧" : "∨"}</span>
          </button>

          <div className={`${styles.torneosTabla} ${selectorAbierto ? styles.torneosTablaAbierta : ""}`}>
            <div className={styles.torneosTablaHeader}>
              <span>🏆</span>
              <span>TORNEOS ACTIVOS</span>
            </div>
            {torneosActivos.map(t => {
              const activo = torneoSeleccionado?.id_torneo === t.id_torneo
              return (
                <button
                  key={t.id_torneo}
                  className={`${styles.torneoFila} ${activo ? styles.torneoFilaActiva : ""}`}
                  onClick={() => seleccionar(t)}
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
            {torneosActivos.length === 0 && (
              <p className={styles.infoSmall}>Sin torneos activos</p>
            )}

            {verHistoricos && torneosHistoricos.length > 0 && (
              <>
                <div className={styles.historicosHeader}>Históricos</div>
                {torneosHistoricos.map(t => {
                  const activo = torneoSeleccionado?.id_torneo === t.id_torneo
                  return (
                    <button
                      key={t.id_torneo}
                      className={`${styles.torneoFila} ${activo ? styles.torneoFilaActiva : ""}`}
                      onClick={() => seleccionar(t)}
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

            {!verHistoricos && torneosHistoricos.length > 0 && (
              <button
                className={styles.historicosBtn}
                onClick={() => setVerHistoricos(true)}
              >
                Ver torneos históricos
              </button>
            )}
          </div>
        </aside>

        {/* ── Columna derecha: contenido ── */}
        <div className={styles.colContenido}>
          {/* Pestañas inline: la liga y sus fases finales. El playoff no es un
              torneo aparte en la navegación, es una pestaña de su liga. */}
          {torneoSeleccionado && playoffsDelTorneo.length > 0 && (
            <div className={styles.viewTabs}>
              <button
                className={`${styles.viewTabBtn} ${subTabPlayoff === null ? styles.viewTabBtnActivo : ""}`}
                onClick={() => setSubTabPlayoff(null)}
              >
                Tabla de posiciones
              </button>
              {playoffsDelTorneo.map(p => (
                <button
                  key={p.id_torneo}
                  className={`${styles.viewTabBtn} ${subTabPlayoff === p.id_torneo ? styles.viewTabBtnActivo : ""}`}
                  onClick={() => setSubTabPlayoff(p.id_torneo)}
                >
                  {p.tipo === "COPA" ? "🏆" : "🥇"} {p.nombre}
                </button>
              ))}
            </div>
          )}

          {!torneoVista ? (
            <div className={styles.placeholder}>
              <p>Seleccioná un torneo para ver sus estadísticas</p>
            </div>
          ) : loadingDatos ? (
            <p className={styles.infoMsg}>Cargando datos del torneo...</p>
          ) : torneoVista.categoria === "SUB_12" ? (
            <>
              <p className={styles.infoMsg}>Esta categoría no tiene tabla de posiciones ni estadísticas individuales.</p>
              <div className={styles.equiposDivider}>
                <h3 className={styles.statsTitle}>Equipos Inscriptos</h3>
                <div className={styles.equiposGrid}>
                  {equipos.map(eq => (
                    <Link
                      key={eq.id_equipo}
                      className={styles.equipoItem}
                      to={`/public/equipos/${eq.id_equipo}`}
                    >
                      <div className={styles.equipoInfo}>
                        <span className={styles.equipoName}>{eq.nombre_equipo}</span>
                        <span className={styles.equipoLabel}>Ver plantel →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          ) : esPlayoff ? (
            <>
              <div className={styles.sectionTitle}>
                {torneoVista.nombre}
                <span className={styles.sectionTitleMeta}>
                  {CATEGORIA_LABEL[torneoVista.categoria]}
                  {torneoVista.division ? ` ${torneoVista.division}` : ""}
                  {" · "}
                  {torneoVista.genero === "MASCULINO" ? "Masculino" : torneoVista.genero === "FEMENINO" ? "Femenino" : "Mixto"}
                  {" · "}
                  <span>{torneoVista.tipo === "COPA" ? "Copa" : "Playoff"}</span>
                </span>
              </div>

              <div className={styles.tableCard}>
                <h3 className={styles.statsTitle}>Llaves</h3>
                <BracketPlayoff partidos={bracket} />
              </div>

              <div className={styles.statsGrid}>
                <div className={styles.statsCard}>
                  <h3 className={styles.statsTitle}>Goleadores</h3>
                  {goleadores.length > 0 ? (
                    <table className={styles.statsTable}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th className={styles.alignLeft}>Jugador</th>
                          <th>Goles</th>
                        </tr>
                      </thead>
                      <tbody>
                        {goleadores.slice(0, 5).map(g => (
                          <tr key={g.id_persona}>
                            <td>{g.ranking_en_torneo}</td>
                            <td className={styles.alignLeft}>
                              <div className={styles.playerName}>{g.nombre} {g.apellido}</div>
                              <div className={styles.playerTeam}>{g.nombre_equipo}</div>
                            </td>
                            <td className={styles.bold}>{g.goles_netos_en_torneo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p className={styles.infoSmall}>Sin goles.</p>}
                  <Link className={styles.verRankingBtn} to={`/public/ranking?torneo=${torneoVista.id_torneo}&tab=goleadores`}>
                    Ver ranking completo →
                  </Link>
                </div>

                <div className={styles.statsCard}>
                  <h3 className={styles.statsTitle}>Tarjetas</h3>
                  {tarjetas.length > 0 ? (
                    <table className={styles.statsTable}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th className={styles.alignLeft}>Jugador</th>
                          <th><span className={styles.boxAmarilla}>A</span></th>
                          <th><span className={styles.boxRoja}>R</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {tarjetas.slice(0, 5).map((t, index) => (
                          <tr key={t.id_persona}>
                            <td>{index + 1}</td>
                            <td className={styles.alignLeft}>
                              <div className={styles.playerName}>{t.nombre_persona} {t.apellido_persona}</div>
                              <div className={styles.playerTeam}>{t.equipo}</div>
                            </td>
                            <td>{t.total_amarillas}</td>
                            <td>{t.total_rojas}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p className={styles.infoSmall}>Sin tarjetas.</p>}
                  <Link className={styles.verRankingBtn} to={`/public/ranking?torneo=${torneoVista.id_torneo}&tab=tarjetas`}>
                    Ver ranking completo →
                  </Link>
                </div>
              </div>

              <div className={styles.equiposDivider}>
                <h3 className={styles.statsTitle}>Equipos Inscriptos</h3>
                <div className={styles.equiposGrid}>
                  {equipos.map(eq => (
                    <Link key={eq.id_equipo} className={styles.equipoItem} to={`/public/equipos/${eq.id_equipo}`}>
                      <div className={styles.equipoInfo}>
                        <span className={styles.equipoName}>{eq.nombre_equipo}</span>
                        <span className={styles.equipoLabel}>Ver plantel →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Título del torneo seleccionado */}
              <div className={styles.sectionTitle}>
                {torneoVista.nombre}
                <span className={styles.sectionTitleMeta}>
                  {CATEGORIA_LABEL[torneoVista.categoria]}
                  {torneoVista.division ? ` ${torneoVista.division}` : ""}
                  {" · "}
                  {torneoVista.genero === "MASCULINO" ? "Masculino" : torneoVista.genero === "FEMENINO" ? "Femenino" : "Mixto"}
                </span>
              </div>

              {/* TABLA DE POSICIONES */}
              <div className={styles.tableCard}>
                <h3 className={styles.statsTitle}>Tabla de Posiciones</h3>
                {tabla.length > 0 ? (
                  <div className={styles.responsiveScroll}>
                    <table className={styles.posicionesTable}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th className={styles.alignLeft}>Equipo</th>
                          <th className={styles.puntosCol}>PTS</th>
                          <th>PJ</th><th>PG</th><th>PE</th><th>PP</th>
                          <th className={styles.hideMobile}>GF</th>
                          <th className={styles.hideMobile}>GC</th>
                          <th>DG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabla.map((fila, index) => (
                          <tr key={fila.id_equipo}>
                            <td>{index + 1}</td>
                            <td className={styles.equipoNombre}>{fila.equipo}</td>
                            <td className={styles.puntosValor}>{fila.puntos}</td>
                            <td>{fila.partidos_jugados}</td>
                            <td>{fila.ganados}</td>
                            <td>{fila.empatados}</td>
                            <td>{fila.perdidos}</td>
                            <td className={styles.hideMobile}>{fila.goles_a_favor}</td>
                            <td className={styles.hideMobile}>{fila.goles_en_contra}</td>
                            <td>{fila.diferencia_gol}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className={styles.infoSmall}>No hay posiciones registradas.</p>}
              </div>

              {/* GRILLA GOLEADORES / VALLA / TARJETAS */}
              <div className={styles.statsGrid}>

                <div className={styles.statsCard}>
                  <h3 className={styles.statsTitle}>Goleadores</h3>
                  {goleadores.length > 0 ? (
                    <table className={styles.statsTable}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th className={styles.alignLeft}>Jugador</th>
                          <th>Goles</th>
                        </tr>
                      </thead>
                      <tbody>
                        {goleadores.slice(0, 5).map(g => (
                          <tr key={g.id_persona}>
                            <td>{g.ranking_en_torneo}</td>
                            <td className={styles.alignLeft}>
                              <div className={styles.playerName}>{g.nombre} {g.apellido}</div>
                              <div className={styles.playerTeam}>{g.nombre_equipo}</div>
                            </td>
                            <td className={styles.bold}>{g.goles_netos_en_torneo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p className={styles.infoSmall}>Sin goles.</p>}
                  <Link className={styles.verRankingBtn} to={`/public/ranking?torneo=${torneoVista.id_torneo}&tab=goleadores`}>
                    Ver ranking completo →
                  </Link>
                </div>

                <div className={styles.statsCard}>
                  <h3 className={styles.statsTitle}>Valla menos vencida</h3>
                  {valla.length > 0 ? (
                    <table className={styles.statsTable}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th className={styles.alignLeft}>Equipo</th>
                          <th>GC</th>
                          <th className={styles.hideMobile}>PJ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {valla.slice(0, 5).map(v => (
                          <tr key={v.id_equipo}>
                            <td>{v.ranking_en_torneo}</td>
                            <td className={styles.alignLeft}>
                              <div className={styles.playerName}>{v.nombre_equipo}</div>
                              <div className={styles.playerTeam}>{v.nombre_club}</div>
                            </td>
                            <td className={styles.bold}>{v.goles_en_contra}</td>
                            <td className={styles.hideMobile}>{v.partidos_jugados}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p className={styles.infoSmall}>Sin datos.</p>}
                  <Link className={styles.verRankingBtn} to={`/public/ranking?torneo=${torneoVista.id_torneo}&tab=valla`}>
                    Ver ranking completo →
                  </Link>
                </div>

                <div className={styles.statsCard}>
                  <h3 className={styles.statsTitle}>Tarjetas</h3>
                  {tarjetas.length > 0 ? (
                    <table className={styles.statsTable}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th className={styles.alignLeft}>Jugador</th>
                          <th><span className={styles.boxVerde}>V</span></th>
                          <th><span className={styles.boxAmarilla}>A</span></th>
                          <th><span className={styles.boxRoja}>R</span></th>
                          <th><span className={styles.boxTotal}>T</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {tarjetas.slice(0, 5).map((t, index) => (
                          <tr key={t.id_persona}>
                            <td>{index + 1}</td>
                            <td className={styles.alignLeft}>
                              <div className={styles.playerName}>{t.nombre_persona} {t.apellido_persona}</div>
                              <div className={styles.playerTeam}>{t.equipo}</div>
                            </td>
                            <td>{t.total_verdes}</td>
                            <td>{t.total_amarillas}</td>
                            <td>{t.total_rojas}</td>
                            <td>{t.total_tarjetas}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p className={styles.infoSmall}>Sin tarjetas.</p>}
                  <Link className={styles.verRankingBtn} to={`/public/ranking?torneo=${torneoVista.id_torneo}&tab=tarjetas`}>
                    Ver ranking completo →
                  </Link>
                </div>

              </div>

              {/* EQUIPOS INSCRIPTOS */}
              <div className={styles.equiposDivider}>
                <h3 className={styles.statsTitle}>Equipos Inscriptos</h3>
                <div className={styles.equiposGrid}>
                  {equipos.map(eq => (
                    <Link
                      key={eq.id_equipo}
                      className={styles.equipoItem}
                      to={`/public/equipos/${eq.id_equipo}`}
                    >
                      <div className={styles.equipoInfo}>
                        <span className={styles.equipoName}>{eq.nombre_equipo}</span>
                        <span className={styles.equipoLabel}>Ver plantel →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
