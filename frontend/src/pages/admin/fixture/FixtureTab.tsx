import { useEffect, useMemo, useState } from "react"
import { listarTorneos } from "../../../api/torneos.api"
import type { Torneo } from "../../../types/torneo"
import FixturePanel from "./FixturePanel"
import styles from "../torneos/TorneoDetalle.module.css"

interface Props {
  /** Torneo abierto: puede ser la liga base o uno de sus playoffs. */
  torneo: Torneo
}

/**
 * Contenedor de la pestaña Fixture con dos sub-pestañas: el cronograma normal
 * de la liga y el bracket del playoff. Resuelve la relación liga ⇄ playoff sin
 * importar desde cuál de los dos torneos se entre. Si no hay playoff asociado
 * (o no hay liga base), muestra directamente el fixture del torneo actual.
 */
export default function FixtureTab({ torneo }: Props) {
  const esPlayoffTorneo = torneo.tipo === "PLAYOFF" || torneo.tipo === "COPA"
  const [related, setRelated] = useState<Torneo[]>([])
  const [sub, setSub] = useState<"fixture" | "playoff">(esPlayoffTorneo ? "playoff" : "fixture")
  const [selectedPlayoffId, setSelectedPlayoffId] = useState<number | null>(
    esPlayoffTorneo ? torneo.id_torneo : null
  )

  useEffect(() => {
    listarTorneos(false).then(setRelated).catch(() => setRelated([]))
  }, [])

  // La liga base del par: si el torneo es una liga, es él mismo; si es un
  // playoff, es el torneo referenciado por torneo_base_id.
  const liga = useMemo<Torneo | null>(() => {
    if (torneo.tipo === "LIGA") return torneo
    if (torneo.torneo_base_id) return related.find(t => t.id_torneo === torneo.torneo_base_id) ?? null
    return null
  }, [torneo, related])

  // Playoffs asociados a esa liga base (incluye el torneo actual si es playoff).
  const playoffs = useMemo<Torneo[]>(() => {
    const baseId = torneo.tipo === "LIGA" ? torneo.id_torneo : torneo.torneo_base_id
    if (!baseId) return esPlayoffTorneo ? [torneo] : []
    const hijos = related.filter(
      t => (t.tipo === "PLAYOFF" || t.tipo === "COPA") && t.torneo_base_id === baseId
    )
    if (esPlayoffTorneo && !hijos.some(t => t.id_torneo === torneo.id_torneo)) {
      hijos.push(torneo)
    }
    return hijos
  }, [torneo, related, esPlayoffTorneo])

  const selectedPlayoff =
    playoffs.find(p => p.id_torneo === selectedPlayoffId) ?? playoffs[0] ?? null

  // Solo tiene sentido diferenciar cuando existen ambos lados.
  const mostrarSubTabs = !!liga && playoffs.length > 0

  if (!mostrarSubTabs) {
    return <FixturePanel torneo={torneo} />
  }

  return (
    <>
      <nav className={styles.subTabs}>
        <button
          className={`${styles.subTab} ${sub === "fixture" ? styles.subTabActive : ""}`}
          onClick={() => setSub("fixture")}
        >
          Fixture
        </button>
        <button
          className={`${styles.subTab} ${sub === "playoff" ? styles.subTabActive : ""}`}
          onClick={() => setSub("playoff")}
        >
          Playoff
        </button>
      </nav>

      {sub === "fixture" && liga && (
        <FixturePanel key={liga.id_torneo} torneo={liga} />
      )}

      {sub === "playoff" && selectedPlayoff && (
        <>
          {playoffs.length > 1 && (
            <div className={styles.subSelectorRow}>
              <label className={styles.infoLabel}>Playoff</label>
              <select
                className={styles.subSelect}
                value={selectedPlayoff.id_torneo}
                onChange={e => setSelectedPlayoffId(Number(e.target.value))}
              >
                {playoffs.map(p => (
                  <option key={p.id_torneo} value={p.id_torneo}>{p.nombre}</option>
                ))}
              </select>
            </div>
          )}
          <FixturePanel key={selectedPlayoff.id_torneo} torneo={selectedPlayoff} />
        </>
      )}
    </>
  )
}
