import { useEffect, useRef } from "react"
import type { FixturePartido } from "../../../types/fixture"
import styles from "./BracketPlayoff.module.css"

interface Props {
  partidos: FixturePartido[]
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
    // Detectar si es ida y vuelta: hay pares de partidos con mismos equipos invertidos
    const ps = [...r.partidos].sort((a, b) => a.id_fixture_partido - b.id_fixture_partido)
    const idaYVuelta = ps.length > 1 &&
      ps[0].id_equipo_local === ps[1].id_equipo_visitante &&
      ps[0].id_equipo_visitante === ps[1].id_equipo_local

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

    return { nombre: r.nombre, orden: r.partidos[0].id_fixture_playoff_ronda!, llaves }
  })
}

function nombreEquipo(p: FixturePartido, lado: "local" | "visitante"): string {
  if (lado === "local") return p.nombre_equipo_local ?? p.placeholder_local ?? "Por definir"
  return p.nombre_equipo_visitante ?? p.placeholder_visitante ?? "Por definir"
}

function esPlaceholder(p: FixturePartido, lado: "local" | "visitante"): boolean {
  if (lado === "local") return !p.id_equipo_local
  return !p.id_equipo_visitante
}

export default function BracketPlayoff({ partidos }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const rondas = construirRondas(partidos)

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

      rondas.forEach((ronda, ri) => {
        if (ri >= rondas.length - 1) return

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

  return (
    <div className={styles.wrapper}>
      <div className={styles.scrollArea}>
        <div className={styles.bracketContainer} ref={containerRef}>
          <canvas className={styles.canvas} ref={canvasRef} />

          {rondas.map((ronda, ri) => (
            <div key={ronda.orden} className={styles.rondaCol}>
              <div className={styles.rondaNombre}>{ronda.nombre}</div>
              <div className={styles.llavesCol}>
                {ronda.llaves.map((llave, li) => {
                  const p = llave.partidos[0]
                  const localNombre = nombreEquipo(p, "local")
                  const visitanteNombre = nombreEquipo(p, "visitante")
                  const localPH = esPlaceholder(p, "local")
                  const visitantePH = esPlaceholder(p, "visitante")
                  const localGana = llave.ganadorId === p.id_equipo_local
                  const visitanteGana = llave.ganadorId === p.id_equipo_visitante

                  return (
                    <div
                      key={li}
                      className={styles.llaveSpacer}
                      style={{ flex: rondas[0].llaves.length / (ronda.llaves.length || 1) }}
                    >
                      <div
                        className={styles.llave}
                        data-llave={`${ri}-${li}`}
                      >
                        {/* Equipo local */}
                        <div className={`${styles.equipo} ${localGana ? styles.ganador : ""} ${visitanteGana ? styles.perdedor : ""} ${localPH ? styles.placeholder : ""}`}>
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
                          <span className={styles.equipoNombre}>{visitanteNombre}</span>
                          {llave.golesVisitante !== null && (
                            <span className={`${styles.goles} ${visitanteGana ? styles.golesGanador : ""}`}>
                              {llave.golesVisitante}
                            </span>
                          )}
                        </div>

                        {/* Badge ida y vuelta */}
                        {llave.partidos.length === 2 && (
                          <div className={styles.idaVueltaBadge}>ida y vuelta</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
