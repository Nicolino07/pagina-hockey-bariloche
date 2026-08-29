import type { ReactNode } from "react"
import type { FilaTablaAnual, Temporada } from "../../types/temporada"
import styles from "./TablaAnual.module.css"

interface Props {
  temporada: Temporada
  filas: FilaTablaAnual[]
  loading?: boolean
  /**
   * Cuántos equipos clasifican al playoff anual. Con un valor, la tabla marca
   * el corte con una línea para que se vea de un vistazo quién entra.
   */
  cupos?: number | null
  /** Acciones de admin (generar el playoff anual). */
  acciones?: ReactNode
}

/**
 * Tabla de posiciones anual de una temporada: la suma de los torneos que la
 * temporada marcó como REGULAR (típicamente Apertura + Clausura).
 *
 * Las acciones entran por prop en vez de estar cableadas acá, para que la misma
 * tabla sirva en modo lectura y con los botones de generar el playoff anual.
 */
export default function TablaAnual({ temporada, filas, loading, cupos, acciones }: Props) {
  const torneosQueSuman = temporada.torneos.filter(t => t.rol_en_temporada === "REGULAR")

  if (loading) {
    return <p className={styles.info}>Cargando tabla anual…</p>
  }

  if (torneosQueSuman.length === 0) {
    return (
      <div className={styles.card}>
        <h3 className={styles.titulo}>Tabla anual {temporada.anio}</h3>
        <p className={styles.info}>
          Esta temporada todavía no tiene torneos que sumen a la tabla anual.
          Asignale al menos uno con el rol «Suma a la anual».
        </p>
      </div>
    )
  }

  const totalTorneos = torneosQueSuman.length

  return (
    <>
      <div className={styles.card}>
        <h3 className={styles.titulo}>Tabla anual {temporada.anio}</h3>
        <p className={styles.subtitulo}>
          Suma de: {torneosQueSuman.map(t => t.nombre).join("  +  ")}
        </p>

        {filas.length > 0 ? (
          <div className={styles.scroll}>
            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th>#</th>
                  <th className={styles.alignLeft}>Equipo</th>
                  <th className={styles.puntosCol}>PTS</th>
                  <th>PJ</th><th>PG</th><th>PE</th><th>PP</th>
                  <th className={styles.hideMobile}>GF</th>
                  <th className={styles.hideMobile}>GC</th>
                  <th>DG</th>
                </tr>
              </thead>
              <tbody>
                {filas.map(fila => {
                  const clasifica = cupos != null && fila.puesto <= cupos
                  const ultimoQueEntra = cupos != null && fila.puesto === cupos
                  return (
                    <tr
                      key={fila.id_equipo}
                      className={[
                        clasifica ? styles.clasifica : "",
                        ultimoQueEntra ? styles.corte : "",
                      ].filter(Boolean).join(" ")}
                    >
                      <td>{fila.puesto}</td>
                      <td className={styles.equipo}>
                        {fila.equipo}
                        {/* Jugó menos torneos que los que suman: entra igual con
                            lo que hizo, pero conviene que se vea. */}
                        {fila.torneos_computados < totalTorneos && (
                          <span
                            className={styles.parcial}
                            title={`Jugó ${fila.torneos_computados} de ${totalTorneos} torneos del año`}
                          >
                            {fila.torneos_computados}/{totalTorneos}
                          </span>
                        )}
                      </td>
                      <td className={styles.puntos}>{fila.puntos}</td>
                      <td>{fila.partidos_jugados}</td>
                      <td>{fila.ganados}</td>
                      <td>{fila.empatados}</td>
                      <td>{fila.perdidos}</td>
                      <td className={styles.hideMobile}>{fila.goles_a_favor}</td>
                      <td className={styles.hideMobile}>{fila.goles_en_contra}</td>
                      <td>{fila.diferencia_gol}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.info}>
            Todavía no hay partidos jugados en los torneos de esta temporada.
          </p>
        )}
      </div>

      {acciones}
    </>
  )
}
