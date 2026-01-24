import styles from "./PlantelLista.module.css"
import type { PlantelIntegrante } from "../../../types/plantelIntegrante"

interface Props {
  integrantes: PlantelIntegrante[]
}

const ORDEN_ROLES = [
  "ENTRENADOR",
  "ASISTENTE",
  "PREPARADOR_FISICO",
  "MEDICO",
  "DELEGADO",
  "JUGADOR",
]

export default function PlantelLista({ integrantes }: Props) {
  if (!integrantes || integrantes.length === 0) {
    return <p className={styles.vacio}>Sin integrantes cargados</p>
  }

  // Agrupar por rol en plantel
  const plantelPorRol = integrantes.reduce<
    Record<string, PlantelIntegrante[]>
  >((acc, integrante) => {
    const rol = integrante.rol_en_plantel
    acc[rol] = acc[rol] || []
    acc[rol].push(integrante)
    return acc
  }, {})

  return (
    <div className={styles.contenedor}>
      {ORDEN_ROLES.filter((rol) => plantelPorRol[rol]).map((rol) => (
        <section key={rol} className={styles.seccion}>
          <h3 className={styles.tituloRol}>
            {formatearRol(rol)}
          </h3>

          <div className={styles.grid}>
            {plantelPorRol[rol].map((i) => (
              <div
                key={i.id_plantel_integrante}
                className={styles.card}
              >
                <div className={styles.header}>
                  <strong>
                    {i.persona?.apellido}, {i.persona?.nombre}
                  </strong>

                  {i.numero_camiseta && (
                    <span className={styles.camiseta}>
                      #{i.numero_camiseta}
                    </span>
                  )}
                </div>

                <div className={styles.info}>
                  {i.persona?.documento && (
                    <span>DNI: {i.persona.documento}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function formatearRol(rol: string) {
  return rol
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase())
}
