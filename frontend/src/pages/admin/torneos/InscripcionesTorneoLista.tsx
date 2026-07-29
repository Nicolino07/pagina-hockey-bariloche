// frontend/src/pages/admin/torneos/InscripcionesTorneoLista.tsx

import { useState } from "react"
import type { InscripcionTorneoDetalle } from "../../../types/inscripcion"
import Button from "../../../components/ui/button/Button"

import styles from "./InscripcionesTorneoLista.module.css"

type Props = {
  inscripciones: InscripcionTorneoDetalle[]
  onBaja: (idEquipo: number) => void | Promise<void>
}

/**
 * Lista de equipos inscriptos en un torneo con opción de dar de baja.
 * @param inscripciones - Lista de inscripciones activas del torneo.
 * @param onBaja - Callback invocado con el ID del equipo a dar de baja.
 */
export default function InscripcionesTorneoLista({
  inscripciones,
  onBaja,
}: Props) {
  // Equipo con la baja en curso: evita el doble clic mientras se recarga.
  const [dandoBaja, setDandoBaja] = useState<number | null>(null)

  const handleBaja = async (idEquipo: number) => {
    if (!confirm("¿Dar de baja este equipo del torneo?")) return
    setDandoBaja(idEquipo)
    try {
      await onBaja(idEquipo)
    } finally {
      setDandoBaja(null)
    }
  }

  return (
    <ul className={styles.list}>
      {inscripciones.map((i) => (
        <li key={i.id_inscripcion} className={styles.item}>
          <div className={styles.info}>
            <span className={styles.equipo}>{i.nombre_equipo}</span>
            <span className={styles.club}>{i.nombre_club}</span>
            <span className={styles.meta}>
              {i.genero_equipo} – {i.categoria_equipo}{i.division_equipo ? ` ${i.division_equipo}` : ""}
            </span>
          </div>

          <Button
            variant="danger"
            disabled={dandoBaja !== null}
            onClick={() => handleBaja(i.id_equipo)}
          >
            {dandoBaja === i.id_equipo ? "Dando de baja…" : "Dar de baja"}
          </Button>
        </li>
      ))}
    </ul>
  )
}
