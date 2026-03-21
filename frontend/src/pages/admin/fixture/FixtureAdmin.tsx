import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { listarTorneos, listarInscripcionesTorneo } from "../../../api/torneos.api"
import {
  listarFixturePorTorneo,
  programarPartido,
  editarPartidoFixture,
  eliminarPartidoFixture,
} from "../../../api/fixture.api"
import type { Torneo } from "../../../types/torneo"
import type { InscripcionTorneoDetalle } from "../../../types/inscripcion"
import type { FixturePartido, FixturePartidoCreate, FixturePartidoUpdate } from "../../../types/fixture"
import Button from "../../../components/ui/button/Button"
import styles from "./FixtureAdmin.module.css"

/** Valores iniciales vacíos para el formulario de programación de partido. */
const FORM_VACIO: FixturePartidoCreate = {
  id_torneo: 0,
  id_equipo_local: 0,
  id_equipo_visitante: 0,
  fecha_programada: "",
  horario: "",
  ubicacion: "",
  numero_fecha: undefined,
}

/**
 * Página administrativa de gestión del fixture.
 * Permite seleccionar un torneo, ver sus partidos programados y
 * crear, editar o eliminar partidos del fixture.
 * Los partidos ya jugados se muestran en modo solo lectura.
 */
export default function FixtureAdmin() {
  const navigate = useNavigate()
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [torneoId, setTorneoId] = useState<number | null>(null)
  const [inscripciones, setInscripciones] = useState<InscripcionTorneoDetalle[]>([])
  const [partidos, setPartidos] = useState<FixturePartido[]>([])
  const [loadingPartidos, setLoadingPartidos] = useState(false)

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState<FixturePartido | null>(null)
  const [form, setForm] = useState<FixturePartidoCreate>(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carga la lista de torneos disponibles al montar el componente.
  useEffect(() => {
    listarTorneos().then(setTorneos).catch(console.error)
  }, [])

  // Recarga inscripciones y partidos del fixture al seleccionar un torneo distinto.
  useEffect(() => {
    if (!torneoId) return
    setInscripciones([])
    setPartidos([])
    setLoadingPartidos(true)

    Promise.all([
      listarInscripcionesTorneo(torneoId),
      listarFixturePorTorneo(torneoId),
    ])
      .then(([insc, fix]) => {
        setInscripciones(insc)
        setPartidos(fix)
      })
      .catch(console.error)
      .finally(() => setLoadingPartidos(false))
  }, [torneoId])

  /** Abre el formulario en modo creación con el torneo actual preseleccionado. */
  function abrirFormularioNuevo() {
    setEditando(null)
    setForm({ ...FORM_VACIO, id_torneo: torneoId! })
    setError(null)
    setMostrarFormulario(true)
  }

  /**
   * Abre el formulario en modo edición precargando los datos del partido seleccionado.
   * @param p - Partido del fixture a editar.
   */
  function abrirFormularioEdicion(p: FixturePartido) {
    setEditando(p)
    setForm({
      id_torneo: p.id_torneo,
      id_equipo_local: p.id_equipo_local,
      id_equipo_visitante: p.id_equipo_visitante,
      fecha_programada: p.fecha_programada ?? "",
      horario: p.horario ?? "",
      ubicacion: p.ubicacion ?? "",
      numero_fecha: p.numero_fecha ?? undefined,
    })
    setError(null)
    setMostrarFormulario(true)
  }

  /** Cierra el formulario y limpia el estado de edición y error. */
  function cerrarFormulario() {
    setMostrarFormulario(false)
    setEditando(null)
    setError(null)
  }

  /**
   * Guarda el partido del fixture: crea uno nuevo o actualiza el existente según el modo.
   * Valida que ambos equipos estén seleccionados y sean distintos antes de enviar.
   */
  async function handleGuardar() {
    if (!form.id_equipo_local || !form.id_equipo_visitante) {
      setError("Seleccioná ambos equipos.")
      return
    }
    if (form.id_equipo_local === form.id_equipo_visitante) {
      setError("El equipo local y visitante deben ser distintos.")
      return
    }

    setGuardando(true)
    setError(null)
    try {
      if (editando) {
        const update: FixturePartidoUpdate = {
          fecha_programada: form.fecha_programada || null,
          horario: form.horario || null,
          ubicacion: form.ubicacion || null,
          numero_fecha: form.numero_fecha ?? null,
        }
        await editarPartidoFixture(editando.id_fixture_partido, update)
      } else {
        await programarPartido({
          ...form,
          fecha_programada: form.fecha_programada || null,
          horario: form.horario || null,
          ubicacion: form.ubicacion || null,
        })
      }
      const nuevos = await listarFixturePorTorneo(torneoId!)
      setPartidos(nuevos)
      cerrarFormulario()
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Error al guardar el partido.")
    } finally {
      setGuardando(false)
    }
  }

  /**
   * Elimina un partido del fixture tras confirmación del usuario.
   * @param id - ID del partido del fixture a eliminar.
   */
  async function handleEliminar(id: number) {
    if (!confirm("¿Eliminar este partido del fixture?")) return
    try {
      await eliminarPartidoFixture(id)
      setPartidos(prev => prev.filter(p => p.id_fixture_partido !== id))
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? "Error al eliminar.")
    }
  }

  /** Mapa de id_equipo → nombre_equipo construido desde las inscripciones del torneo. */
  const equiposPorId = Object.fromEntries(
    inscripciones.map(i => [i.id_equipo, i.nombre_equipo])
  )

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Fixture</h2>
        <p className={styles.subtitle}>Programá los próximos partidos por torneo.</p>
      </header>

      {/* Selector de torneo */}
      <div className={styles.selectorRow}>
        <label className={styles.label}>Torneo</label>
        <select
          className={styles.select}
          value={torneoId ?? ""}
          onChange={e => {
            setTorneoId(Number(e.target.value) || null)
            setMostrarFormulario(false)
          }}
        >
          <option value="">— Seleccioná un torneo —</option>
          {torneos.map(t => (
            <option key={t.id_torneo} value={t.id_torneo}>
              {t.nombre} — {t.categoria}{t.division ? ` ${t.division}` : ""} {t.genero}
            </option>
          ))}
        </select>

        {torneoId && !mostrarFormulario && (
          <Button onClick={abrirFormularioNuevo}>+ Programar partido</Button>
        )}
      </div>

      {/* Formulario */}
      {mostrarFormulario && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>
            {editando ? "Editar partido" : "Programar partido"}
          </h3>

          <div className={styles.formGrid}>
            {/* Equipos — solo en creación */}
            {!editando && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Equipo local</label>
                  <select
                    className={styles.select}
                    value={form.id_equipo_local || ""}
                    onChange={e => setForm(f => ({ ...f, id_equipo_local: Number(e.target.value) }))}
                  >
                    <option value="">— Seleccioná —</option>
                    {inscripciones.map(i => (
                      <option key={i.id_equipo} value={i.id_equipo}>{i.nombre_equipo}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Equipo visitante</label>
                  <select
                    className={styles.select}
                    value={form.id_equipo_visitante || ""}
                    onChange={e => setForm(f => ({ ...f, id_equipo_visitante: Number(e.target.value) }))}
                  >
                    <option value="">— Seleccioná —</option>
                    {inscripciones
                      .filter(i => i.id_equipo !== form.id_equipo_local)
                      .map(i => (
                        <option key={i.id_equipo} value={i.id_equipo}>{i.nombre_equipo}</option>
                      ))}
                  </select>
                </div>
              </>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Fecha del partido</label>
              <input
                type="date"
                className={styles.input}
                value={form.fecha_programada ?? ""}
                onChange={e => setForm(f => ({ ...f, fecha_programada: e.target.value }))}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Horario</label>
              <input
                type="time"
                className={styles.input}
                value={form.horario ?? ""}
                onChange={e => setForm(f => ({ ...f, horario: e.target.value }))}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Ubicación</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Ej: Cancha Municipal"
                value={form.ubicacion ?? ""}
                onChange={e => setForm(f => ({ ...f, ubicacion: e.target.value }))}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>N° de fecha</label>
              <input
                type="number"
                className={styles.input}
                placeholder="Ej: 1"
                min={1}
                value={form.numero_fecha ?? ""}
                onChange={e => setForm(f => ({ ...f, numero_fecha: e.target.value ? Number(e.target.value) : undefined }))}
              />
            </div>
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <div className={styles.formActions}>
            <Button onClick={handleGuardar} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
            <Button onClick={cerrarFormulario}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Lista de partidos */}
      {torneoId && (
        <section className={styles.lista}>
          {loadingPartidos ? (
            <p className={styles.infoMsg}>Cargando fixture...</p>
          ) : partidos.length === 0 ? (
            <p className={styles.infoMsg}>No hay partidos programados para este torneo.</p>
          ) : (
            <div className={styles.tablaWrap}>
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Local</th>
                    <th>Visitante</th>
                    <th>Día</th>
                    <th>Horario</th>
                    <th>Ubicación</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {partidos.map(p => (
                    <tr key={p.id_fixture_partido} className={p.jugado ? styles.jugado : ""}>
                      <td>{p.numero_fecha ? `Fecha ${p.numero_fecha}` : "—"}</td>
                      <td>{p.nombre_equipo_local ?? equiposPorId[p.id_equipo_local] ?? p.id_equipo_local}</td>
                      <td>{p.nombre_equipo_visitante ?? equiposPorId[p.id_equipo_visitante] ?? p.id_equipo_visitante}</td>
                      <td>{p.fecha_programada ?? "—"}</td>
                      <td>{p.horario ? p.horario.slice(0, 5) : "—"}</td>
                      <td>{p.ubicacion ?? "—"}</td>
                      <td>
                        <span className={p.jugado ? styles.badgeJugado : styles.badgePendiente}>
                          {p.jugado ? "Jugado" : "Pendiente"}
                        </span>
                      </td>
                      <td className={styles.acciones}>
                        {!p.jugado && (
                          <>
                            <button
                              className={styles.btnCargar}
                              onClick={() => navigate(`/admin/partidos/nueva-planilla?fixture=${p.id_fixture_partido}`)}
                            >
                              Cargar resultado
                            </button>
                            <button
                              className={styles.btnEditar}
                              onClick={() => abrirFormularioEdicion(p)}
                            >
                              Editar
                            </button>
                            <button
                              className={styles.btnEliminar}
                              onClick={() => handleEliminar(p.id_fixture_partido)}
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
