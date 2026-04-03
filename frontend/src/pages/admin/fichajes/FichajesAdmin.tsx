import { useState, useEffect, useMemo } from "react"
import { getClubes } from "../../../api/clubes.api"
import { getFichajesPorClub, crearFichaje, darBajaFichaje, getPersonasDisponiblesParaFichar } from "../../../api/fichajes.api"
import type { Club } from "../../../types/club"
import Button from "../../../components/ui/button/Button"
import styles from "./FichajesAdmin.module.css"

const ROLES = [
  'JUGADOR', 'DT', 'ARBITRO',
  'DELEGADO', 'ASISTENTE', 'MEDICO', 'PREPARADOR_FISICO'
]

/** Representa un fichaje activo devuelto por la API de fichajes. */
interface FichajeActivo {
  id_fichaje_rol: number
  id_persona: number
  id_club: number
  id_persona_rol: number
  rol: string
  fecha_inicio: string
  fecha_fin: string | null
  activo: boolean
  persona_nombre: string
  persona_apellido: string
  persona_documento: number
  persona_genero: string
}

/** Tipos de modal que pueden estar activos en la página de fichajes. */
type ModalTipo = 'nuevo' | 'baja' | 'transferir' | null

/** Retorna la fecha actual en formato ISO (YYYY-MM-DD). */
const hoy = () => new Date().toISOString().split("T")[0]

