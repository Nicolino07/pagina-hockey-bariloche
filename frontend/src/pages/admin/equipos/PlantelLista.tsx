import { useEffect, useState } from "react";
import type { PlantelActivoIntegrante } from "../../../types/vistas";
import { marcarSuspendidos } from "../../../utils/suspensiones";
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
  const [suspendidos, setSuspendidos] = useState<Set<number>>(new Set());

  useEffect(() => {
    marcarSuspendidos(integrantes)
      .then(marcados => setSuspendidos(new Set(
        marcados.filter(m => m.suspendido && typeof m.id_persona === "number").map(m => m.id_persona as number)
      )))
      .catch(() => setSuspendidos(new Set()));
  }, [integrantes]);

  return (
    <div className={styles.scrollList}>
      {integrantes.map((i, index) => {
        // Usamos una key segura: ID del integrante, o ID de persona, o índice
        const itemKey = i.id_plantel_integrante || i.id_persona || `temp-${index}`;

        const fechaAlta = i.fecha_alta ? new Date(i.fecha_alta).toLocaleDateString("es-AR") : null;
        const fechaBaja = i.fecha_baja ? new Date(i.fecha_baja).toLocaleDateString("es-AR") : null;
        const esBaja = !!i.fecha_baja;
        const suspendido = typeof i.id_persona === "number" && suspendidos.has(i.id_persona);

        return (
          <div key={itemKey} className={`${styles.personaCard} ${esBaja ? styles.personaCardBaja : ""}`}>
            <div className={styles.personaInfo}>
              <span className={styles.personaName}>
                {i.apellido_persona}, {i.nombre_persona}
                {suspendido && <span className={styles.suspendidoBadge}>SUSPENDIDO</span>}
              </span>
              <span className={styles.personaSub}>
                <strong>DNI:</strong> {i.documento || "---"} ·
                <span className={styles.roleBadge}>{i.rol_en_plantel}</span>
              </span>
              {(fechaAlta || fechaBaja) && (
                <span className={styles.personaFechas}>
                  {fechaAlta && <>Alta: {fechaAlta}</>}
                  {fechaBaja && <> · <span className={styles.fechaBaja}>Baja: {fechaBaja}</span></>}
                </span>
              )}
            </div>

            {editable && !esBaja && (
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
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