import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { crearPlayoffAnual } from "../../api/temporadas.api"
import {
  EQUIPOS_POR_RONDA_ANUAL,
  type DueloAnual,
  type FilaTablaAnual,
  type PlayoffAnualResponse,
  type RondaInicialAnual,
  type Temporada,
} from "../../types/temporada"
import styles from "./PlayoffAnualLauncher.module.css"

interface Props {
  temporada: Temporada
  /** Tabla anual ya ordenada: de acá salen los clasificados y los duelos. */
  filas: FilaTablaAnual[]
  /**
   * Avisa cuántos equipos entran con la configuración actual, para que la
   * tabla de arriba dibuje la línea de corte. `null` cuando el formulario
   * está cerrado o los duelos se eligen a mano.
   */
  onCuposChange?: (cupos: number | null) => void
  /** La temporada cambió (se creó el playoff): hay que releerla. */
  onCreado?: () => void
}

const RONDAS: RondaInicialAnual[] = ["octavos", "cuartos", "semifinal", "final"]

const RONDA_LABEL: Record<RondaInicialAnual, string> = {
  octavos: "Octavos de final",
  cuartos: "Cuartos de final",
  semifinal: "Semifinal",
  final: "Final directa",
}

const duelosVacios = (n: number): DueloAnual[] =>
  Array.from({ length: n }, () => ({ id_equipo_local: 0, id_equipo_visitante: 0 }))

/**
 * Creación del playoff por el campeón del año desde la tabla anual.
 *
 * Se diferencia del playoff común en que no cuelga de un torneo: los equipos
 * salen de la suma del año. En automático clasifican los mejores de la tabla y
 * se cruzan mejor contra peor; en manual el admin arma los duelos de la primera
 * ronda y de ahí en adelante el bracket avanza solo con los ganadores.
 */
