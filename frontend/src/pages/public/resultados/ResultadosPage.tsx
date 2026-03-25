import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { obtenerPartidosRecientes, obtenerDetallePartido } from "../../../api/partidos.api"
import { listarTorneos } from "../../../api/torneos.api"
import PartidoDetalleModal from "../../../components/partidos/PartidoDetalleModal"
import type { Torneo } from "../../../types/torneo"
import styles from "./ResultadosPage.module.css"

const ORDEN_CATEGORIA: Record<string, number> = {
  MAYORES: 0, SUB_19: 1, SUB_16: 2, SUB_14: 3, SUB_12: 4,
}
const CATEGORIA_LABEL: Record<string, string> = {
  MAYORES: "Mayores", SUB_19: "Sub 19", SUB_16: "Sub 16", SUB_14: "Sub 14", SUB_12: "Sub 12",
}
const GENERO_ICON: Record<string, string> = {
  MASCULINO: "♂", FEMENINO: "♀", MIXTO: "⚥",
}

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

function labelDia(fechaStr: string): string {
  const [year, month, day] = fechaStr.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return `${DIAS[date.getDay()]} ${day} de ${MESES[month - 1]}`
}

export default function ResultadosPage() {
  const navigate = useNavigate()
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [partidos, setPartidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [torneoSeleccionado, setTorneoSeleccionado] = useState<number | null>(null)
  const [selectorAbierto, setSelectorAbierto] = useState(false)
  const [selectedPartido, setSelectedPartido] = useState<any>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [filtroEquipo, setFiltroEquipo] = useState("")
  const [filtroFecha, setFiltroFecha] = useState("")
  const [torneosHistoricos, setTorneosHistoricos] = useState<Torneo[]>([])
  const [verHistoricos, setVerHistoricos] = useState(false)
  const [loadingHistoricos, setLoadingHistoricos] = useState(false)

  useEffect(() => {
    Promise.all([listarTorneos(), obtenerPartidosRecientes()])
      .then(([t, p]) => {
        const ordenados = [...t].sort((a, b) => {
          const catDiff = (ORDEN_CATEGORIA[a.categoria] ?? 99) - (ORDEN_CATEGORIA[b.categoria] ?? 99)
          if (catDiff !== 0) return catDiff
          return (a.division ?? "").localeCompare(b.division ?? "")
        })
        setTorneos(ordenados)
        setPartidos(p)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleVerDetalle = async (partido: any) => {
    setLoadingDetalle(true)
    try {
      const detalle = await obtenerDetallePartido(partido.id_partido)
      setSelectedPartido(detalle)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingDetalle(false)
    }
  }

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

  const torneoActual = torneos.find(t => t.id_torneo === torneoSeleccionado)
    ?? torneosHistoricos.find(t => t.id_torneo === torneoSeleccionado)

  // Partidos del torneo seleccionado con filtros aplicados
  const partidosFiltrados = partidos
    .filter(p => p.id_torneo === torneoSeleccionado)
    .filter(p => {
      if (!filtroEquipo) return true
      const eq = filtroEquipo.toLowerCase()
      return p.equipo_local_nombre?.toLowerCase().includes(eq) ||
             p.equipo_visitante_nombre?.toLowerCase().includes(eq)
    })
    .filter(p => !filtroFecha || p.fecha?.slice(0, 10) === filtroFecha)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  // Fechas disponibles para el selector (del torneo, sin filtro equipo)
  const fechasDisponibles = Array.from(new Set(
    partidos
      .filter(p => p.id_torneo === torneoSeleccionado)
      .map(p => p.fecha?.slice(0, 10))
      .filter(Boolean)
  )).sort((a, b) => b.localeCompare(a))

  const porFecha = (() => {
    const mapa = new Map<string, any[]>()
    for (const p of partidosFiltrados) {
      const f = p.fecha?.slice(0, 10) ?? "sin-fecha"
      if (!mapa.has(f)) mapa.set(f, [])
      mapa.get(f)!.push(p)
    }
    return Array.from(mapa.entries()).map(([fecha, ps]) => ({
      fecha,
      label: fecha === "sin-fecha" ? "Sin fecha" : labelDia(fecha),
      partidos: ps,
    }))
  })()

  // Torneos que tienen partidos cargados
  const torneosConPartidos = new Set(partidos.map(p => p.id_torneo))

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")}>← Volver</button>

      <header className={styles.header}>
        <h1 className={styles.title}>Resultados</h1>
        <p className={styles.subtitle}>Historial de encuentros jugados por torneo</p>
      </header>

      {loading ? (
        <p className={styles.loader}>Cargando...</p>
      ) : (
        <div className={styles.layout}>

          {/* ── Sidebar selector ── */}
          <aside className={styles.colSelector}>
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
              {torneos.filter(t => torneosConPartidos.has(t.id_torneo)).map(t => {
                const activo = torneoSeleccionado === t.id_torneo
                return (
                  <button
                    key={t.id_torneo}
                    className={`${styles.torneoFila} ${activo ? styles.torneoFilaActiva : ""}`}
                    onClick={() => { setTorneoSeleccionado(t.id_torneo); setSelectorAbierto(false); setFiltroEquipo(""); setFiltroFecha("") }}
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
              {torneos.filter(t => torneosConPartidos.has(t.id_torneo)).length === 0 && (
                <p className={styles.infoSmall}>Sin partidos registrados</p>
              )}

              {/* Históricos */}
              {verHistoricos && torneosHistoricos.length > 0 && (
                <>
                  <div className={styles.historicosHeader}>Históricos</div>
                  {torneosHistoricos.map(t => {
                    const activo = torneoSeleccionado === t.id_torneo
                    return (
                      <button
                        key={t.id_torneo}
                        className={`${styles.torneoFila} ${activo ? styles.torneoFilaActiva : ""}`}
                        onClick={() => { setTorneoSeleccionado(t.id_torneo); setSelectorAbierto(false); setFiltroEquipo(""); setFiltroFecha("") }}
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

              {/* Botón ver históricos */}
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

          {/* ── Contenido ── */}
          <div className={styles.colContenido}>
            {!torneoSeleccionado ? (
              <div className={styles.placeholder}>Seleccioná un torneo para ver los resultados</div>
            ) : partidosFiltrados.length === 0 ? (
              <div className={styles.placeholder}>Sin partidos registrados para este torneo</div>
            ) : (
              <>
                <div className={styles.sectionTitle}>
                  {torneoActual?.nombre}
                  <span className={styles.sectionTitleMeta}>
                    {CATEGORIA_LABEL[torneoActual?.categoria ?? ""] ?? torneoActual?.categoria}
                    {torneoActual?.division ? ` ${torneoActual.division}` : ""}
                    {" · "}
                    {torneoActual?.genero === "MASCULINO" ? "Masculino" : torneoActual?.genero === "FEMENINO" ? "Femenino" : "Mixto"}
                  </span>
                </div>

                <div className={styles.filtrosRow}>
                  <input
                    className={styles.filtroInput}
                    placeholder="Buscar equipo..."
                    value={filtroEquipo}
                    onChange={e => setFiltroEquipo(e.target.value)}
                  />
                  <select
                    className={styles.filtroSelect}
                    value={filtroFecha}
                    onChange={e => setFiltroFecha(e.target.value)}
                  >
                    <option value="">Todas las fechas</option>
                    {fechasDisponibles.map(f => (
                      <option key={f} value={f}>
                        {labelDia(f)}
                      </option>
                    ))}
                  </select>
                </div>

                {partidosFiltrados.length === 0 ? (
                  <div className={styles.placeholder}>Sin partidos para los filtros aplicados</div>
                ) : porFecha.map(grupo => (
                  <div key={grupo.fecha} className={styles.grupoFecha}>
                    <div className={styles.grupoFechaHeader}>{grupo.label}</div>
                    <div className={styles.grupoPartidos}>
                      {grupo.partidos.map(p => (
                        <button
                          key={p.id_partido}
                          className={styles.partidoCard}
                          onClick={() => handleVerDetalle(p)}
                        >
                          <div className={styles.partidoEncuentro}>
                            <span className={styles.equipoNombre}>{p.equipo_local_nombre}</span>
                            <span className={styles.marcador}>{p.goles_local} - {p.goles_visitante}</span>
                            <span className={`${styles.equipoNombre} ${styles.equipoVisitante}`}>{p.equipo_visitante_nombre}</span>
                          </div>
                          {p.numero_fecha && (
                            <span className={styles.fechaTag}>Fecha {p.numero_fecha}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
                }
              </>
            )}
          </div>

        </div>
      )}

      {/* ── Modal detalle ── */}
      {selectedPartido && (
        <PartidoDetalleModal partido={selectedPartido} onClose={() => setSelectedPartido(null)} />
      )}

      {loadingDetalle && <div className={styles.loadingOverlay}>Cargando detalle...</div>}
    </div>
  )
}
