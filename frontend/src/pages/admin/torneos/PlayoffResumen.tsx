import { useEffect, useState } from "react"
import { listarTorneos } from "../../../api/torneos.api"
import { listarFixturePorTorneoAdmin, listarRondasPlayoff } from "../../../api/fixture.api"
import type { Torneo } from "../../../types/torneo"
import type { FixturePartido, PlayoffRonda } from "../../../types/fixture"

import styles from "./PlayoffResumen.module.css"

interface Props {
  /** Torneo abierto: puede ser la liga base o uno de sus playoffs. */
  torneo: Torneo
}

/** Playoff con sus rondas y partidos ya resueltos. */
interface PlayoffCargado {
  torneo: Torneo
  rondas: PlayoffRonda[]
  partidos: FixturePartido[]
}

/** Bloque de partidos que se muestra junto bajo un mismo título de ronda. */
interface BloqueRonda {
  clave: string
  nombre: string
  idaYVuelta: boolean
  partidos: FixturePartido[]
}

const ESTADOS_LABELS: Record<string, string> = {
  BORRADOR: "Borrador",
  PENDIENTE: "Pendiente",
  TERMINADO: "Jugado",
  SUSPENDIDO: "Suspendido",
  ANULADO: "Anulado",
  REPROGRAMADO: "Reprogramado",
}

/** Nombre del equipo o, si todavía no está definido, el placeholder del bracket. */
function nombreEquipo(p: FixturePartido, lado: "local" | "visitante"): string {
  return lado === "local"
    ? p.nombre_equipo_local ?? p.placeholder_local ?? "Por definir"
    : p.nombre_equipo_visitante ?? p.placeholder_visitante ?? "Por definir"
}

/** Fecha y horario en una sola línea; devuelve null si no hay nada programado. */
function fechaYHora(p: FixturePartido): string | null {
  const partes: string[] = []
  if (p.fecha_programada) {
    partes.push(
      new Date(p.fecha_programada + "T00:00:00").toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
      })
    )
  }
  if (p.horario) partes.push(p.horario.slice(0, 5))
  return partes.length ? partes.join(" · ") : null
}

/**
 * Agrupa los partidos de un playoff por ronda, respetando el orden definido en
 * `fixture_playoff_ronda`. Los partidos sin ronda (cargados a mano) quedan en un
 * bloque final para que no desaparezcan del resumen.
 */
function agruparPorRonda(rondas: PlayoffRonda[], partidos: FixturePartido[]): BloqueRonda[] {
  const ordenadas = [...rondas].sort((a, b) => a.orden - b.orden)

  const bloques: BloqueRonda[] = ordenadas
    .map(r => ({
      clave: `ronda-${r.id_fixture_playoff_ronda}`,
      nombre: r.nombre,
      idaYVuelta: r.ida_y_vuelta,
      partidos: partidos
        .filter(p => p.id_fixture_playoff_ronda === r.id_fixture_playoff_ronda)
        .sort((a, b) => a.id_fixture_partido - b.id_fixture_partido),
    }))
    .filter(b => b.partidos.length > 0)

  const sinRonda = partidos
    .filter(p => !p.id_fixture_playoff_ronda)
    .sort((a, b) => a.id_fixture_partido - b.id_fixture_partido)

  if (sinRonda.length) {
    bloques.push({ clave: "sin-ronda", nombre: "Otros partidos", idaYVuelta: false, partidos: sinRonda })
  }

  return bloques
}

/**
 * Resumen de solo lectura de los playoffs asociados a un torneo: lista los
 * partidos separados por ronda, con su resultado si ya se jugaron. Se muestra
 * debajo de la tabla de posiciones y no renderiza nada si el torneo no tiene
 * playoff (o si el playoff todavía no tiene partidos generados).
 * @param torneo - Liga base cuyos playoffs se listan, o el playoff mismo.
 */
export default function PlayoffResumen({ torneo }: Props) {
  const [playoffs, setPlayoffs] = useState<PlayoffCargado[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelado = false
    setLoading(true)

    // La liga base del par: si se entró por un playoff, se listan todos los
    // playoffs hermanos para que el resumen sea el mismo desde ambos lados.
    const baseId = torneo.tipo === "LIGA" ? torneo.id_torneo : torneo.torneo_base_id

    listarTorneos(false)
      .then(async (todos) => {
        const hijos = baseId
          ? todos.filter(
              t => (t.tipo === "PLAYOFF" || t.tipo === "COPA") && t.torneo_base_id === baseId
            )
          : []

        // El torneo abierto puede ser un playoff sin liga base: igual se muestra.
        if (
          (torneo.tipo === "PLAYOFF" || torneo.tipo === "COPA") &&
          !hijos.some(t => t.id_torneo === torneo.id_torneo)
        ) {
          hijos.push(torneo)
        }

        const cargados = await Promise.all(
          hijos.map(async (t): Promise<PlayoffCargado> => {
            const [rondas, partidos] = await Promise.all([
              listarRondasPlayoff(t.id_torneo).catch(() => [] as PlayoffRonda[]),
              listarFixturePorTorneoAdmin(t.id_torneo).catch(() => [] as FixturePartido[]),
            ])
            return { torneo: t, rondas, partidos }
          })
        )

        if (!cancelado) setPlayoffs(cargados.filter(p => p.partidos.length > 0))
      })
      .catch(() => {
        if (!cancelado) setPlayoffs([])
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })

    return () => {
      cancelado = true
    }
  }, [torneo])

  // Sin playoffs no se ocupa espacio en el resumen: no se muestra ni el título.
  if (loading || playoffs.length === 0) return null

  return (
    <>
      {playoffs.map(({ torneo: t, rondas, partidos }) => (
        <div key={t.id_torneo} className={styles.card}>
          <h3 className={styles.titulo}>{t.nombre}</h3>

          {agruparPorRonda(rondas, partidos).map(bloque => (
            <div key={bloque.clave} className={styles.ronda}>
              <div className={styles.rondaHeader}>
                <span className={styles.rondaNombre}>{bloque.nombre}</span>
                {bloque.idaYVuelta && <span className={styles.pill}>ida y vuelta</span>}
              </div>

              <ul className={styles.llaves}>
                {bloque.partidos.map(p => {
                  const jugado = p.estado === "TERMINADO" && p.goles_local != null
                  const ganaLocal = jugado && (p.goles_local ?? 0) > (p.goles_visitante ?? 0)
                  const ganaVisitante = jugado && (p.goles_visitante ?? 0) > (p.goles_local ?? 0)
                  const cuando = fechaYHora(p)

                  return (
                    <li key={p.id_fixture_partido} className={styles.llave}>
                      <span className={`${styles.equipo} ${ganaLocal ? styles.ganador : ""}`}>
                        {nombreEquipo(p, "local")}
                      </span>

                      <span className={jugado ? styles.marcador : styles.versus}>
                        {jugado ? `${p.goles_local} - ${p.goles_visitante}` : "vs"}
                      </span>

                      <span
                        className={`${styles.equipo} ${styles.visitante} ${ganaVisitante ? styles.ganador : ""}`}
                      >
                        {nombreEquipo(p, "visitante")}
                      </span>

                      <span className={styles.meta}>
                        {jugado ? ESTADOS_LABELS[p.estado] : cuando ?? ESTADOS_LABELS[p.estado] ?? ""}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </>
  )
}
