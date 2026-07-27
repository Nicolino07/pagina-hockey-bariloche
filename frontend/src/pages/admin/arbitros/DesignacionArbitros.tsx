/**
 * DesignacionArbitros.tsx
 * Pantalla del admin de árbitros. Lista los partidos en estado BORRADOR/PENDIENTE
 * y permite designar árbitro 1 y árbitro 2 sobre cada uno, respetando las reglas
 * de club propio y torneo propio (validadas en backend y DB).
 */
import { Fragment, useEffect, useMemo, useState } from "react"
import {
  getPartidosDesignables,
  getArbitrosDisponibles,
  designarArbitros,
  type PartidoDesignable,
  type ArbitroDisponible,
} from "../../../api/arbitros.api"
import Modal from "../../../components/ui/modal/Modal"
import styles from "./DesignacionArbitros.module.css"

const CATEGORIA_LABEL: Record<string, string> = {
  MAYORES: "Mayores",
  SUB_19: "Sub-19",
  SUB_16: "Sub-16",
  SUB_14: "Sub-14",
  SUB_12: "Sub-12",
}

const GENERO_LABEL: Record<string, string> = {
  MASCULINO: "Masculino",
  FEMENINO: "Femenino",
  MIXTO: "Mixto",
}

/** Arma una etiqueta clara del torneo: nombre + categoría + género + división. */
function etiquetaTorneo(p: PartidoDesignable): string {
  const partes = [
    p.nombre_torneo ?? `Torneo ${p.id_torneo}`,
    p.categoria_torneo ? CATEGORIA_LABEL[p.categoria_torneo] ?? p.categoria_torneo : null,
    p.genero_torneo ? GENERO_LABEL[p.genero_torneo] ?? p.genero_torneo : null,
    p.division_torneo ? `División ${p.division_torneo}` : null,
  ].filter(Boolean)
  return partes.join(" · ")
}

const MES_LABEL = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
]

/** Formatea "2026-07-07" como "7-jul-26". */
function formatearFecha(fecha: string | null): string {
  if (!fecha) return "—"
  const [anio, mes, dia] = fecha.split("-")
  const mesIdx = Number(mes) - 1
  if (!anio || mesIdx < 0 || mesIdx > 11 || !dia) return fecha
  return `${Number(dia)}-${MES_LABEL[mesIdx]}-${anio.slice(2)}`
}

/** True si el texto de búsqueda matchea alguno de los árbitros del partido. */
function coincideArbitro(p: PartidoDesignable, busqueda: string): boolean {
  const texto = busqueda.trim().toLowerCase()
  if (!texto) return true
  return [p.nombre_arbitro1, p.nombre_arbitro2].some((n) =>
    n?.toLowerCase().includes(texto)
  )
}

type CampoOrden = "numero_fecha" | "fecha"

interface Orden {
  campo: CampoOrden
  direccion: "asc" | "desc"
}

/** Orden por defecto: igual al que ya trae el backend (día y horario). */
function ordenarPartidos(
  partidos: PartidoDesignable[],
  orden: Orden | null
): PartidoDesignable[] {
  if (!orden) return partidos
  const { campo, direccion } = orden
  const signo = direccion === "asc" ? 1 : -1
  return [...partidos].sort((a, b) => {
    const va = a[campo]
    const vb = b[campo]
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    if (va < vb) return -1 * signo
    if (va > vb) return 1 * signo
    return 0
  })
}

/** Encabezado de columna ordenable, con flecha de dirección. */
function EncabezadoOrden({
  label,
  campo,
  orden,
  onOrdenar,
}: {
  label: string
  campo: CampoOrden
  orden: Orden | null
  onOrdenar: (campo: CampoOrden) => void
}) {
  const activo = orden?.campo === campo
  const icono = activo ? (orden!.direccion === "asc" ? "▲" : "▼") : "⇅"
  return (
    <th className={styles.thOrden} onClick={() => onOrdenar(campo)}>
      {label} <span className={styles.iconoOrden}>{icono}</span>
    </th>
  )
}

type Tab = "designar" | "vigentes"

