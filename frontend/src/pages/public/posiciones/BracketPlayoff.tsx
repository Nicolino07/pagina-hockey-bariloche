import { useEffect, useRef } from "react"
import type { FixturePartido } from "../../../types/fixture"
import styles from "./BracketPlayoff.module.css"

interface Props {
  partidos: FixturePartido[]
  onPartidoClick?: (partido: FixturePartido) => void
}

interface Llave {
  partidos: FixturePartido[]  // 1 o 2 partidos (ida / ida y vuelta)
  golesLocal: number | null
  golesVisitante: number | null
  ganadorId: number | null
}

interface Ronda {
  nombre: string
  orden: number
  llaves: Llave[]
  esTercerPuesto: boolean
}

function calcularGoles(partido: FixturePartido): { gl: number | null; gv: number | null } {
  if (partido.goles_local === null && partido.goles_visitante === null)
    return { gl: null, gv: null }
  return { gl: partido.goles_local, gv: partido.goles_visitante }
}

function construirRondas(partidos: FixturePartido[]): Ronda[] {
  // Agrupar por ronda
  const porRonda = new Map<number, { nombre: string; orden: number; partidos: FixturePartido[] }>()
  for (const p of partidos) {
    if (!p.id_fixture_playoff_ronda) continue
    const key = p.id_fixture_playoff_ronda
    if (!porRonda.has(key)) {
      porRonda.set(key, {
        nombre: p.nombre_ronda_playoff ?? "Ronda",
        orden: key, // lo reemplazamos abajo
        partidos: [],
      })
    }
    porRonda.get(key)!.partidos.push(p)
  }

  // Ordenar rondas por nombre_ronda_playoff (usamos el orden que viene del fixture)
  const rondas = Array.from(porRonda.values()).sort((a, b) =>
    a.partidos[0].id_fixture_playoff_ronda! - b.partidos[0].id_fixture_playoff_ronda!
  )

  return rondas.map(r => {
    // El formato viene de la ronda; en ida y vuelta los partidos van de a pares
    // (ida, vuelta) ordenados por id, igual que en el backend.
    const ps = [...r.partidos].sort((a, b) => a.id_fixture_partido - b.id_fixture_partido)
    const idaYVuelta = ps.some(p => p.ida_y_vuelta_ronda)

    const llaves: Llave[] = []
    const paso = idaYVuelta ? 2 : 1
    for (let i = 0; i < ps.length; i += paso) {
      const grupo = ps.slice(i, i + paso)
      const p1 = grupo[0]
      let gl: number | null = null
      let gv: number | null = null

      if (idaYVuelta && grupo.length === 2) {
        const p2 = grupo[1]
        const r1 = calcularGoles(p1)
        const r2 = calcularGoles(p2)
        if (r1.gl !== null && r2.gv !== null) gl = r1.gl + r2.gv
        if (r1.gv !== null && r2.gl !== null) gv = r1.gv + r2.gl
      } else {
        const r1 = calcularGoles(p1)
        gl = r1.gl
        gv = r1.gv
      }

      let ganadorId: number | null = null
      if (gl !== null && gv !== null) {
        if (gl > gv) ganadorId = p1.id_equipo_local
        else if (gv > gl) ganadorId = p1.id_equipo_visitante
      }

      llaves.push({ partidos: grupo, golesLocal: gl, golesVisitante: gv, ganadorId })
    }

    const esTercerPuesto = r.partidos.some(p => p.es_tercer_puesto) ||
      r.nombre.toLowerCase().includes("tercer puesto")

    return { nombre: r.nombre, orden: r.partidos[0].id_fixture_playoff_ronda!, llaves, esTercerPuesto }
  })
}

function nombreEquipo(p: FixturePartido, lado: "local" | "visitante"): string {
  if (lado === "local") return p.nombre_equipo_local ?? p.placeholder_local ?? "Por definir"
  return p.nombre_equipo_visitante ?? p.placeholder_visitante ?? "Por definir"
}

