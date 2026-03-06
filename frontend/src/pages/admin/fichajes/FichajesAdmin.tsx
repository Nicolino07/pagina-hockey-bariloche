import { useState, useEffect, useMemo } from "react"
import { getClubes } from "../../../api/clubes.api"
import { getFichajesPorClub, crearFichaje, darBajaFichaje } from "../../../api/fichajes.api"
import { getPersonas } from "../../../api/personas.api"
import type { Club } from "../../../types/club"
import type { Persona } from "../../../types/persona"
import Button from "../../../components/ui/button/Button"
import styles from "./FichajesAdmin.module.css"

const ROLES = [
  'JUGADOR', 'DT', 'ARBITRO',
  'DELEGADO', 'ASISTENTE', 'MEDICO', 'PREPARADOR_FISICO'
]

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

type ModalTipo = 'nuevo' | 'baja' | 'transferir' | null

const hoy = () => new Date().toISOString().split("T")[0]

export default function FichajesAdmin() {
  const [clubes, setClubes] = useState<Club[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [fichajes, setFichajes] = useState<FichajeActivo[]>([])
  const [clubId, setClubId] = useState<number | null>(null)
  const [loadingFichajes, setLoadingFichajes] = useState(false)
  const [saving, setSaving] = useState(false)

  const [modal, setModal] = useState<ModalTipo>(null)
  const [fichajeSeleccionado, setFichajeSeleccionado] = useState<FichajeActivo | null>(null)

  // --- Estado modal Nuevo Fichaje ---
  const [busqueda, setBusqueda] = useState("")
  const [personaSeleccionada, setPersonaSeleccionada] = useState<Persona | null>(null)
  const [rolNuevo, setRolNuevo] = useState("JUGADOR")
  const [fechaInicio, setFechaInicio] = useState(hoy())

  // --- Estado modal Dar de Baja ---
  const [fechaBaja, setFechaBaja] = useState(hoy())

  // --- Estado modal Transferir ---
  const [clubDestino, setClubDestino] = useState<number | null>(null)
  const [rolTransfer, setRolTransfer] = useState("JUGADOR")
  const [fechaTransfer, setFechaTransfer] = useState(hoy())

  useEffect(() => {
    Promise.all([getClubes(), getPersonas()]).then(([c, p]) => {
      setClubes(c)
      setPersonas(p)
    })
  }, [])

  useEffect(() => {
    if (!clubId) { setFichajes([]); return }
    setLoadingFichajes(true)
    getFichajesPorClub(clubId, true)
      .then(setFichajes)
      .catch(console.error)
      .finally(() => setLoadingFichajes(false))
  }, [clubId])

  const personasFiltradas = useMemo(() =>
    busqueda.length >= 2
      ? personas.filter(p =>
          `${p.apellido} ${p.nombre}`.toLowerCase().includes(busqueda.toLowerCase()) ||
          String(p.documento).includes(busqueda)
        ).slice(0, 8)
      : [],
    [busqueda, personas]
  )

  const recargarFichajes = () => {
    if (!clubId) return
    getFichajesPorClub(clubId, true).then(setFichajes).catch(console.error)
  }

  const cerrarModal = () => {
    setModal(null)
    setFichajeSeleccionado(null)
    setBusqueda("")
    setPersonaSeleccionada(null)
    setRolNuevo("JUGADOR")
    setFechaInicio(hoy())
    setFechaBaja(hoy())
    setClubDestino(null)
    setRolTransfer("JUGADOR")
    setFechaTransfer(hoy())
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

  const handleNuevoFichaje = async () => {
    if (!personaSeleccionada || !clubId) return
    setSaving(true)
    try {
      await crearFichaje({
        id_persona: personaSeleccionada.id_persona,
        id_club: clubId,
        rol: rolNuevo,
        fecha_inicio: fechaInicio,
      })
      recargarFichajes()
      cerrarModal()
    } catch (e: any) {
      alert(e?.response?.data?.detail || "Error al crear el fichaje.")
    } finally {
      setSaving(false)
    }
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
      // Transacción: baja del club actual → alta en el club destino
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

      {/* Toolbar: selector de club + botón */}
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

      {/* Tabla de fichados activos */}
      {clubId && (
        <div className={styles.tableWrapper}>
          <h2 className={styles.tableTitle}>
            Plantel actual — {clubNombre(clubId)}
            <span className={styles.count}>{fichajes.length} fichados</span>
          </h2>

          {loadingFichajes ? (
            <p className={styles.msg}>Cargando...</p>
          ) : fichajes.length === 0 ? (
            <p className={styles.msg}>No hay personas fichadas activamente en este club.</p>
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
                {fichajes.map(f => (
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

      {/* ======================== MODAL: Nuevo Fichaje ======================== */}
      {modal === 'nuevo' && (
        <div className={styles.overlay} onClick={cerrarModal}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Nuevo Fichaje</h2>
            <p className={styles.modalSub}>
              Club destino: <strong>{clubNombre(clubId!)}</strong>
            </p>

            <label className={styles.label}>Buscar persona (nombre o DNI)</label>
            <input
              className={styles.input}
              placeholder="Ej: Garcia o 12345678"
              value={busqueda}
              onChange={e => {
                setBusqueda(e.target.value)
                setPersonaSeleccionada(null)
              }}
              autoFocus
            />
            {personasFiltradas.length > 0 && !personaSeleccionada && (
              <ul className={styles.suggestions}>
                {personasFiltradas.map(p => (
                  <li
                    key={p.id_persona}
                    onClick={() => {
                      setPersonaSeleccionada(p)
                      setBusqueda(`${p.apellido}, ${p.nombre}`)
                    }}
                  >
                    <span className={styles.suggestNombre}>{p.apellido}, {p.nombre}</span>
                    <span className={styles.suggestDoc}>DNI {p.documento}</span>
                  </li>
                ))}
              </ul>
            )}

            <label className={styles.label}>Rol en el club</label>
            <select className={styles.input} value={rolNuevo} onChange={e => setRolNuevo(e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <label className={styles.label}>Fecha de inicio</label>
            <input
              className={styles.input}
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
            />

            <div className={styles.modalFooter}>
              <Button variant="outline" onClick={cerrarModal}>Cancelar</Button>
              <Button
                variant="primary"
                onClick={handleNuevoFichaje}
                disabled={!personaSeleccionada || saving}
              >
                {saving ? "Guardando..." : "Confirmar Fichaje"}
              </Button>
            </div>
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
