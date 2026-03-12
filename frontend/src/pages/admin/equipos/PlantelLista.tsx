import type { PlantelActivoIntegrante } from "../../../types/vistas";
import styles from "./PlantelLista.module.css";

interface Props {
  integrantes: PlantelActivoIntegrante[];
  /** Si es true, muestra el botón de baja para cada integrante. */
  editable?: boolean;
  /** Callback invocado al hacer clic en "Dar de Baja" de un integrante. */
  onEliminar?: (integrante: PlantelActivoIntegrante) => void;
}

/**
 * Componente de lista de integrantes de un plantel.
 * En modo editable muestra el botón de baja; en modo solo lectura es solo informativo.
 */
export default function PlantelLista({
  integrantes,
  editable = false,
  onEliminar,
}: Props) {
  return (
    <div className={styles.scrollList}>
      {integrantes.map((i, index) => {
        // Usamos una key segura: ID del integrante, o ID de persona, o índice
        const itemKey = i.id_plantel_integrante || i.id_persona || `temp-${index}`;

        return (
          <div key={itemKey} className={styles.personaCard}>
            <div className={styles.personaInfo}>
              <span className={styles.personaName}>
                {i.apellido_persona}, {i.nombre_persona}
              </span>
              <span className={styles.personaSub}>
                <strong>DNI:</strong> {i.documento || "---"} · 
                <span className={styles.roleBadge}>{i.rol_en_plantel}</span>
              </span>
            </div>

            {editable && (
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Click en dar de baja para:", i);
                  onEliminar?.(i);
                }}
              >
                Dar de Baja
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}