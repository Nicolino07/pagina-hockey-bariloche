import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Button from "../../../components/ui/button/Button"
import { listarTorneos, crearTorneo, listarInscripcionesTorneo } from "../../../api/torneos.api"
import { generarPlayoff } from "../../../api/fixture.api"
import type { Torneo } from "../../../types/torneo"
import type { InscripcionTorneoDetalle } from "../../../types/inscripcion"
import type { TipoFormatoPlayoff, TipoAsignacion, TipoRondaInicial, DueloManual } from "../../../types/fixture"
import styles from "./TorneoDetalle.module.css"
import formStyles from "./CrearTorneoForm.module.css"

interface Props {
  /** Liga base desde la cual se lanza el playoff. */
  torneoBase: Torneo
}

/** Rondas iniciales ofrecidas en modo manual, con su cantidad de duelos. */
type RondaManual = "cuartos" | "semifinal" | "final"
const DUELOS_POR_RONDA: Record<RondaManual, number> = {
  cuartos: 4,
  semifinal: 2,
  final: 1,
}

const duelosVacios = (n: number): DueloManual[] =>
  Array.from({ length: n }, () => ({ id_equipo_local: 0, id_equipo_visitante: 0 }))

/**
 * Lanzador de playoff desde una liga base.
 * Crea un torneo hijo (tipo PLAYOFF, con torneo_base_id = la liga) y, según la
 * asignación elegida, genera el bracket automáticamente por tabla de posiciones
 * o delega los duelos manuales a la pestaña Fixture del playoff recién creado.
 */