export default function PlayoffAnualLauncher({
  temporada,
  filas,
  onCuposChange,
  onCreado,
}: Props) {
  const navigate = useNavigate()

  const existente = temporada.torneos.find(t => t.rol_en_temporada === "FINAL_ANUAL")

  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState(`Campeón Anual ${temporada.anio} - ${temporada.nombre}`)
  const [fechaInicio, setFechaInicio] = useState(() => new Date().toISOString().slice(0, 10))
  const [ronda, setRonda] = useState<RondaInicialAnual>("semifinal")
  const [formato, setFormato] = useState<"ida" | "ida_y_vuelta">("ida")
  const [asignacion, setAsignacion] = useState<"automatico" | "manual">("automatico")
  const [duelos, setDuelos] = useState<DueloAnual[]>(duelosVacios(2))
  const [tercerPuesto, setTercerPuesto] = useState(true)
  const [copiarPlanteles, setCopiarPlanteles] = useState(true)
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<PlayoffAnualResponse | null>(null)

  // Solo se ofrecen las rondas para las que alcanzan los equipos de la tabla.
  const rondasPosibles = useMemo(
    () => RONDAS.filter(r => filas.length >= EQUIPOS_POR_RONDA_ANUAL[r]),
    [filas.length],
  )

  const cupos = EQUIPOS_POR_RONDA_ANUAL[ronda]

  // Si la ronda elegida dejó de ser posible (cambió la tabla), se baja a la
  // más grande que entre.
  useEffect(() => {
    if (rondasPosibles.length > 0 && !rondasPosibles.includes(ronda)) {
      setRonda(rondasPosibles[0])
    }
  }, [rondasPosibles, ronda])

  // La línea de corte de la tabla solo tiene sentido cuando clasifican los
  // mejores; con duelos a mano el orden no decide quién entra.
  useEffect(() => {
    onCuposChange?.(abierto && !resultado && asignacion === "automatico" ? cupos : null)
  }, [abierto, resultado, asignacion, cupos, onCuposChange])

  function cambiarRonda(nueva: RondaInicialAnual) {
    setRonda(nueva)
    setDuelos(duelosVacios(EQUIPOS_POR_RONDA_ANUAL[nueva] / 2))
    if (nueva === "final") setTercerPuesto(false)
  }

  function actualizarDuelo(idx: number, campo: keyof DueloAnual, valor: number) {
    setDuelos(prev => prev.map((d, i) => (i === idx ? { ...d, [campo]: valor } : d)))
  }

  /** Equipos ya usados en otros duelos: nadie puede jugar dos llaves. */
  function usadosFuera(idx: number, campo: keyof DueloAnual): Set<number> {
    const usados = new Set<number>()
    duelos.forEach((d, i) => {
      if (i !== idx || campo !== "id_equipo_local") {
        if (d.id_equipo_local) usados.add(d.id_equipo_local)
      }
      if (i !== idx || campo !== "id_equipo_visitante") {
        if (d.id_equipo_visitante) usados.add(d.id_equipo_visitante)
      }
    })
    return usados
  }

  async function crear() {
    if (!nombre.trim()) {
      setError("Poné un nombre para el playoff.")
      return
    }
    if (asignacion === "manual") {
      const incompletos = duelos.some(
        d => !d.id_equipo_local || !d.id_equipo_visitante || d.id_equipo_local === d.id_equipo_visitante,
      )
      if (incompletos) {
        setError("Completá todos los duelos con equipos distintos.")
        return
      }
    }
    setCreando(true)
    setError(null)
    try {
      const res = await crearPlayoffAnual(temporada.id_temporada, {
        nombre: nombre.trim(),
        fecha_inicio: fechaInicio,
        ronda_inicial: ronda,
        formato,
        asignacion,
        duelos: asignacion === "manual" ? duelos : null,
        tercer_puesto: tercerPuesto,
        copiar_planteles: copiarPlanteles,
      })
      setResultado(res)
      onCreado?.()
    } catch (e: any) {
      setError(
        e?.response?.data?.detail ??
          e?.response?.data?.message ??
          "No se pudo crear el playoff anual.",
      )
    } finally {
      setCreando(false)
    }
  }

  // ── Ya existe: no se ofrece crear otro, se ofrece abrirlo ─────────────────
  if (existente && !resultado) {
    return (
      <div className={styles.card}>
        <h4 className={styles.titulo}>🏆 Playoff anual {temporada.anio}</h4>
        <p className={styles.ayuda}>
          Esta temporada ya tiene su playoff por el campeón del año:{" "}
          <strong>{existente.nombre}</strong>. El bracket y los partidos se
          gestionan desde el torneo.
        </p>
        <button
          type="button"
          className={styles.boton}
          onClick={() => navigate(`/admin/torneos/${existente.id_torneo}`)}
        >
          Abrir playoff →
        </button>
      </div>
    )
  }

  // ── Recién creado: qué quedó hecho y qué quedó a mano ─────────────────────
  if (resultado) {
    return (
      <div className={styles.card}>
        <h4 className={styles.titulo}>🏆 {resultado.nombre}</h4>
        <p className={styles.ayuda}>
          Bracket generado con {resultado.equipos.length} equipos:{" "}
          {resultado.equipos.join(" · ")}
        </p>

        {copiarPlanteles && (
          <p className={styles.ayuda}>
            Nóminas heredadas: <strong>{resultado.planteles_copiados}</strong>{" "}
            integrantes copiados desde el último torneo del año de cada equipo.
          </p>
        )}

        {resultado.avisos.length > 0 && (
          <ul className={styles.avisos}>
            {resultado.avisos.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        )}

        {resultado.planteles_omitidos.length > 0 && (
          <>
            <p className={styles.avisoTitulo}>
              No se pudieron heredar {resultado.planteles_omitidos.length}{" "}
              integrantes. Hay que resolverlos a mano en el plantel del playoff:
            </p>
            <ul className={styles.avisos}>
              {resultado.planteles_omitidos.map(o => (
                <li key={`${o.equipo}-${o.id_persona}`}>
                  <strong>{o.equipo}</strong> — {o.nombre}: {o.motivo}
                </li>
              ))}
            </ul>
          </>
        )}

        <button
          type="button"
          className={styles.boton}
          onClick={() => navigate(`/admin/torneos/${resultado.id_torneo}`)}
        >
          Abrir playoff →
        </button>
      </div>
    )
  }

  // ── Sin equipos suficientes ───────────────────────────────────────────────
  if (rondasPosibles.length === 0) {
    return (
      <div className={styles.card}>
        <h4 className={styles.titulo}>🏆 Playoff anual</h4>
        <p className={styles.ayuda}>
          Hacen falta al menos 2 equipos en la tabla anual para armar el playoff
          del campeón del año.
        </p>
      </div>
    )
  }

  // ── Cerrado: solo el botón ────────────────────────────────────────────────
  if (!abierto) {
    return (
      <div className={styles.lanzador}>
        <button type="button" className={styles.boton} onClick={() => setAbierto(true)}>
          🏆 Crear playoff anual (campeón del año)
        </button>
        <span className={styles.lanzadorAyuda}>
          Los equipos salen de esta tabla, no de un torneo.
        </span>
      </div>
    )
  }

  const clasificados = filas.slice(0, cupos)

  return (
    <div className={styles.card}>
      <h4 className={styles.titulo}>🏆 Crear playoff anual (campeón del año)</h4>
      <p className={styles.ayuda}>
        Se crea un torneo de playoff colgado de la temporada {temporada.anio}, no
        de un torneo suelto: los equipos y su orden salen de la tabla anual de
        arriba. Sus partidos no vuelven a sumar a esa tabla.
      </p>

      <div className={styles.grid}>
        <label className={styles.campo}>
          <span className={styles.label}>Nombre</span>
          <input
            className={styles.input}
            value={nombre}
            onChange={e => setNombre(e.target.value)}
          />
        </label>

        <label className={styles.campo}>
          <span className={styles.label}>Fecha de inicio</span>
          <input
            className={styles.input}
            type="date"
            value={fechaInicio}
            onChange={e => setFechaInicio(e.target.value)}
          />
        </label>

        <label className={styles.campo}>
          <span className={styles.label}>Ronda inicial</span>
          <select
            className={styles.input}
            value={ronda}
            onChange={e => cambiarRonda(e.target.value as RondaInicialAnual)}
          >
            {rondasPosibles.map(r => (
              <option key={r} value={r}>
                {RONDA_LABEL[r]} ({EQUIPOS_POR_RONDA_ANUAL[r]} equipos)
              </option>
            ))}
          </select>
        </label>

        <label className={styles.campo}>
          <span className={styles.label}>Formato de partidos</span>
          <select
            className={styles.input}
            value={formato}
            onChange={e => setFormato(e.target.value as "ida" | "ida_y_vuelta")}
          >
            <option value="ida">Solo ida</option>
            <option value="ida_y_vuelta">Ida y vuelta</option>
          </select>
        </label>

        <label className={styles.campo}>
          <span className={styles.label}>Cruces de la primera ronda</span>
          <select
            className={styles.input}
            value={asignacion}
            onChange={e => setAsignacion(e.target.value as "automatico" | "manual")}
          >
            <option value="automatico">Automático (1º vs último, 2º vs anteúltimo…)</option>
            <option value="manual">Manual (elijo los duelos)</option>
          </select>
        </label>
      </div>

      {asignacion === "automatico" ? (
        <div className={styles.bloque}>
          <p className={styles.bloqueTitulo}>Clasifican</p>
          <ol className={styles.clasificados}>
            {clasificados.map(f => (
              <li key={f.id_equipo}>
                <span className={styles.puesto}>{f.puesto}º</span> {f.equipo}
                <span className={styles.pts}>{f.puntos} pts</span>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className={styles.bloque}>
          <p className={styles.bloqueTitulo}>
            Duelos de {RONDA_LABEL[ronda].toLowerCase()}
          </p>
          <p className={styles.ayuda}>
            Elegís solo esta ronda; las siguientes se arman solas con el ganador
            de cada llave.
          </p>
          {duelos.map((d, idx) => {
            const usadosLocal = usadosFuera(idx, "id_equipo_local")
            const usadosVisita = usadosFuera(idx, "id_equipo_visitante")
            return (
              <div key={idx} className={styles.duelo}>
                <span className={styles.dueloNum}>{idx + 1}.</span>
                <select
                  className={styles.input}
                  value={d.id_equipo_local || ""}
                  onChange={e => actualizarDuelo(idx, "id_equipo_local", Number(e.target.value))}
                >
                  <option value="">— Local —</option>
                  {filas
                    .filter(f => !usadosLocal.has(f.id_equipo))
                    .map(f => (
                      <option key={f.id_equipo} value={f.id_equipo}>
                        {f.puesto}º {f.equipo}
                      </option>
                    ))}
                </select>
                <span className={styles.vs}>vs</span>
                <select
                  className={styles.input}
                  value={d.id_equipo_visitante || ""}
                  onChange={e => actualizarDuelo(idx, "id_equipo_visitante", Number(e.target.value))}
                >
                  <option value="">— Visitante —</option>
                  {filas
                    .filter(f => !usadosVisita.has(f.id_equipo))
                    .map(f => (
                      <option key={f.id_equipo} value={f.id_equipo}>
                        {f.puesto}º {f.equipo}
                      </option>
                    ))}
                </select>
              </div>
            )
          })}
        </div>
      )}

      <div className={styles.checks}>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={tercerPuesto}
            onChange={e => setTercerPuesto(e.target.checked)}
            disabled={ronda === "final"}
          />
          Partido por el 3er y 4to puesto
          {ronda === "final" && (
            <span className={styles.notaCheck}> — no aplica en una final directa</span>
          )}
        </label>

        <label className={styles.check}>
          <input
            type="checkbox"
            checked={copiarPlanteles}
            onChange={e => setCopiarPlanteles(e.target.checked)}
          />
          Heredar la última nómina del año de cada equipo
        </label>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.acciones}>
        <button type="button" className={styles.boton} onClick={crear} disabled={creando}>
          {creando ? "Creando…" : "Crear y generar bracket"}
        </button>
        <button
          type="button"
          className={styles.botonSecundario}
          onClick={() => setAbierto(false)}
          disabled={creando}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
