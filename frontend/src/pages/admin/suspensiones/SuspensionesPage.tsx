// frontend/src/pages/admin/suspensiones/SuspensionesPage.tsx
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Button from "../../../components/ui/button/Button"
import { useTorneosActivos } from "../../../hooks/useTorneosActivos"
import { getPersonas } from "../../../api/personas.api"
import { listarSuspensiones, crearSuspensionManual, anularSuspension } from "../../../api/suspensiones.api"
import type { Persona } from "../../../types/persona"
import type { Suspension } from "../../../types/suspension"
import { TIPOS_SUSPENSION } from "../../../constants/enums"
import styles from "./SuspensionesPage.module.css"

const ESTADO_CLASE: Record<string, string> = {
  ACTIVA: styles.estadoActiva,
  CUMPLIDA: styles.estadoCumplida,
  ANULADA: styles.estadoAnulada,
}

export default function SuspensionesPage() {
  const navigate = useNavigate()
  const { torneos } = useTorneosActivos()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [suspensiones, setSuspensiones] = useState<Suspension[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filtroTorneo, setFiltroTorneo] = useState<string>("")
  const [filtroEstado, setFiltroEstado] = useState<string>("")

  const [form, setForm] = useState({
    id_persona: "",
    id_torneo: "",
    tipo_suspension: "POR_PARTIDOS" as (typeof TIPOS_SUSPENSION)[number],
    fechas_suspension: "1",
    fecha_fin_suspension: "",
    motivo: "",
  })

  const [personaSeleccionada, setPersonaSeleccionada] = useState<Persona | null>(null)
  const [busquedaPersona, setBusquedaPersona] = useState("")

  const resultadosBusqueda = busquedaPersona.trim().length < 2
    ? []
    : personas.filter(p => {
        const q = busquedaPersona.trim().toLowerCase()
        return (
          p.nombre.toLowerCase().includes(q) ||
          p.apellido.toLowerCase().includes(q) ||
          `${p.apellido} ${p.nombre}`.toLowerCase().includes(q) ||
          String(p.documento || "").includes(q)
        )
      }).slice(0, 8)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listarSuspensiones({
        id_torneo: filtroTorneo ? Number(filtroTorneo) : undefined,
        estado_suspension: filtroEstado || undefined,
      })
      setSuspensiones(data)
    } finally {
      setLoading(false)
    }
  }, [filtroTorneo, filtroEstado])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { getPersonas().then(setPersonas).catch(() => setPersonas([])) }, [])

  const nombrePersona = (id: number) => {
    const p = personas.find(p => p.id_persona === id)
    return p ? `${p.apellido}, ${p.nombre}` : `#${id}`
  }
  const nombreTorneo = (id?: number | null) => {
    if (!id) return "— Sin torneo de origen —"
    return torneos.find(t => t.id_torneo === id)?.nombre || `#${id}`
  }

  const seleccionarPersona = (p: Persona) => {
    setPersonaSeleccionada(p)
    setForm({ ...form, id_persona: String(p.id_persona) })
    setBusquedaPersona("")
  }

  const handleCrear = async () => {
    setError(null)
    try {
      await crearSuspensionManual({
        id_persona: Number(form.id_persona),
        id_torneo: form.id_torneo ? Number(form.id_torneo) : null,
        tipo_suspension: form.tipo_suspension,
        motivo: form.motivo,
        fechas_suspension: form.tipo_suspension === "POR_PARTIDOS" ? Number(form.fechas_suspension) : null,
        fecha_fin_suspension: form.tipo_suspension === "POR_FECHA" ? form.fecha_fin_suspension : null,
      })
      setMostrarForm(false)
      setForm({ id_persona: "", id_torneo: "", tipo_suspension: "POR_PARTIDOS", fechas_suspension: "1", fecha_fin_suspension: "", motivo: "" })
      setPersonaSeleccionada(null)
      setBusquedaPersona("")
      cargar()
    } catch (e: any) {
      setError(e.message || "Error al crear la suspensión")
    }
  }

  const handleAnular = async (s: Suspension) => {
    const motivo = window.prompt("Motivo de la anulación:")
    if (!motivo) return
    await anularSuspension(s.id_suspension, motivo)
    cargar()
  }

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.title}>Suspensiones</h2>
        <div className={styles.botones}>
          <Button onClick={() => setMostrarForm(v => !v)}>
            {mostrarForm ? "Cancelar" : "➕ Suspensión manual"}
          </Button>
          <Button onClick={() => navigate("/admin")}>← Volver</Button>
        </div>
      </header>

      {mostrarForm && (
        <div className={styles.form}>
          <div className={styles.formFull} style={{ position: "relative" }}>
            <span className={styles.fieldLabel}>Persona</span>
            {personaSeleccionada ? (
              <div className={styles.personaSeleccionada}>
                <span>{personaSeleccionada.apellido}, {personaSeleccionada.nombre}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setPersonaSeleccionada(null); setForm({ ...form, id_persona: "" }) }}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Buscar por apellido, nombre o documento…"
                  value={busquedaPersona}
                  onChange={e => setBusquedaPersona(e.target.value)}
                />
                {resultadosBusqueda.length > 0 && (
                  <ul className={styles.resultadosBusqueda}>
                    {resultadosBusqueda.map(p => (
                      <li
                        key={p.id_persona}
                        // onMouseDown (no onClick): dispara antes de que el input
                        // pierda foco, evitando que la lista se desmonte antes de
                        // registrar la selección.
                        onMouseDown={e => { e.preventDefault(); seleccionarPersona(p) }}
                      >
                        {p.apellido}, {p.nombre}{p.documento ? ` — ${p.documento}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
          <label>
            Torneo de origen (opcional)
            <select value={form.id_torneo} onChange={e => setForm({ ...form, id_torneo: e.target.value })}>
              <option value="">— Sin torneo (sanción general) —</option>
              {torneos.map(t => (
                <option key={t.id_torneo} value={t.id_torneo}>{t.nombre}</option>
              ))}
            </select>
          </label>
          <label>
            Tipo
            <select value={form.tipo_suspension} onChange={e => setForm({ ...form, tipo_suspension: e.target.value as any })}>
              {TIPOS_SUSPENSION.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
            </select>
          </label>
          {form.tipo_suspension === "POR_PARTIDOS" ? (
            <label>
              Cantidad de fechas
              <input
                type="number"
                min={1}
                value={form.fechas_suspension}
                onChange={e => setForm({ ...form, fechas_suspension: e.target.value })}
              />
            </label>
          ) : (
            <label>
              Suspendido hasta
              <input
                type="date"
                value={form.fecha_fin_suspension}
                onChange={e => setForm({ ...form, fecha_fin_suspension: e.target.value })}
              />
            </label>
          )}
          <label className={styles.formFull}>
            Motivo
            <textarea
              rows={2}
              value={form.motivo}
              onChange={e => setForm({ ...form, motivo: e.target.value })}
            />
          </label>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.formActions}>
            <Button
              onClick={handleCrear}
              disabled={!form.id_persona || !form.motivo}
            >
              Guardar
            </Button>
          </div>
        </div>
      )}

      <div className={styles.filtros}>
        <select value={filtroTorneo} onChange={e => setFiltroTorneo(e.target.value)}>
          <option value="">Todos los torneos</option>
          {torneos.map(t => (
            <option key={t.id_torneo} value={t.id_torneo}>{t.nombre}</option>
          ))}
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="ACTIVA">Activa</option>
          <option value="CUMPLIDA">Cumplida</option>
          <option value="ANULADA">Anulada</option>
        </select>
      </div>

      {loading ? (
        <p>Cargando suspensiones…</p>
      ) : suspensiones.length === 0 ? (
        <p>No hay suspensiones para este filtro.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Persona</th>
                <th>Torneo</th>
                <th>Origen</th>
                <th>Tipo</th>
                <th>Fechas</th>
                <th>Estado</th>
                <th>Motivo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {suspensiones.map(s => (
                <tr key={s.id_suspension}>
                  <td>{nombrePersona(s.id_persona)}</td>
                  <td>{nombreTorneo(s.id_torneo)}</td>
                  <td>{s.origen}</td>
                  <td>{s.tipo_suspension}</td>
                  <td>
                    {s.tipo_suspension === "POR_PARTIDOS"
                      ? `${s.cumplidas}/${s.fechas_suspension}`
                      : `hasta ${s.fecha_fin_suspension}`}
                  </td>
                  <td className={ESTADO_CLASE[s.estado_suspension]}>{s.estado_suspension}</td>
                  <td>{s.motivo}</td>
                  <td>
                    {s.estado_suspension === "ACTIVA" && (
                      <Button variant="secondary" onClick={() => handleAnular(s)}>Anular</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
