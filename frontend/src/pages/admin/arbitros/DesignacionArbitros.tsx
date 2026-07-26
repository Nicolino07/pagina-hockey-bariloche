/**
 * DesignacionArbitros.tsx
 * Pantalla del admin de árbitros. Lista los partidos en estado BORRADOR/PENDIENTE
 * y permite designar árbitro 1 y árbitro 2 sobre cada uno, respetando las reglas
 * de club propio y torneo propio (validadas en backend y DB).
 */
import { useEffect, useMemo, useState } from "react"
import {
  getPartidosDesignables,
  getArbitrosDisponibles,
  designarArbitros,
  type PartidoDesignable,
  type ArbitroDisponible,
} from "../../../api/arbitros.api"
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

export default function DesignacionArbitros() {
  const [partidos, setPartidos] = useState<PartidoDesignable[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroTorneo, setFiltroTorneo] = useState<string>("")
  const [expandido, setExpandido] = useState<number | null>(null)

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

  const partidosFiltrados = filtroTorneo
    ? partidos.filter((p) => String(p.id_torneo) === filtroTorneo)
    : partidos

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Designación de árbitros</h1>
        <p className={styles.subtitle}>
          Asigná los árbitros a los partidos pendientes o en borrador.
        </p>
      </header>

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
        <button className={styles.btnSecundario} onClick={cargarPartidos}>
          ↻ Recargar
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {cargando && <p className={styles.muted}>Cargando partidos…</p>}

      {!cargando && partidosFiltrados.length === 0 && (
        <p className={styles.muted}>
          No hay partidos pendientes ni en borrador para designar.
        </p>
      )}

      <div className={styles.lista}>
        {partidosFiltrados.map((p) => (
          <PartidoRow
            key={p.id_partido}
            partido={p}
            abierto={expandido === p.id_partido}
            onToggle={() =>
              setExpandido(expandido === p.id_partido ? null : p.id_partido)
            }
            onGuardado={cargarPartidos}
          />
        ))}
      </div>
    </div>
  )
}

function PartidoRow({
  partido,
  abierto,
  onToggle,
  onGuardado,
}: {
  partido: PartidoDesignable
  abierto: boolean
  onToggle: () => void
  onGuardado: () => void
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHead} onClick={onToggle}>
        <div className={styles.cardInfo}>
          <span className={styles.fecha}>
            {partido.numero_fecha != null ? `Fecha ${partido.numero_fecha} · ` : ""}
            {partido.fecha ?? "Sin fecha"}
            {partido.horario ? ` · ${partido.horario.slice(0, 5)}` : ""}
          </span>
          <span className={styles.equipos}>
            {partido.equipo_local} <span className={styles.vs}>vs</span>{" "}
            {partido.equipo_visitante}
          </span>
          <span className={styles.torneo}>
            {etiquetaTorneo(partido)}
            <span className={styles.badgeEstado}>{partido.estado_partido}</span>
          </span>
        </div>
        <div className={styles.arbitrosActuales}>
          {partido.nombre_arbitro1 || partido.nombre_arbitro2 ? (
            <>
              <span>👤 {partido.nombre_arbitro1 ?? "—"}</span>
              <span>👤 {partido.nombre_arbitro2 ?? "—"}</span>
            </>
          ) : (
            <span className={styles.sinArbitros}>Sin árbitros</span>
          )}
          <span className={styles.chevron}>{abierto ? "▲" : "▼"}</span>
        </div>
      </div>

      {abierto && <EditorArbitros partido={partido} onGuardado={onGuardado} />}
    </div>
  )
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

  const opciones = (excluir: number | null) =>
    arbitros.map((a) => {
      const nombre = `${a.apellido}, ${a.nombre}`
      const noDisponible = !a.disponible
      const yaElegido = excluir != null && a.id_persona === excluir
      return (
        <option
          key={a.id_persona}
          value={a.id_persona}
          disabled={noDisponible || yaElegido}
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
      await designarArbitros(partido.id_partido, arbitro1, arbitro2)
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
                onChange={(e) =>
                  setArbitro1(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">— Sin designar —</option>
                {opciones(arbitro2)}
              </select>
            </div>
            <div>
              <label className={styles.label}>Árbitro 2</label>
              <select
                className={styles.select}
                value={arbitro2 ?? ""}
                onChange={(e) =>
                  setArbitro2(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">— Sin designar —</option>
                {opciones(arbitro1)}
              </select>
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
    </div>
  )
}