export default function FichajesAdmin() {
  const [clubes, setClubes] = useState<Club[]>([])
  const [fichajes, setFichajes] = useState<FichajeActivo[]>([])
  const [clubId, setClubId] = useState<number | null>(null)
  const [loadingFichajes, setLoadingFichajes] = useState(false)
  const [saving, setSaving] = useState(false)

  const [modal, setModal] = useState<ModalTipo>(null)
  const [fichajeSeleccionado, setFichajeSeleccionado] = useState<FichajeActivo | null>(null)

  // --- Estado modal Nuevo Fichaje (multi-select) ---
  const [rolNuevo, setRolNuevo] = useState("JUGADOR")
  const [busquedaNuevo, setBusquedaNuevo] = useState("")
  const [personasDisponibles, setPersonasDisponibles] = useState<any[]>([])
  const [loadingPersonas, setLoadingPersonas] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set())
  const [resultadoFichaje, setResultadoFichaje] = useState<{ ok: string[]; errores: string[] } | null>(null)

  // --- Buscador en tabla ---
  const [filtroPlantel, setFiltroPlantel] = useState("")

  // --- Estado modal Dar de Baja ---
  const [fechaBaja, setFechaBaja] = useState(hoy())

  // --- Estado modal Transferir ---
  const [clubDestino, setClubDestino] = useState<number | null>(null)
  const [rolTransfer, setRolTransfer] = useState("JUGADOR")
  const [fechaTransfer, setFechaTransfer] = useState(hoy())

  useEffect(() => {
    getClubes().then(setClubes)
  }, [])

  useEffect(() => {
    if (!clubId) { setFichajes([]); setFiltroPlantel(""); return }
    setLoadingFichajes(true)
    getFichajesPorClub(clubId, true)
      .then(setFichajes)
      .catch(console.error)
      .finally(() => setLoadingFichajes(false))
  }, [clubId])

  // Carga personas disponibles cuando se abre el modal nuevo o cambia el rol
  useEffect(() => {
    if (modal !== 'nuevo' || !clubId) return
    setSeleccionados(new Set())
    setResultadoFichaje(null)
    setBusquedaNuevo("")
    setPersonasDisponibles([])
    setLoadingPersonas(true)
    getPersonasDisponiblesParaFichar(clubId, rolNuevo)
      .then(setPersonasDisponibles)
      .catch(console.error)
      .finally(() => setLoadingPersonas(false))
  }, [modal, rolNuevo, clubId])

  const fichajesFiltrados = useMemo(() => {
    if (!filtroPlantel) return fichajes
    const q = filtroPlantel.toLowerCase()
    return fichajes.filter(f =>
      `${f.persona_apellido} ${f.persona_nombre}`.toLowerCase().includes(q) ||
      String(f.persona_documento).includes(q)
    )
  }, [fichajes, filtroPlantel])

  const personasFiltradas = useMemo(() => {
    if (!busquedaNuevo) return personasDisponibles
    const q = busquedaNuevo.toLowerCase()
    return personasDisponibles.filter((p: any) =>
      `${p.apellido} ${p.nombre}`.toLowerCase().includes(q) ||
      String(p.documento).includes(q)
    )
  }, [busquedaNuevo, personasDisponibles])

  const recargarFichajes = () => {
    if (!clubId) return
    getFichajesPorClub(clubId, true).then(setFichajes).catch(console.error)
  }

  const cerrarModal = () => {
    setModal(null)
    setFichajeSeleccionado(null)
    setRolNuevo("JUGADOR")
    setBusquedaNuevo("")
    setSeleccionados(new Set())
    setResultadoFichaje(null)
    setFechaBaja(hoy())
    setClubDestino(null)
    setRolTransfer("JUGADOR")
    setFechaTransfer(hoy())
  }

  const toggleSeleccionado = (id: number) => {
    setSeleccionados(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleFicharSeleccionados = async () => {
    if (seleccionados.size === 0 || !clubId) return
    const aFichar = personasDisponibles.filter((p: any) => seleccionados.has(p.id_persona))
    setSaving(true)
    const resultados = await Promise.allSettled(
      aFichar.map((p: any) =>
        crearFichaje({
          id_persona: Number(p.id_persona),
          id_club: clubId,
          rol: rolNuevo,
          fecha_inicio: hoy(),
          creado_por: "admin",
        }).then(() => `${p.apellido}, ${p.nombre}`)
      )
    )
    setSaving(false)
    recargarFichajes()
    const ok = resultados
      .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
      .map(r => r.value)
    const errores = resultados
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r, i) => {
        const nombre = `${aFichar[i].apellido}, ${aFichar[i].nombre}`
        const detalle = r.reason?.response?.data?.detail || "Error desconocido"
        return `${nombre}: ${detalle}`
      })
    if (errores.length === 0) {
      cerrarModal()
    } else {
      setResultadoFichaje({ ok, errores })
    }
  }

  const abrirTransferir = (f: FichajeActivo) => {
    setFichajeSeleccionado(f)
    setRolTransfer(f.rol)
    setModal('transferir')
  }

  const abrirBaja = (f: FichajeActivo) => {
    setFichajeSeleccionado(f)
    setModal('baja')
  }

  const handleDarDeBaja = async () => {
    if (!fichajeSeleccionado) return
    setSaving(true)
    try {
      await darBajaFichaje(fichajeSeleccionado.id_fichaje_rol, {
        fecha_fin: fechaBaja,
        actualizado_por: "admin",
      })
      recargarFichajes()
      cerrarModal()
    } catch (e: any) {
      alert(e?.response?.data?.detail || "Error al dar de baja.")
    } finally {
      setSaving(false)
    }
  }

  const handleTransferir = async () => {
    if (!fichajeSeleccionado || !clubDestino) return
    setSaving(true)
    try {
      await darBajaFichaje(fichajeSeleccionado.id_fichaje_rol, {
        fecha_fin: fechaTransfer,
        actualizado_por: "admin",
      })
      await crearFichaje({
        id_persona: fichajeSeleccionado.id_persona,
        id_club: clubDestino,
        rol: rolTransfer,
        fecha_inicio: fechaTransfer,
      })
      recargarFichajes()
      cerrarModal()
    } catch (e: any) {
      alert(e?.response?.data?.detail || "Error al realizar el pase.")
    } finally {
      setSaving(false)
    }
  }

  const clubNombre = (id: number) => clubes.find(c => c.id_club === id)?.nombre ?? "—"

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Gestión de Fichajes</h1>
        <p className={styles.subtitle}>Alta, baja y pases entre clubes desde un solo lugar.</p>
      </header>

      <div className={styles.toolbar}>
        <select
          className={styles.clubSelect}
          value={clubId ?? ""}
          onChange={e => setClubId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Seleccionar club...</option>
          {clubes.map(c => (
            <option key={c.id_club} value={c.id_club}>{c.nombre}</option>
          ))}
        </select>

        <Button variant="primary" disabled={!clubId} onClick={() => setModal('nuevo')}>
          + Nuevo Fichaje
        </Button>
      </div>

      {clubId && (
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>
              Plantel actual — {clubNombre(clubId)}
              <span className={styles.count}>{fichajesFiltrados.length} fichados</span>
            </h2>
            <input
              className={styles.searchInput}
              placeholder="Buscar por nombre o DNI..."
              value={filtroPlantel}
              onChange={e => setFiltroPlantel(e.target.value)}
            />
          </div>

          {loadingFichajes ? (
            <p className={styles.msg}>Cargando...</p>
          ) : fichajesFiltrados.length === 0 ? (
            <p className={styles.msg}>
              {filtroPlantel ? "Sin resultados para la búsqueda." : "No hay personas fichadas activamente en este club."}
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Apellido</th>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Rol</th>
                  <th>Fichado desde</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {fichajesFiltrados.map(f => (
                  <tr key={f.id_fichaje_rol}>
                    <td>{f.persona_apellido}</td>
                    <td>{f.persona_nombre}</td>
                    <td>{f.persona_documento}</td>
                    <td><span className={styles.rolBadge}>{f.rol}</span></td>
                    <td>{f.fecha_inicio}</td>
                    <td className={styles.acciones}>
                      <button className={styles.btnTransfer} onClick={() => abrirTransferir(f)}>
                        Pase
                      </button>
                      <button className={styles.btnBaja} onClick={() => abrirBaja(f)}>
                        Dar de baja
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ======================== MODAL: Nuevo Fichaje (multi-select) ======================== */}
      {modal === 'nuevo' && (
        <div className={styles.overlay} onClick={cerrarModal}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Nuevo Fichaje</h2>
            <p className={styles.modalSub}>
              Club: <strong>{clubNombre(clubId!)}</strong>
            </p>

            {resultadoFichaje ? (
              <>
                <div className={styles.resultadoCarga}>
                  {resultadoFichaje.ok.length > 0 && (
                    <div className={styles.resultadoOk}>
                      <strong>✓ Fichados ({resultadoFichaje.ok.length})</strong>
                      <ul>{resultadoFichaje.ok.map(n => <li key={n}>{n}</li>)}</ul>
                    </div>
                  )}
                  {resultadoFichaje.errores.length > 0 && (
                    <div className={styles.resultadoError}>
                      <strong>✗ Fallaron ({resultadoFichaje.errores.length})</strong>
                      <ul>{resultadoFichaje.errores.map(e => <li key={e}>{e}</li>)}</ul>
                    </div>
                  )}
                </div>
                <div className={styles.modalFooter}>
                  <Button variant="outline" onClick={cerrarModal}>Cerrar</Button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.nuevoFilters}>
                  <select
                    className={styles.input}
                    value={rolNuevo}
                    onChange={e => { setRolNuevo(e.target.value); setSeleccionados(new Set()) }}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input
                    className={styles.input}
                    placeholder="Filtrar por nombre o DNI..."
                    value={busquedaNuevo}
                    onChange={e => setBusquedaNuevo(e.target.value)}
                  />
                </div>

                <div className={styles.scrollList}>
                  {loadingPersonas ? (
                    <p className={styles.msg}>Cargando...</p>
                  ) : personasFiltradas.length === 0 ? (
                    <p className={styles.msg}>Sin personas disponibles para este rol.</p>
                  ) : personasFiltradas.map((p: any) => {
                    const checked = seleccionados.has(p.id_persona)
                    return (
                      <label
                        key={p.id_persona}
                        className={`${styles.personaItem} ${checked ? styles.personaItemSelected : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSeleccionado(p.id_persona)}
                          className={styles.checkbox}
                        />
                        <div>
                          <span className={styles.personaNombre}>{p.apellido}, {p.nombre}</span>
                          <span className={styles.personaDni}>DNI: {p.documento}</span>
                        </div>
                      </label>
                    )
                  })}
                </div>

                <div className={styles.modalFooter}>
                  <Button variant="outline" onClick={cerrarModal}>Cancelar</Button>
                  <Button
                    variant="primary"
                    onClick={handleFicharSeleccionados}
                    disabled={seleccionados.size === 0 || saving}
                  >
                    {saving ? "Guardando..." : `Fichar seleccionados (${seleccionados.size})`}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ======================== MODAL: Dar de Baja ======================== */}
      {modal === 'baja' && fichajeSeleccionado && (
        <div className={styles.overlay} onClick={cerrarModal}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Dar de Baja</h2>
            <div className={styles.fichajeResumen}>
              <p><strong>{fichajeSeleccionado.persona_apellido}, {fichajeSeleccionado.persona_nombre}</strong></p>
              <p>DNI {fichajeSeleccionado.persona_documento} — <span className={styles.rolBadge}>{fichajeSeleccionado.rol}</span></p>
              <p className={styles.fichajeDesde}>Fichado desde: {fichajeSeleccionado.fecha_inicio}</p>
            </div>

            <label className={styles.label}>Fecha de baja</label>
            <input
              className={styles.input}
              type="date"
              value={fechaBaja}
              onChange={e => setFechaBaja(e.target.value)}
            />

            <div className={styles.modalFooter}>
              <Button variant="outline" onClick={cerrarModal}>Cancelar</Button>
              <Button variant="primary" onClick={handleDarDeBaja} disabled={saving}>
                {saving ? "Procesando..." : "Confirmar Baja"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================== MODAL: Pase de Club ======================== */}
      {modal === 'transferir' && fichajeSeleccionado && (
        <div className={styles.overlay} onClick={cerrarModal}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Pase de Club</h2>

            <div className={styles.fichajeResumen}>
              <p><strong>{fichajeSeleccionado.persona_apellido}, {fichajeSeleccionado.persona_nombre}</strong></p>
              <p>DNI {fichajeSeleccionado.persona_documento}</p>
            </div>

            <div className={styles.transferRow}>
              <div className={styles.transferBloque}>
                <span className={styles.transferLabel}>Sale de</span>
                <strong className={styles.transferClub}>{clubNombre(fichajeSeleccionado.id_club)}</strong>
              </div>
              <span className={styles.transferArrow}>→</span>
              <div className={styles.transferBloque}>
                <span className={styles.transferLabel}>Ingresa a</span>
                <select
                  className={styles.input}
                  value={clubDestino ?? ""}
                  onChange={e => setClubDestino(Number(e.target.value))}
                >
                  <option value="">Club destino...</option>
                  {clubes
                    .filter(c => c.id_club !== fichajeSeleccionado.id_club)
                    .map(c => (
                      <option key={c.id_club} value={c.id_club}>{c.nombre}</option>
                    ))}
                </select>
              </div>
            </div>

            <label className={styles.label}>Rol en el nuevo club</label>
            <select className={styles.input} value={rolTransfer} onChange={e => setRolTransfer(e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <label className={styles.label}>Fecha del pase</label>
            <input
              className={styles.input}
              type="date"
              value={fechaTransfer}
              onChange={e => setFechaTransfer(e.target.value)}
            />

            <p className={styles.transferNote}>
              Se cerrará el fichaje en <strong>{clubNombre(fichajeSeleccionado.id_club)}</strong> y se abrirá uno nuevo en el club destino con la misma fecha.
            </p>

            <div className={styles.modalFooter}>
              <Button variant="outline" onClick={cerrarModal}>Cancelar</Button>
              <Button
                variant="primary"
                onClick={handleTransferir}
                disabled={!clubDestino || saving}
              >
                {saving ? "Procesando..." : "Confirmar Pase"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
