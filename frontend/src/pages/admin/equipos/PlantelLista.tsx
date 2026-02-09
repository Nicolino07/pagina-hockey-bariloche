// src/pages/admin/equipos/PlantelLista.tsx

import type { PlantelActivoIntegrante } from "../../../types/vistas";
import styles from "./PlantelLista.module.css";

interface Props {
  integrantes: PlantelActivoIntegrante[];
  editable?: boolean;
  onEliminar?: (integrante: PlantelActivoIntegrante) => void;
}

export default function PlantelLista({
  integrantes,
  editable = false,
  onEliminar,
}: Props) {
  return (
    <div className={styles.scrollList}>
      {integrantes.map((i) => (
        <div key={i.id_plantel_integrante} className={styles.personaCard}>
          <div className={styles.personaInfo}>
            <span className={styles.personaName}>
              {i.apellido}, {i.nombre}
            </span>
            <span className={styles.personaSub}>
              <strong>DNI:</strong> {i.documento || "---"} · 
              <span className={styles.roleBadge}>{i.rol_en_plantel}</span>
            </span>
          </div>

          {editable && (
            <button
              className={styles.deleteBtn}
              onClick={() => onEliminar?.(i)}
            >
              Dar de Baja
            </button>
          )}
        </div>
      ))}
    </div>
  );
}