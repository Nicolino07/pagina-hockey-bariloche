import styles from "./PlantelLista.module.css"

interface PlantelItem {
  id_persona: number
  nombre: string
  apellido: string
  dni: string
  genero: "MASCULINO" | "FEMENINO"
  rol: string
  categoria?: string
  numero_camiseta?: number
}

interface Props {
  plantel: PlantelItem[]
}

const ORDEN_ROLES = [
  "ENTRENADOR",
  "ASISTENTE",
  "PREPARADOR_FISICO",
  "MEDICO",
  "DELEGADO",
  "JUGADOR",
]

export default function PlantelLista({ plantel }: Props) {
  if (!plantel || plantel.length === 0) {
    return <p className={styles.vacio}>Sin integrantes cargados</p>
  }

  // Agrupar por rol
  const plantelPorRol = plantel.reduce<Record<string, PlantelItem[]>>(
    (acc, persona) => {
      acc[persona.rol] = acc[persona.rol] || []
      acc[persona.rol].push(persona)
      return acc
    },
    {}
  )

  return (
    <div className={styles.contenedor}>
      {ORDEN_ROLES.filter((rol) => plantelPorRol[rol]).map((rol) => (
        <section key={rol} className={styles.seccion}>
          <h3 className={styles.tituloRol}>{formatearRol(rol)}</h3>

          <div className={styles.grid}>
            {plantelPorRol[rol].map((p) => (
              <div key={p.id_persona} className={styles.card}>
                <div className={styles.header}>
                  <strong>
                    {p.apellido}, {p.nombre}
                  </strong>

                  {p.numero_camiseta && (
                    <span className={styles.camiseta}>
                      #{p.numero_camiseta}
                    </span>
                  )}
                </div>

                <div className={styles.info}>
                  <span>DNI: {p.dni}</span>

                  {p.categoria && (
                    <span className={styles.categoria}>
                      Categoría {p.categoria}
                    </span>
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
