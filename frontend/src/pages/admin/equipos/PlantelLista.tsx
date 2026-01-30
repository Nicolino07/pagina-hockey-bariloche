// src/pages/admin/equipos/PlantelLista.tsx
import type { PlantelActivoIntegrante } from "../../../types/vistas"
import styles from "./PlantelLista.module.css"

interface Props {
  integrantes: PlantelActivoIntegrante[]
  editable?: boolean
  onEliminar?: (integrante: PlantelActivoIntegrante) => void
}

export default function PlantelLista({
  integrantes,
  editable = false,
  onEliminar,
}: Props) {
  console.log("editable:", editable)

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Apellido</th>
          <th>Nombre</th>
          <th>Rol</th>
          {editable && <th />}
        </tr>
      </thead>

      <tbody>
        {integrantes.map((i) => (
          <tr key={i.id_plantel_integrante}>
            <td>{i.apellido}</td>
            <td>{i.nombre}</td>
            <td>
              <span className={styles.role}>
                {i.rol_en_plantel}
              </span>
            </td>

            {editable && (
              <td>
                <button
                  className={styles.deleteBtn}
                  onClick={() => onEliminar?.(i)}
                >
                  Dar de Baja
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
