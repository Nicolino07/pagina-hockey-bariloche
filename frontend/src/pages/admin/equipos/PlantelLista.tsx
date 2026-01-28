import type { PlantelActivoIntegrante } from "../../../types/vistas"
import styles from "./PlantelLista.module.css"

interface Props {
  integrantes: PlantelActivoIntegrante[]
  onEliminar: (integrante: PlantelActivoIntegrante) => void
}

export default function PlantelLista({
  integrantes,
  onEliminar,
}: Props) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Apellido</th>
          <th>Nombre</th>
          <th>Rol</th>
          <th></th> {/* acciones */}
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
            <td>
              <button
                className={styles.deleteBtn}
                onClick={() => onEliminar(i)}
              >
                Eliminar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