/** "2026-11-01" → "Sáb 1 nov" */
function formatearFecha(fecha: string): string {
  const d = new Date(fecha + "T00:00:00")
  const dia = d.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "")
  const mes = d.toLocaleDateString("es-AR", { month: "short" }).replace(".", "")
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${d.getDate()} ${mes}`
}

const PALABRAS_MENORES = new Set(["de", "del", "la", "las", "el", "los", "y"])

/** Las canchas suelen cargarse en mayúsculas ("ESTUDIANTES"): se muestran en tipo título. */
function formatearUbicacion(ubicacion: string): string {
  if (ubicacion !== ubicacion.toUpperCase()) return ubicacion
  return ubicacion
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && PALABRAS_MENORES.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ")
}

const IconoCalendario = () => (
  <svg className={styles.icono} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const IconoReloj = () => (
  <svg className={styles.icono} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)

const IconoUbicacion = () => (
  <svg className={styles.icono} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)

/** Pie de la llave: fecha y hora de cada partido (ida / vuelta) y la cancha. */
function DetallesLlave({ partidos }: { partidos: FixturePartido[] }) {
  const esIdaYVuelta = partidos.length === 2
  const ubicaciones = [...new Set(partidos.map(p => p.ubicacion).filter((u): u is string => !!u))]
  const algoProgramado = ubicaciones.length > 0 || partidos.some(p => p.fecha_programada || p.horario)

  if (!algoProgramado) {
    return (
      <div className={styles.detalles}>
        <span className={styles.aConfirmar}>Fecha a confirmar</span>
      </div>
    )
  }

  return (
    <div className={styles.detalles}>
      {partidos.map((p, i) => (
        <div key={p.id_fixture_partido} className={styles.detalleLinea}>
          {esIdaYVuelta && <span className={styles.etiquetaPartido}>{i === 0 ? "Ida" : "Vuelta"}</span>}
          {p.fecha_programada || p.horario ? (
            <>
              {p.fecha_programada && (
                <span className={styles.detalleItem}>
                  <IconoCalendario />{formatearFecha(p.fecha_programada)}
                </span>
              )}
              {p.fecha_programada && p.horario && <span className={styles.separador}>·</span>}
              {p.horario && (
                <span className={`${styles.detalleItem} ${styles.hora}`}>
                  <IconoReloj />{p.horario.slice(0, 5)}
                </span>
              )}
            </>
          ) : (
            <span className={styles.aConfirmar}>A confirmar</span>
          )}
        </div>
      ))}
      {ubicaciones.length > 0 && (
        <div className={styles.detalleLinea}>
          <span className={`${styles.detalleItem} ${styles.ubicacion}`} title={ubicaciones.join(" / ")}>
            <IconoUbicacion />
            <span className={styles.ubicacionTexto}>{ubicaciones.map(formatearUbicacion).join(" / ")}</span>
          </span>
        </div>
      )}
    </div>
  )
}

function esPlaceholder(p: FixturePartido, lado: "local" | "visitante"): boolean {
  if (lado === "local") return !p.id_equipo_local
  return !p.id_equipo_visitante
}

export default function BracketPlayoff({ partidos, onPartidoClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const rondas = construirRondas(partidos)
  // El partido por el 3er puesto se muestra aparte, fuera del flujo del bracket.
  const rondasPrincipales = rondas.filter(r => !r.esTercerPuesto)
  const rondaTercerPuesto = rondas.find(r => r.esTercerPuesto) ?? null

  useEffect(() => {
    let raf: number

    function dibujar() {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const cards = container.querySelectorAll<HTMLElement>("[data-llave]")
      if (cards.length === 0) return

      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height

      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const borderColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--border-color").trim() || "#d1d5db"
      ctx.strokeStyle = borderColor
      ctx.lineWidth = 1.5

      rondasPrincipales.forEach((ronda, ri) => {
        if (ri >= rondasPrincipales.length - 1) return

        ronda.llaves.forEach((_, li) => {
          const llaveActual = container.querySelector<HTMLElement>(`[data-llave="${ri}-${li}"]`)
          const destinoIdx = Math.floor(li / 2)
          const llaveDest = container.querySelector<HTMLElement>(`[data-llave="${ri + 1}-${destinoIdx}"]`)
          if (!llaveActual || !llaveDest) return

          const contRect = container.getBoundingClientRect()
          const rOrig = llaveActual.getBoundingClientRect()
          const rDest = llaveDest.getBoundingClientRect()

          const x1 = rOrig.right - contRect.left
          const y1 = rOrig.top - contRect.top + rOrig.height / 2
          const x2 = rDest.left - contRect.left
          const y2 = rDest.top - contRect.top + rDest.height / 2
          const mx = (x1 + x2) / 2

          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.bezierCurveTo(mx, y1, mx, y2, x2, y2)
          ctx.stroke()

          // Flecha
          const headLen = 8
          const angle = Math.atan2(y2 - y1, x2 - x1)
          ctx.beginPath()
          ctx.moveTo(x2, y2)
          ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6))
          ctx.moveTo(x2, y2)
          ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6))
          ctx.stroke()
        })
      })
    }

    // Esperar un frame para que el layout esté listo
    raf = requestAnimationFrame(dibujar)
    return () => cancelAnimationFrame(raf)
  }, [rondas])

  if (rondas.length === 0) {
    return <p className={styles.empty}>No hay partidos de playoff para mostrar.</p>
  }

  function renderLlaveCard(llave: Llave, dataLlave?: string) {
    const p = llave.partidos[0]
    const localNombre = nombreEquipo(p, "local")
    const visitanteNombre = nombreEquipo(p, "visitante")
    const localPH = esPlaceholder(p, "local")
    const visitantePH = esPlaceholder(p, "visitante")
    // Sin ganador (o con placeholders, donde los ids son null) nadie gana:
    // comparar null === null marcaba ambos lados como ganador y perdedor.
    const localGana = llave.ganadorId !== null && llave.ganadorId === p.id_equipo_local
    const visitanteGana = llave.ganadorId !== null && llave.ganadorId === p.id_equipo_visitante

    return (
      <div
        className={styles.llave}
        data-llave={dataLlave}
        style={{ cursor: onPartidoClick ? 'pointer' : 'default' }}
        onClick={() => onPartidoClick?.(llave.partidos[0])}
      >
        {/* Equipo local */}
        <div className={`${styles.equipo} ${localGana ? styles.ganador : ""} ${visitanteGana ? styles.perdedor : ""} ${localPH ? styles.placeholder : ""}`}>
          {llave.partidos[0].id_club_local && (
            <img
              src={`/logos/clubes/${llave.partidos[0].id_club_local}.jpg?v=2`}
              alt=""
              className={styles.escudo}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          )}
          <span className={styles.equipoNombre}>{localNombre}</span>
          {llave.golesLocal !== null && (
            <span className={`${styles.goles} ${localGana ? styles.golesGanador : ""}`}>
              {llave.golesLocal}
            </span>
          )}
        </div>

        {/* Divisor */}
        <div className={styles.divisor} />

        {/* Equipo visitante */}
        <div className={`${styles.equipo} ${visitanteGana ? styles.ganador : ""} ${localGana ? styles.perdedor : ""} ${visitantePH ? styles.placeholder : ""}`}>
          {llave.partidos[0].id_club_visitante && (
            <img
              src={`/logos/clubes/${llave.partidos[0].id_club_visitante}.jpg?v=2`}
              alt=""
              className={styles.escudo}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          )}
          <span className={styles.equipoNombre}>{visitanteNombre}</span>
          {llave.golesVisitante !== null && (
            <span className={`${styles.goles} ${visitanteGana ? styles.golesGanador : ""}`}>
              {llave.golesVisitante}
            </span>
          )}
        </div>

        <DetallesLlave partidos={llave.partidos} />
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.scrollArea}>
        <div className={styles.bracketContainer} ref={containerRef}>
          <canvas className={styles.canvas} ref={canvasRef} />

          {rondasPrincipales.map((ronda, ri) => (
            <div key={ronda.orden} className={styles.rondaCol}>
              <div className={styles.rondaNombre}>{ronda.nombre}</div>
              <div className={styles.llavesCol}>
                {ronda.llaves.map((llave, li) => (
                  <div
                    key={li}
                    className={styles.llaveSpacer}
                    style={{ flex: rondasPrincipales[0].llaves.length / (ronda.llaves.length || 1) }}
                  >
                    {renderLlaveCard(llave, `${ri}-${li}`)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {rondaTercerPuesto && rondaTercerPuesto.llaves.length > 0 && (
          <div className={styles.tercerPuesto}>
            <div className={styles.rondaNombre}>3er / 4to puesto</div>
            {rondaTercerPuesto.llaves.map((llave, li) => (
              <div key={li} className={styles.tercerPuestoLlave}>
                {renderLlaveCard(llave)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