export default function PlayoffLauncher({ torneoBase }: Props) {
  const navigate = useNavigate()
  const [playoffs, setPlayoffs] = useState<Torneo[]>([])
  const [inscripciones, setInscripciones] = useState<InscripcionTorneoDetalle[]>([])
  const [nombre, setNombre] = useState(`Playoff ${torneoBase.nombre}`)
  const [fechaInicio, setFechaInicio] = useState(() => new Date().toISOString().slice(0, 10))
  const [formato, setFormato] = useState<TipoFormatoPlayoff>("ida")
  const [asignacion, setAsignacion] = useState<TipoAsignacion>("automatico")
  const [rondaInicial, setRondaInicial] = useState<TipoRondaInicial | "">("")
  const [rondaManual, setRondaManual] = useState<RondaManual>("cuartos")
  const [duelosManual, setDuelosManual] = useState<DueloManual[]>(duelosVacios(DUELOS_POR_RONDA.cuartos))
  const [tercerPuesto, setTercerPuesto] = useState(false)
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listarTorneos(false)
      .then(ts => setPlayoffs(
        ts.filter(t => t.tipo === "PLAYOFF" && t.torneo_base_id === torneoBase.id_torneo)
      ))
      .catch(() => setPlayoffs([]))
    listarInscripcionesTorneo(torneoBase.id_torneo)
      .then(setInscripciones)
      .catch(() => setInscripciones([]))
  }, [torneoBase.id_torneo])

  /** Cambia la ronda inicial manual y reinicia los duelos al tamaño correspondiente. */
  const handleCambiarRondaManual = (ronda: RondaManual) => {
    setRondaManual(ronda)
    setDuelosManual(duelosVacios(DUELOS_POR_RONDA[ronda]))
    if (ronda === "final") setTercerPuesto(false)
  }

  const actualizarDueloManual = (idx: number, campo: keyof DueloManual, valor: number) => {
    setDuelosManual(prev => prev.map((d, i) => i === idx ? { ...d, [campo]: valor } : d))
  }

  /** Crea el playoff y genera el bracket (automático por tabla, o manual por duelos elegidos). */
  const handleCrear = async () => {
    if (!nombre.trim()) {
      setError("Poné un nombre para el playoff.")
      return
    }
    if (asignacion === "manual") {
      const invalidos = duelosManual.some(
        d => !d.id_equipo_local || !d.id_equipo_visitante || d.id_equipo_local === d.id_equipo_visitante
      )
      if (invalidos) {
        setError("Completá todos los duelos. Los equipos deben ser distintos.")
        return
      }
    }
    setCreando(true)
    setError(null)
    try {
      const nuevo = await crearTorneo({
        nombre: nombre.trim(),
        categoria: torneoBase.categoria,
        division: torneoBase.division ?? null,
        genero: torneoBase.genero,
        tipo: "PLAYOFF",
        fecha_inicio: fechaInicio,
        es_competitiva: torneoBase.es_competitiva,
        torneo_base_id: torneoBase.id_torneo,
      })
      // El torneo ya existe; si la generación del bracket falla (ej. equipos
      // impares en modo automático), navegamos igual para resolverlo en su Fixture.
      try {
        if (asignacion === "automatico") {
          await generarPlayoff(nuevo.id_torneo, formato, "automatico", undefined, rondaInicial || null, tercerPuesto)
        } else {
          await generarPlayoff(nuevo.id_torneo, formato, "manual", duelosManual, null, tercerPuesto)
        }
      } catch (e) {
        console.error("No se pudo generar el bracket:", e)
      }
      navigate(`/admin/torneos/${nuevo.id_torneo}`)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.response?.data?.message ?? "Error al crear el playoff.")
      setCreando(false)
    }
  }

  return (
    <>
      {/* PLAYOFFS EXISTENTES */}
      {playoffs.length > 0 && (
        <div className={styles.tableCard}>
          <h3 className={styles.statsTitle}>Playoffs de este torneo</h3>
          <ul className={styles.playoffList}>
            {playoffs.map(p => (
              <li key={p.id_torneo} className={styles.playoffItem}>
                <div>
                  <strong className={styles.dangerLabel}>{p.nombre}</strong>
                  <p className={styles.dangerDesc}>
                    {p.activo ? "Activo" : "Finalizado"} · inicio {p.fecha_inicio}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => navigate(`/admin/torneos/${p.id_torneo}`)}>
                  Abrir →
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CREAR PLAYOFF */}
      <div className={styles.tableCard}>
        <h3 className={styles.statsTitle}>Crear playoff</h3>
        <p className={styles.infoSmall} style={{ textAlign: "left", padding: "0 0 12px" }}>
          Se crea un torneo de playoff tomando como base este torneo. Los equipos
          y la tabla de posiciones salen de acá.
        </p>

        <div className={formStyles.field}>
          <label className={formStyles.label}>Nombre</label>
          <input
            className={formStyles.input}
            value={nombre}
            onChange={e => setNombre(e.target.value)}
          />
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label}>Fecha de inicio</label>
          <input
            className={formStyles.input}
            type="date"
            value={fechaInicio}
            onChange={e => setFechaInicio(e.target.value)}
          />
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label}>Formato de partidos</label>
          <select
            className={formStyles.select}
            value={formato}
            onChange={e => setFormato(e.target.value as TipoFormatoPlayoff)}
          >
            <option value="ida">Solo ida</option>
            <option value="ida_y_vuelta">Ida y vuelta</option>
          </select>
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label}>Asignación de duelos</label>
          <select
            className={formStyles.select}
            value={asignacion}
            onChange={e => setAsignacion(e.target.value as TipoAsignacion)}
          >
            <option value="automatico">Automático (por orden de la tabla)</option>
            <option value="manual">Manual (elegir enfrentamientos)</option>
          </select>
        </div>

        {asignacion === "automatico" ? (
          <>
            <div className={formStyles.field}>
              <label className={formStyles.label}>Ronda inicial</label>
              <select
                className={formStyles.select}
                value={rondaInicial}
                onChange={e => setRondaInicial(e.target.value as TipoRondaInicial | "")}
              >
                <option value="">Todos los inscriptos (automático)</option>
                <option value="dieciseisavos">Dieciseisavos (32 equipos)</option>
                <option value="octavos">Octavos (16 equipos)</option>
                <option value="cuartos">Cuartos (8 equipos)</option>
                <option value="semifinal">Semifinal (4 equipos)</option>
                <option value="final">Final (2 equipos)</option>
              </select>
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={tercerPuesto}
                  onChange={e => setTercerPuesto(e.target.checked)}
                />
                Agregar partido por el 3er puesto
              </label>
            </div>
          </>
        ) : (
          <>
            <div className={formStyles.field}>
              <label className={formStyles.label}>Ronda inicial</label>
              <select
                className={formStyles.select}
                value={rondaManual}
                onChange={e => handleCambiarRondaManual(e.target.value as RondaManual)}
              >
                <option value="cuartos">Cuartos de final (8 equipos)</option>
                <option value="semifinal">Semifinal (4 equipos)</option>
                <option value="final">Final (2 equipos)</option>
              </select>
              <p className={styles.infoSmall} style={{ textAlign: "left", padding: "6px 0 0" }}>
                Elegís los duelos de esta ronda; las siguientes (y sus avances)
                se arman solas con el ganador de cada partido.
              </p>
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label} style={{ marginBottom: 6 }}>
                Enfrentamientos — {rondaManual === "cuartos" ? "Cuartos" : rondaManual === "semifinal" ? "Semifinal" : "Final"}
              </label>
              {duelosManual.map((d, idx) => (
                <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", minWidth: 20 }}>{idx + 1}.</span>
                  <select
                    className={formStyles.select}
                    value={d.id_equipo_local || ""}
                    onChange={e => actualizarDueloManual(idx, "id_equipo_local", Number(e.target.value))}
                    style={{ flex: 1 }}
                  >
                    <option value="">— Local —</option>
                    {inscripciones.map(i => (
                      <option key={i.id_equipo} value={i.id_equipo}>{i.nombre_equipo}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>vs</span>
                  <select
                    className={formStyles.select}
                    value={d.id_equipo_visitante || ""}
                    onChange={e => actualizarDueloManual(idx, "id_equipo_visitante", Number(e.target.value))}
                    style={{ flex: 1 }}
                  >
                    <option value="">— Visitante —</option>
                    {inscripciones
                      .filter(i => i.id_equipo !== d.id_equipo_local)
                      .map(i => (
                        <option key={i.id_equipo} value={i.id_equipo}>{i.nombre_equipo}</option>
                      ))}
                  </select>
                </div>
              ))}
              {inscripciones.length === 0 && (
                <p className={styles.infoSmall} style={{ textAlign: "left" }}>
                  Este torneo no tiene equipos inscriptos todavía.
                </p>
              )}
            </div>

            {rondaManual !== "final" && (
              <div className={formStyles.field}>
                <label className={formStyles.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={tercerPuesto}
                    onChange={e => setTercerPuesto(e.target.checked)}
                  />
                  Agregar partido por el 3er puesto
                </label>
              </div>
            )}
          </>
        )}

        {error && <p className={formStyles.error}>{error}</p>}

        <div className={formStyles.actions}>
          <Button onClick={handleCrear} disabled={creando}>
            {creando ? "Creando…" : "Crear y generar bracket"}
          </Button>
        </div>
      </div>
    </>
  )
}