export default function DesignacionArbitros() {
  const [tab, setTab] = useState<Tab>("designar")
  const [partidos, setPartidos] = useState<PartidoDesignable[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroTorneo, setFiltroTorneo] = useState<string>("")
  const [filtroFecha, setFiltroFecha] = useState<string>("")
  const [filtroArbitro, setFiltroArbitro] = useState<string>("")
  const [expandido, setExpandido] = useState<number | null>(null)
  const [orden, setOrden] = useState<Orden | null>(null)

  const ordenar = (campo: CampoOrden) => {
    setOrden((actual) => {
      if (actual?.campo !== campo) return { campo, direccion: "asc" }
      return { campo, direccion: actual.direccion === "asc" ? "desc" : "asc" }
    })
  }

  const cargarPartidos = async () => {
    setCargando(true)
    setError(null)
    try {
      setPartidos(await getPartidosDesignables())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarPartidos()
  }, [])

  const torneos = useMemo(() => {
    const set = new Map<number, string>()
    partidos.forEach((p) => set.set(p.id_torneo, etiquetaTorneo(p)))
    return Array.from(set.entries())
  }, [partidos])

  const partidosFiltrados = ordenarPartidos(
    partidos
      .filter((p) => !filtroTorneo || String(p.id_torneo) === filtroTorneo)
      .filter((p) => !filtroFecha || p.fecha === filtroFecha),
    orden
  )

  const partidosDesignados = partidosFiltrados
    .filter((p) => p.nombre_arbitro1 || p.nombre_arbitro2)
    .filter((p) => coincideArbitro(p, filtroArbitro))

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Designación de árbitros</h1>
        <p className={styles.subtitle}>
          Asigná los árbitros a los partidos pendientes o en borrador.
        </p>
      </header>

      <div className={styles.tabs}>
        <button
          className={tab === "designar" ? styles.tabActiva : styles.tab}
          onClick={() => setTab("designar")}
        >
          Designar
        </button>
        <button
          className={tab === "vigentes" ? styles.tabActiva : styles.tab}
          onClick={() => setTab("vigentes")}
        >
          Designaciones vigentes
        </button>
      </div>

      <div className={styles.selectorRow}>
        <div>
          <label className={styles.label}>Filtrar por torneo</label>
          <select
            className={styles.select}
            value={filtroTorneo}
            onChange={(e) => setFiltroTorneo(e.target.value)}
          >
            <option value="">Todos los torneos</option>
            {torneos.map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={styles.label}>Filtrar por día</label>
          <input
            type="date"
            className={styles.select}
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
          />
        </div>
        {tab === "vigentes" && (
          <div>
            <label className={styles.label}>Filtrar por árbitro</label>
            <input
              type="text"
              className={styles.select}
              placeholder="Nombre o apellido"
              value={filtroArbitro}
              onChange={(e) => setFiltroArbitro(e.target.value)}
            />
          </div>
        )}
        {(filtroTorneo || filtroFecha || filtroArbitro) && (
          <button
            className={styles.btnSecundario}
            onClick={() => {
              setFiltroTorneo("")
              setFiltroFecha("")
              setFiltroArbitro("")
            }}
          >
            ✕ Limpiar filtros
          </button>
        )}
        <button className={styles.btnSecundario} onClick={cargarPartidos}>
          ↻ Recargar
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {cargando && <p className={styles.muted}>Cargando partidos…</p>}

      {!cargando && tab === "designar" && partidosFiltrados.length === 0 && (
        <p className={styles.muted}>
          No hay partidos pendientes ni en borrador para designar.
        </p>
      )}

      {!cargando && tab === "vigentes" && partidosDesignados.length === 0 && (
        <p className={styles.muted}>Todavía no hay árbitros designados.</p>
      )}

      {tab === "designar" ? (
        !cargando &&
        partidosFiltrados.length > 0 && (
          <CuadroDesignar
            partidos={partidosFiltrados}
            expandido={expandido}
            onToggle={(id) => setExpandido(expandido === id ? null : id)}
            onGuardado={cargarPartidos}
            orden={orden}
            onOrdenar={ordenar}
          />
        )
      ) : (
        !cargando &&
        partidosDesignados.length > 0 && (
          <CuadroVigentes
            partidos={partidosDesignados}
            orden={orden}
            onOrdenar={ordenar}
          />
        )
      )}
    </div>
  )
}

/**
 * Cuadro de designaciones vigentes: partidos en BORRADOR/PENDIENTE (los únicos
 * que trae `getPartidosDesignables`), ordenados por día y horario tal como
 * llegan del backend. Deja de estar vigente en cuanto el partido se juega,
 * se suspende o se reprograma, porque en ese momento sale de ese listado.
 */
