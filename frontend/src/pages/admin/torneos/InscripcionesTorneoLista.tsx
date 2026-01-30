// frontend/src/pages/admin/torneos/InscripcionesTorneoLista.tsx

import type { InscripcionTorneoDetalle } from "../../../types/inscripcion"
import Button from "../../../components/ui/button/Button"

import styles from "./InscripcionesTorneoLista.module.css"

type Props = {
  inscripciones: InscripcionTorneoDetalle[]
  onBaja: (idEquipo: number) => void
}

export default function InscripcionesTorneoLista({
  inscripciones,
  onBaja,
}: Props) {
  return (
    <ul className={styles.list}>
      {inscripciones.map((i) => (
        <li key={i.id_inscripcion} className={styles.item}>
          <div className={styles.info}>
            <span className={styles.equipo}>{i.nombre_equipo}</span>
            <span className={styles.club}>{i.nombre_club}</span>
            <span className={styles.meta}>
              {i.genero_equipo} – {i.categoria_equipo}
            </span>
          </div>

          <Button
            variant="danger"
            onClick={() => {
              if (confirm("¿Dar de baja este equipo del torneo?")) {
                onBaja(i.id_equipo)
              }
            }}
          >
            Dar de baja
          </Button>
        </li>
      ))}
    </ul>
  )
}
