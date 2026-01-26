import type { PlantelActivoIntegrante } from "../../../types/vistas"
import styles from "./PlantelLista.module.css"

interface Props {
  integrantes: PlantelActivoIntegrante[]
}

export default function PlantelLista({ integrantes }: Props) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
     
          <th>Apellido</th>
          <th>Nombre</th>
          <th>Rol</th>
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
          </tr>
        ))}
      </tbody>
    </table>
  )
}
