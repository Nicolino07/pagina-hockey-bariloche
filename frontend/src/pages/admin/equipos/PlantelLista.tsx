import { useEffect, useMemo, useState } from "react";
import type { PlantelActivoIntegrante } from "../../../types/vistas";
import { marcarSuspendidos } from "../../../utils/suspensiones";
import styles from "./PlantelLista.module.css";

/**
 * Orden fijo del cuerpo técnico dentro de su bloque: DT, asistente,
 * preparador físico y médico. Los roles que no figuran acá (delegado,
 * árbitro) van al final del mismo bloque, en el orden en que lleguen.
 */
const ORDEN_CUERPO_TECNICO = [
  "DT",
  "ASISTENTE",
  "PREPARADOR_FISICO",
  "MEDICO",
] as const;

/** Etiqueta corta para el badge de rol (el enum crudo es poco legible). */
const ROL_BADGE: Record<string, string> = {
  JUGADOR: "Jugador",
  DT: "DT",
  ASISTENTE: "Asistente",
  PREPARADOR_FISICO: "Prep. Físico",
  MEDICO: "Médico",
  DELEGADO: "Delegado",
  ARBITRO: "Árbitro",
};

function ordenDeRol(rol?: string | null): number {
  const i = ORDEN_CUERPO_TECNICO.indexOf(rol as typeof ORDEN_CUERPO_TECNICO[number]);
  return i === -1 ? ORDEN_CUERPO_TECNICO.length : i;
}

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

  // Dos bloques: primero el cuerpo técnico (en su orden fijo) y debajo los
  // jugadores, que conservan el orden en que llegan.
  const { cuerpoTecnico, jugadores } = useMemo(() => {
    const jugadores = integrantes.filter(i => i.rol_en_plantel === "JUGADOR");
    const cuerpoTecnico = integrantes
      .filter(i => i.rol_en_plantel !== "JUGADOR")
      .sort((a, b) => {
        const porRol = ordenDeRol(a.rol_en_plantel) - ordenDeRol(b.rol_en_plantel);
        if (porRol !== 0) return porRol;
        return (a.apellido_persona ?? "").localeCompare(b.apellido_persona ?? "", "es");
      });
    return { cuerpoTecnico, jugadores };
  }, [integrantes]);

  useEffect(() => {
    marcarSuspendidos(integrantes)
      .then(marcados => setSuspendidos(new Set(
        marcados.filter(m => m.suspendido && typeof m.id_persona === "number").map(m => m.id_persona as number)
      )))
      .catch(() => setSuspendidos(new Set()));
  }, [integrantes]);

  const renderLista = (lista: PlantelActivoIntegrante[]) => (
    <div className={styles.scrollList}>
      {lista.map((i, index) => {
        // Usamos una key segura: ID del integrante, o ID de persona, o índice
        const itemKey = i.id_plantel_integrante || i.id_persona || `temp-${index}`;

        const fechaAlta = i.fecha_alta ? new Date(i.fecha_alta).toLocaleDateString("es-AR") : null;
        const fechaBaja = i.fecha_baja ? new Date(i.fecha_baja).toLocaleDateString("es-AR") : null;
        const esBaja = !!i.fecha_baja;
        // Quien jugó forma parte del registro del torneo: se lo puede marcar
        // de baja, pero no desaparece de la nómina.
        const jugo = (i.partidos_jugados ?? 0) > 0;
        const suspendido = typeof i.id_persona === "number" && suspendidos.has(i.id_persona);

        return (
          <div key={itemKey} className={`${styles.personaCard} ${esBaja ? styles.personaCardBaja : ""}`}>
            <div className={styles.personaInfo}>
              <span className={styles.personaName}>
                {i.apellido_persona}, {i.nombre_persona}
                {suspendido && <span className={styles.suspendidoBadge}>SUSPENDIDO</span>}
                {esBaja && <span className={styles.bajaBadge}>DE BAJA</span>}
              </span>
              <span className={styles.personaSub}>
                <strong>DNI:</strong> {i.documento || "---"} ·
                <span className={styles.roleBadge}>
                  {ROL_BADGE[i.rol_en_plantel ?? ""] ?? i.rol_en_plantel}
                </span>
                {jugo && <span className={styles.jugoBadge}>{i.partidos_jugados} PJ</span>}
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
                title={jugo
                  ? "Ya jugó: queda en la nómina marcado como de baja"
                  : "Quitar del plantel"}
                onClick={(e) => {
                  e.stopPropagation();
                  onEliminar?.(i);
                }}
              >
                {jugo ? "Dar de Baja" : "Quitar"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={styles.bloques}>
      {cuerpoTecnico.length > 0 && (
        <section>
          <h3 className={styles.bloqueTitulo}>
            Cuerpo técnico <span className={styles.bloqueCount}>{cuerpoTecnico.length}</span>
          </h3>
          {renderLista(cuerpoTecnico)}
        </section>
      )}

      {jugadores.length > 0 && (
        <section>
          <h3 className={styles.bloqueTitulo}>
            Jugadores <span className={styles.bloqueCount}>{jugadores.length}</span>
          </h3>
          {renderLista(jugadores)}
        </section>
      )}
    </div>
  );
}