function CuadroVigentes({
  partidos,
  orden,
  onOrdenar,
}: {
  partidos: PartidoDesignable[]
  orden: Orden | null
  onOrdenar: (campo: CampoOrden) => void
}) {
  return (
    <div className={styles.tablaWrap}>
      <table className={styles.tabla}>
        <thead>
          <tr>
            <EncabezadoOrden
              label="N° Fecha"
              campo="numero_fecha"
              orden={orden}
              onOrdenar={onOrdenar}
            />
            <EncabezadoOrden
              label="Día"
              campo="fecha"
              orden={orden}
              onOrdenar={onOrdenar}
            />
            <th>Hora</th>
            <th>Ubicación</th>
            <th>Árbitro 1</th>
            <th>Árbitro 2</th>
            <th>Torneo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {partidos.map((p) => (
            <tr key={p.id_partido}>
              <td>{p.numero_fecha ?? "—"}</td>
              <td>{formatearFecha(p.fecha)}</td>
              <td>{p.horario ? p.horario.slice(0, 5) : "—"}</td>
              <td>{p.ubicacion ?? "—"}</td>
              <td className={p.nombre_arbitro1 ? undefined : styles.sinArbitros}>
                {p.nombre_arbitro1 ?? "Sin designar"}
              </td>
              <td className={p.nombre_arbitro2 ? undefined : styles.sinArbitros}>
                {p.nombre_arbitro2 ?? "Sin designar"}
              </td>
              <td>{etiquetaTorneo(p)}</td>
              <td>
                <span className={styles.badgeEstado}>{p.estado_partido}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Cuadro de la pestaña "Designar": mismo estilo de tabla que las
 * designaciones vigentes, pero cada fila es clickeable y despliega el
 * editor de árbitro 1/2 debajo.
 */
function CuadroDesignar({
  partidos,
  expandido,
  onToggle,
  onGuardado,
  orden,
  onOrdenar,
}: {
  partidos: PartidoDesignable[]
  expandido: number | null
  onToggle: (idPartido: number) => void
  onGuardado: () => void
  orden: Orden | null
  onOrdenar: (campo: CampoOrden) => void
}) {
  return (
    <div className={styles.tablaWrap}>
      <table className={styles.tabla}>
        <thead>
          <tr>
            <EncabezadoOrden
              label="N° Fecha"
              campo="numero_fecha"
              orden={orden}
              onOrdenar={onOrdenar}
            />
            <EncabezadoOrden
              label="Día"
              campo="fecha"
              orden={orden}
              onOrdenar={onOrdenar}
            />
            <th>Hora</th>
            <th>Ubicación</th>
            <th>Árbitro 1</th>
            <th>Árbitro 2</th>
            <th>Torneo</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {partidos.map((p) => {
            const abierto = expandido === p.id_partido
            return (
              <Fragment key={p.id_partido}>
                <tr
                  className={styles.filaClickeable}
                  onClick={() => onToggle(p.id_partido)}
                >
                  <td>{p.numero_fecha ?? "—"}</td>
                  <td>{formatearFecha(p.fecha)}</td>
                  <td>{p.horario ? p.horario.slice(0, 5) : "—"}</td>
                  <td>{p.ubicacion ?? "—"}</td>
                  <td className={p.nombre_arbitro1 ? undefined : styles.sinArbitros}>
                    {p.nombre_arbitro1 ?? "Sin designar"}
                  </td>
                  <td className={p.nombre_arbitro2 ? undefined : styles.sinArbitros}>
                    {p.nombre_arbitro2 ?? "Sin designar"}
                  </td>
                  <td>{etiquetaTorneo(p)}</td>
                  <td>
                    <span className={styles.badgeEstado}>{p.estado_partido}</span>
                  </td>
                  <td className={styles.chevron}>{abierto ? "▲" : "▼"}</td>
                </tr>
                {abierto && (
                  <tr>
                    <td colSpan={9} className={styles.celdaEditor}>
                      <EditorArbitros partido={p} onGuardado={onGuardado} />
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

type Slot = 1 | 2

interface PendienteConfirmacion {
  slot: Slot
  idPersona: number
  nombre: string
  motivo: string | null
}

function EditorArbitros({
  partido,
  onGuardado,
}: {
  partido: PartidoDesignable
  onGuardado: () => void
}) {
  const [arbitros, setArbitros] = useState<ArbitroDisponible[]>([])
  const [arbitro1, setArbitro1] = useState<number | null>(partido.id_arbitro1)
  const [arbitro2, setArbitro2] = useState<number | null>(partido.id_arbitro2)
  const [forzado1, setForzado1] = useState(false)
  const [forzado2, setForzado2] = useState(false)
  const [pendiente, setPendiente] = useState<PendienteConfirmacion | null>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    let activo = true
    setCargando(true)
    getArbitrosDisponibles(partido.id_partido)
      .then((data) => activo && setArbitros(data))
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false))
    return () => {
      activo = false
    }
  }, [partido.id_partido])

  const setSlot = (slot: Slot, idPersona: number | null, forzado: boolean) => {
    if (slot === 1) {
      setArbitro1(idPersona)
      setForzado1(forzado)
    } else {
      setArbitro2(idPersona)
      setForzado2(forzado)
    }
  }

  const elegir = (slot: Slot, valor: string) => {
    if (!valor) {
      setSlot(slot, null, false)
      return
    }
    const idPersona = Number(valor)
    const arbitro = arbitros.find((a) => a.id_persona === idPersona)
    if (arbitro && !arbitro.disponible) {
      setPendiente({
        slot,
        idPersona,
        nombre: `${arbitro.apellido}, ${arbitro.nombre}`,
        motivo: arbitro.motivo,
      })
      return
    }
    setSlot(slot, idPersona, false)
  }

  const confirmarPendiente = () => {
    if (!pendiente) return
    setSlot(pendiente.slot, pendiente.idPersona, true)
    setPendiente(null)
  }

  const opciones = (excluir: number | null) =>
    arbitros.map((a) => {
      const nombre = `${a.apellido}, ${a.nombre}`
      const noDisponible = !a.disponible
      const yaElegido = excluir != null && a.id_persona === excluir
      return (
        <option
          key={a.id_persona}
          value={a.id_persona}
          disabled={yaElegido}
          className={noDisponible ? styles.optionNoDisponible : undefined}
          style={noDisponible ? { color: "#f28b82" } : undefined}
        >
          {nombre}
          {noDisponible ? ` — ${a.motivo}` : ""}
          {yaElegido ? " (ya asignado como el otro árbitro)" : ""}
        </option>
      )
    })

  const guardar = async () => {
    setGuardando(true)
    setError(null)
    setOk(false)
    try {
      await designarArbitros(
        partido.id_partido,
        arbitro1,
        arbitro2,
        forzado1 || forzado2
      )
      setOk(true)
      onGuardado()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className={styles.editor}>
      <div className={styles.reglasBox}>
        <strong>Reglas de arbitraje aplicadas en este partido:</strong>
        <ul>
          <li>No puede arbitrar quien integra un plantel de este torneo (siempre).</li>
          {partido.es_competitiva ? (
            <li>
              No puede arbitrar quien tenga un rol activo en el club local o
              visitante (torneo con reglas de arbitraje).
            </li>
          ) : (
            <li>
              No se restringe por club propio: este torneo no aplica reglas de
              arbitraje (formativo).
            </li>
          )}
        </ul>
        <p className={styles.muted}>
          Los árbitros marcados en rojo no cumplen estas reglas. Se pueden
          igual asignar, previa confirmación.
        </p>
      </div>

      {cargando ? (
        <p className={styles.muted}>Cargando árbitros disponibles…</p>
      ) : (
        <>
          <div className={styles.selects}>
            <div>
              <label className={styles.label}>Árbitro 1</label>
              <select
                className={styles.select}
                value={arbitro1 ?? ""}
                onChange={(e) => elegir(1, e.target.value)}
              >
                <option value="">— Sin designar —</option>
                {opciones(arbitro2)}
              </select>
              {forzado1 && (
                <p className={styles.avisoForzado}>
                  ⚠ Asignado de todas formas (no cumple las reglas).
                </p>
              )}
            </div>
            <div>
              <label className={styles.label}>Árbitro 2</label>
              <select
                className={styles.select}
                value={arbitro2 ?? ""}
                onChange={(e) => elegir(2, e.target.value)}
              >
                <option value="">— Sin designar —</option>
                {opciones(arbitro1)}
              </select>
              {forzado2 && (
                <p className={styles.avisoForzado}>
                  ⚠ Asignado de todas formas (no cumple las reglas).
                </p>
              )}
            </div>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}
          {ok && <div className={styles.okBox}>Árbitros guardados ✔</div>}

          <div className={styles.acciones}>
            <button
              className={styles.btnPrimario}
              onClick={guardar}
              disabled={guardando}
            >
              {guardando ? "Guardando…" : "Guardar designación"}
            </button>
          </div>
        </>
      )}

      <Modal
        open={pendiente != null}
        title="Árbitro no designable"
        onClose={() => setPendiente(null)}
      >
        {pendiente && (
          <>
            <p>
              <strong>{pendiente.nombre}</strong> no cumple las reglas de
              arbitraje para este partido
              {pendiente.motivo ? `: ${pendiente.motivo}` : "."}
            </p>
            <p>¿Confirmás asignarlo de todas formas?</p>
            <div className={styles.acciones}>
              <button className={styles.btnPrimario} onClick={confirmarPendiente}>
                Asignar de todas formas
              </button>{" "}
              <button
                className={styles.btnSecundario}
                onClick={() => setPendiente(null)}
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
