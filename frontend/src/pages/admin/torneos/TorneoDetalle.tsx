import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { useInscripcionesTorneo } from "../../../hooks/useInscripcionesTorneo"
import InscripcionesTorneoLista from "./InscripcionesTorneoLista"
import { useTorneo } from "../../../hooks/useTorneo"
import Button from "../../../components/ui/button/Button"
import InscribirEquipoModal from "./InscribirEquipoModal"
import CrearTorneoForm from "./CrearTorneoForm"
import PlayoffLauncher from "./PlayoffLauncher"
import FixtureTab from "../fixture/FixtureTab"
import { finalizarTorneo, reabrirTorneo, eliminarTorneo, impactoEliminacionTorneo } from "../../../api/torneos.api"
import { obtenerGoleadoresTorneo } from "../../../api/vistas/goleadores.api"
import { obtenerVallaMenosVencida } from "../../../api/vistas/valla.api"
import { obtenerPosiciones } from "../../../api/vistas/posiciones.api"
import { obtenerTarjetasAcumuladas } from "../../../api/vistas/tarjetas.api"
import type { GoleadorTorneo, VallaMenosVencida, FilaPosiciones, TarjetaAcumulada } from "../../../types/vistas"

import styles from "./TorneoDetalle.module.css"

export default function TorneoDetalle() {
  const { idTorneo } = useParams<{ idTorneo: string }>()
  const torneoId = Number(idTorneo)
  const navigate = useNavigate();
  const { torneo, loading: loadingTorneo, refetch: refetchTorneo } = useTorneo(torneoId)
  const {
    inscripciones,
    loading: loadingInscripciones,
    error,
    baja,
    refetch,
  } = useInscripcionesTorneo(torneoId)

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"resumen" | "fixture" | "configuracion">("resumen")
  const [subTabConfig, setSubTabConfig] = useState<"info" | "inscripcion" | "playoff">("info")
  const [editandoInfo, setEditandoInfo] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [tabla, setTabla] = useState<FilaPosiciones[]>([])
  const [goleadores, setGoleadores] = useState<GoleadorTorneo[]>([])
  const [valla, setValla] = useState<VallaMenosVencida[]>([])
  const [tarjetas, setTarjetas] = useState<TarjetaAcumulada[]>([])

  useEffect(() => {
    if (!torneoId) return
    Promise.all([
      obtenerPosiciones(torneoId),
      obtenerGoleadoresTorneo(torneoId),
      obtenerVallaMenosVencida(torneoId),
      obtenerTarjetasAcumuladas(torneoId),
    ]).then(([dataPos, dataGol, dataValla, dataTar]) => {
      setTabla(dataPos)
      setGoleadores(dataGol)
      setValla(dataValla)
      setTarjetas(dataTar)
    }).catch(err => console.error("Error cargando estadísticas:", err))
  }, [torneoId])

  const handleInscripto = () => {
    refetch()
  }

  /** Marca el torneo como finalizado y recarga el detalle. */
  const handleFinalizar = async () => {
    if (!confirm("¿Finalizar torneo?")) return
    setProcesando(true)
    try {
      await finalizarTorneo(torneoId)
      refetchTorneo()
    } finally {
      setProcesando(false)
    }
  }

  /** Reactiva un torneo finalizado y recarga el detalle. */
  const handleReabrir = async () => {
    if (!confirm("¿Reabrir torneo? Volverá a estar activo.")) return
    setProcesando(true)
    try {
      await reabrirTorneo(torneoId)
      refetchTorneo()
    } finally {
      setProcesando(false)
    }
  }

  /** Elimina el torneo de forma DEFINITIVA (irreversible) y vuelve al listado. */
  const handleEliminar = async () => {
    if (!torneo.activo) {
      alert(
        "El torneo está finalizado. Reabrilo antes de eliminarlo, para confirmar " +
        "que realmente querés borrar su historial."
      )
      return
    }

    setProcesando(true)
    try {
      // Radio de impacto: mostramos qué se lleva puesto antes de confirmar.
      const imp = await impactoEliminacionTorneo(torneoId)
      const detalle =
        `• ${imp.partidos} partidos\n` +
        `• ${imp.goles} goles\n` +
        `• ${imp.tarjetas} tarjetas\n` +
        `• ${imp.inscripciones} inscripciones\n` +
        `• ${imp.fases} fases`

      const ok = confirm(
        `Vas a ELIMINAR DEFINITIVAMENTE el torneo "${imp.nombre}".\n\n` +
        `Esto borra para siempre (no se puede deshacer):\n${detalle}\n\n` +
        `¿Seguro que querés continuar?`
      )
      if (!ok) return

      await eliminarTorneo(torneoId)
      navigate("/admin/torneos")
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? "No se pudo eliminar el torneo.")
    } finally {
      setProcesando(false)
    }
  }

  if (loadingTorneo || loadingInscripciones) return <p>Cargando…</p>
  if (error || !torneo) return <p>Error</p>

  return (
    <section className={styles.section}>
      {/* HEADER */}
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{torneo.nombre}</h2>
          <p className={styles.meta}>
            Categoría {torneo.categoria}{torneo.division ? ` ${torneo.division}` : ""} – {torneo.genero} –{" "}
            {new Date(torneo.fecha_inicio).getFullYear()}
          </p>
        </div>
        <div className={styles.botones}>
          <Button onClick={() => navigate("/admin/torneos")}>← Volver</Button>
        </div>
      </header>

      {/* PESTAÑAS */}
      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "resumen" ? styles.tabActive : ""}`}
          onClick={() => setTab("resumen")}
        >
          Resumen
        </button>
        <button
          className={`${styles.tab} ${tab === "fixture" ? styles.tabActive : ""}`}
          onClick={() => setTab("fixture")}
        >
          Fixture
        </button>
        <button
          className={`${styles.tab} ${tab === "configuracion" ? styles.tabActive : ""}`}
          onClick={() => setTab("configuracion")}
        >
          Configuración
        </button>
      </nav>

      {tab === "fixture" && <FixtureTab torneo={torneo} />}

      {tab === "configuracion" && (
        <>
          {/* SUB-PESTAÑAS DE CONFIGURACIÓN */}
          <nav className={styles.subTabs}>
            <button
              className={`${styles.subTab} ${subTabConfig === "info" ? styles.subTabActive : ""}`}
              onClick={() => setSubTabConfig("info")}
            >
              Información general
            </button>
            <button
              className={`${styles.subTab} ${subTabConfig === "inscripcion" ? styles.subTabActive : ""}`}
              onClick={() => setSubTabConfig("inscripcion")}
            >
              Inscripción de equipos
            </button>
            {torneo.tipo === "LIGA" && (
              <button
                className={`${styles.subTab} ${subTabConfig === "playoff" ? styles.subTabActive : ""}`}
                onClick={() => setSubTabConfig("playoff")}
              >
                Play Off
              </button>
            )}
          </nav>

          {/* INFORMACIÓN GENERAL */}
          {subTabConfig === "info" && (
            <div className={styles.tableCard}>
              {editandoInfo ? (
                <CrearTorneoForm
                  torneoEditar={torneo}
                  onCancel={() => setEditandoInfo(false)}
                  onSuccess={() => { refetchTorneo(); setEditandoInfo(false) }}
                />
              ) : (
                <>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.statsTitle}>Información general</h3>
                    <Button onClick={() => setEditandoInfo(true)}>✏️ Editar</Button>
                  </div>
                  <dl className={styles.infoList}>
                    <div className={styles.infoRow}>
                      <dt className={styles.infoLabel}>Nombre</dt>
                      <dd className={styles.infoValue}>{torneo.nombre}</dd>
                    </div>
                    <div className={styles.infoRow}>
                      <dt className={styles.infoLabel}>Categoría</dt>
                      <dd className={styles.infoValue}>{torneo.categoria.replace(/_/g, " ")}</dd>
                    </div>
                    <div className={styles.infoRow}>
                      <dt className={styles.infoLabel}>División</dt>
                      <dd className={styles.infoValue}>{torneo.division || "—"}</dd>
                    </div>
                    <div className={styles.infoRow}>
                      <dt className={styles.infoLabel}>Género</dt>
                      <dd className={styles.infoValue}>{torneo.genero}</dd>
                    </div>
                    <div className={styles.infoRow}>
                      <dt className={styles.infoLabel}>Tipo</dt>
                      <dd className={styles.infoValue}>{torneo.tipo}</dd>
                    </div>
                    <div className={styles.infoRow}>
                      <dt className={styles.infoLabel}>Fecha de inicio</dt>
                      <dd className={styles.infoValue}>{torneo.fecha_inicio}</dd>
                    </div>
                    <div className={styles.infoRow}>
                      <dt className={styles.infoLabel}>Reglas de arbitraje</dt>
                      <dd className={styles.infoValue}>{torneo.es_competitiva ? "Sí" : "No"}</dd>
                    </div>
                    <div className={styles.infoRow}>
                      <dt className={styles.infoLabel}>Estado</dt>
                      <dd className={styles.infoValue}>{torneo.activo ? "Activo" : "Finalizado"}</dd>
                    </div>
                  </dl>
                </>
              )}
            </div>
          )}

          {/* EQUIPOS INSCRIPTOS */}
          {subTabConfig === "inscripcion" && (
            <div className={styles.tableCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.statsTitle}>Equipos inscriptos</h3>
                <Button onClick={() => setOpen(true)}>➕ Inscribir equipo</Button>
              </div>
              <InscripcionesTorneoLista
                inscripciones={inscripciones}
                onBaja={baja}
              />
            </div>
          )}

          {/* PLAY OFF (solo ligas) */}
          {subTabConfig === "playoff" && torneo.tipo === "LIGA" && (
            <PlayoffLauncher torneoBase={torneo} />
          )}
        </>
      )}

      {tab === "resumen" && (
        <>
      {/* TABLA DE POSICIONES */}
      <div className={styles.tableCard}>
        <h3 className={styles.statsTitle}>Tabla de posiciones</h3>
        {tabla.length > 0 ? (
          <div className={styles.responsiveScroll}>
            <table className={styles.posicionesTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Equipo</th>
                  <th>PTS</th>
                  <th>PJ</th><th>PG</th><th>PE</th><th>PP</th>
                  <th>GF</th><th>GC</th><th>DG</th>
                </tr>
              </thead>
              <tbody>
                {tabla.map((fila, index) => (
                  <tr key={fila.id_equipo}>
                    <td>{index + 1}</td>
                    <td>{fila.equipo}</td>
                    <td><strong>{fila.puntos}</strong></td>
                    <td>{fila.partidos_jugados}</td>
                    <td>{fila.ganados}</td>
                    <td>{fila.empatados}</td>
                    <td>{fila.perdidos}</td>
                    <td>{fila.goles_a_favor}</td>
                    <td>{fila.goles_en_contra}</td>
                    <td>{fila.diferencia_gol}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className={styles.infoSmall}>Sin posiciones registradas.</p>}
      </div>

      {/* ESTADÍSTICAS */}
      <div className={styles.statsGrid}>
        {/* GOLEADORES */}
        <div className={styles.statsCard}>
          <h3 className={styles.statsTitle}>Goleadores</h3>
          {goleadores.length > 0 ? (
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Jugador</th>
                  <th>Goles</th>
                </tr>
              </thead>
              <tbody>
                {goleadores.slice(0, 5).map((g) => (
                  <tr key={g.id_persona}>
                    <td>{g.ranking_en_torneo}</td>
                    <td>
                      <div>{g.nombre} {g.apellido}</div>
                      <div className={styles.subText}>{g.nombre_equipo}</div>
                    </td>
                    <td className={styles.bold}>{g.goles_netos_en_torneo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className={styles.infoSmall}>Sin goles registrados.</p>}
        </div>

        {/* VALLA MENOS VENCIDA */}
        <div className={styles.statsCard}>
          <h3 className={styles.statsTitle}>Valla menos vencida</h3>
          {valla.length > 0 ? (
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Equipo</th>
                  <th>GC</th>
                  <th>PJ</th>
                </tr>
              </thead>
              <tbody>
                {valla.slice(0, 5).map((v) => (
                  <tr key={v.id_equipo}>
                    <td>{v.ranking_en_torneo}</td>
                    <td>
                      <div>{v.nombre_equipo}</div>
                      <div className={styles.subText}>{v.nombre_club}</div>
                    </td>
                    <td className={styles.bold}>{v.goles_en_contra}</td>
                    <td>{v.partidos_jugados}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className={styles.infoSmall}>Sin datos registrados.</p>}
        </div>
        {/* TARJETAS */}
        <div className={styles.statsCard}>
          <h3 className={styles.statsTitle}>Tarjetas</h3>
          {tarjetas.length > 0 ? (
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>V</th>
                  <th>A</th>
                  <th>R</th>
                </tr>
              </thead>
              <tbody>
                {tarjetas.slice(0, 5).map((t) => (
                  <tr key={t.id_persona}>
                    <td>
                      <div>{t.nombre_persona} {t.apellido_persona}</div>
                      <div className={styles.subText}>{t.equipo}</div>
                    </td>
                    <td>{t.total_verdes}</td>
                    <td>{t.total_amarillas}</td>
                    <td className={t.total_rojas > 0 ? styles.bold : ""}>{t.total_rojas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className={styles.infoSmall}>Sin tarjetas registradas.</p>}
        </div>
      </div>

      {/* ZONA PELIGROSA */}
      <div className={styles.dangerZone}>
        <h3 className={styles.dangerTitle}>Zona peligrosa</h3>

        <div className={styles.dangerRow}>
          <div>
            <strong className={styles.dangerLabel}>
              {torneo.activo ? "Finalizar torneo" : "Reabrir torneo"}
            </strong>
            <p className={styles.dangerDesc}>
              {torneo.activo
                ? "Cierra el torneo. No se podrán cargar más resultados hasta reabrirlo."
                : "Vuelve a poner el torneo en estado activo."}
            </p>
          </div>
          <Button
            variant="secondary"
            disabled={procesando}
            onClick={torneo.activo ? handleFinalizar : handleReabrir}
          >
            {torneo.activo ? "🏁 Finalizar" : "🔁 Reabrir"}
          </Button>
        </div>

        <div className={styles.dangerRow}>
          <div>
            <strong className={styles.dangerLabel}>Eliminar torneo</strong>
            <p className={styles.dangerDesc}>
              Borra el torneo y todos sus datos (partidos, goles, tarjetas,
              inscripciones) de forma definitiva. No se puede deshacer. Para
              torneos ya jugados, usá <strong>Finalizar</strong> en vez de eliminar.
            </p>
          </div>
          <Button variant="danger" disabled={procesando} onClick={handleEliminar}>
            🗑 Eliminar
          </Button>
        </div>
      </div>
        </>
      )}

      {/* MODAL */}
      {open && (
        <InscribirEquipoModal
          torneo={torneo}
          inscripciones={inscripciones}
          onClose={() => setOpen(false)}
          onInscripto={handleInscripto}
        />
      )}
    </section>
  )
}
