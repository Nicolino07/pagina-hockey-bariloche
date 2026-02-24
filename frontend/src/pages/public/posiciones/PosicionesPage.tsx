import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { listarTorneos } from "../../../api/torneos.api"
import { obtenerPosiciones } from "../../../api/vistas/posiciones.api"
import { obtenerTarjetasAcumuladas } from "../../../api/vistas/tarjetas.api"
import { obtenerGoleadoresTorneo } from "../../../api/vistas/goleadores.api"
// IMPORTANTE: Asegúrate de que esta ruta y nombre existan, antes tenías una confusión aquí
import { listarInscripcionesTorneo } from "../../../api/torneos.api" 

import type { Torneo } from "../../../types/torneo"
import type { FilaPosiciones, TarjetaAcumulada, GoleadorTorneo } from "../../../types/vistas"
import type { InscripcionTorneoDetalle } from "../../../types/inscripcion"

import styles from "./PosicionesPage.module.css"

export default function PosicionesPage() {
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate();

  const [torneoSeleccionado, setTorneoSeleccionado] = useState<Torneo | null>(null)
  const [tabla, setTabla] = useState<FilaPosiciones[]>([])
  const [tarjetas, setTarjetas] = useState<TarjetaAcumulada[]>([])
  const [goleadores, setGoleadores] = useState<GoleadorTorneo[]>([])
  const [equipos, setEquipos] = useState<InscripcionTorneoDetalle[]>([])
  const [loadingDatos, setLoadingDatos] = useState(false)

  // 1. Cargar lista de torneos al inicio
  useEffect(() => {
    listarTorneos()
      .then(data => setTorneos(data))
      .catch(err => console.error("Error al cargar torneos:", err))
      .finally(() => setLoading(false))
  }, [])

  // 2. UN SOLO useEffect para cargar todo lo del torneo seleccionado
  useEffect(() => {
    if (!torneoSeleccionado) return

    setLoadingDatos(true)
    
    // Ejecutamos todas las peticiones en paralelo para mejor rendimiento
    Promise.all([
      obtenerPosiciones(torneoSeleccionado.id_torneo),
      obtenerTarjetasAcumuladas(torneoSeleccionado.id_torneo),
      obtenerGoleadoresTorneo(torneoSeleccionado.id_torneo),
      listarInscripcionesTorneo(torneoSeleccionado.id_torneo)
    ])
      .then(([dataPos, dataTar, dataGol, dataEq]) => {
        setTabla(dataPos)
        setTarjetas(dataTar)
        setGoleadores(dataGol)
        setEquipos(dataEq)
      })
      .catch(err => console.error("Error cargando datos del torneo:", err))
      .finally(() => setLoadingDatos(false))
  }, [torneoSeleccionado])

  if (loading) return <div className={styles.loader}>Cargando torneos...</div>

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Torneos Activos</h1>
        <p className={styles.subtitle}>Selecciona un torneo para ver sus estadísticas.</p>
      </header>

      {/* GRID DE SELECCIÓN */}
      <div className={styles.grid}>
        {torneos.map((torneo) => (
          <article 
            key={torneo.id_torneo} 
            className={`${styles.card} ${torneoSeleccionado?.id_torneo === torneo.id_torneo ? styles.activeCard : ""}`}
            onClick={() => setTorneoSeleccionado(torneo)}
          >
            <span className={styles.badge}>{torneo.genero}</span>
            <h2 className={styles.torneoNombre}>{torneo.nombre} - {new Date(torneo.fecha_inicio).getFullYear()}</h2>
            <p className={styles.categoria}>Categoría {torneo.categoria}</p>
          </article>
        ))}
      </div>

      {torneoSeleccionado && (
        <section className={styles.detailsSection}>
          <h2 className={styles.sectionTitle}>
            Estadísticas - {torneoSeleccionado.nombre} 
          </h2>

          {loadingDatos ? (
            <p className={styles.infoMsg}>Cargando datos del torneo...</p>
          ) : (
            <>
              {/* TABLA DE POSICIONES */}
              <div className={styles.tableCard}>
                <h3 className={styles.statsTitle}>Tabla de Posiciones</h3>
                {tabla.length > 0 ? (
                  <div className={styles.responsiveScroll}>
                    <table className={styles.posicionesTable}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th className={styles.alignLeft}>Equipo</th>
                          <th>PJ</th><th>PG</th><th>PE</th><th>PP</th>
                          <th className={styles.hideMobile}>GF</th>
                          <th className={styles.hideMobile}>GC</th>
                          <th>DG</th>
                          <th className={styles.puntosCol}>PTS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabla.map((fila, index) => (
                          <tr key={fila.id_equipo}>
                            <td>{index + 1}</td>
                            <td className={styles.equipoNombre}>{fila.equipo}</td>
                            <td>{fila.partidos_jugados}</td>
                            <td>{fila.ganados}</td>
                            <td>{fila.empatados}</td>
                            <td>{fila.perdidos}</td>
                            <td className={styles.hideMobile}>{fila.goles_a_favor}</td>
                            <td className={styles.hideMobile}>{fila.goles_en_contra}</td>
                            <td>{fila.diferencia_gol}</td>
                            <td className={styles.puntosValor}>{fila.puntos}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className={styles.infoSmall}>No hay posiciones registradas.</p>}
              </div>

              {/* GRILLA DE GOLEADORES Y TARJETAS */}
              <div className={styles.statsGrid}>
                {/* GOLEADORES */}
                <div className={styles.statsCard}>
                  <h3 className={styles.statsTitle}>Goleadores</h3>
                  {goleadores.length > 0 ? (
                    <table className={styles.statsTable}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th className={styles.alignLeft}>Jugador</th>
                          <th>Goles</th>
                        </tr>
                      </thead>
                      <tbody>
                        {goleadores.slice(0, 5).map((g) => (
                          <tr key={g.id_persona}>
                            <td>{g.ranking_en_torneo}</td>
                            <td className={styles.alignLeft}>
                              <div className={styles.playerName}>{g.nombre} {g.apellido}</div>
                              <div className={styles.playerTeam}>{g.nombre_equipo}</div>
                            </td>
                            <td className={styles.bold}>{g.goles_netos_en_torneo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p className={styles.infoSmall}>Sin goles.</p>}
                </div>

                {/* TARJETAS */}
                <div className={styles.statsCard}>
                  <h3 className={styles.statsTitle}>Tarjetas</h3>
                  {tarjetas.length > 0 ? (
                    <table className={styles.statsTable}>
                      <thead>
                        <tr>
                          <th className={styles.alignLeft}>Jugador</th>
                          <th><span className={styles.boxVerde}>V</span></th>
                          <th><span className={styles.boxAmarilla}>A</span></th>
                          <th><span className={styles.boxRoja}>R</span></th>
                          <th><span className={styles.boxTotal}>Total</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {tarjetas.slice(0, 5).map(t => (
                          <tr key={t.id_persona}>
                            <td className={styles.alignLeft}>
                              <div className={styles.playerName}>{t.nombre_persona} {t.apellido_persona}</div>
                              <div className={styles.playerTeam}>{t.equipo}</div>
                            </td>
                            <td>{t.total_verdes}</td>
                            <td>{t.total_amarillas}</td>
                            <td>{t.total_rojas}</td>
                            <td>{t.total_tarjetas}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p className={styles.infoSmall}>Sin tarjetas.</p>}
                </div>
              </div>

              {/* SECCIÓN EQUIPOS */}
              <div className={styles.equiposDivider}>
                <h3 className={styles.statsTitle}>Equipos Inscriptos</h3>
                <div className={styles.equiposGrid}>
                  {equipos.map((eq) => (
                    <button 
                      key={eq.id_equipo} 
                      className={styles.equipoItem}
                      onClick={() => navigate(`/public/clubes/${eq.id_club}/equipos/${eq.id_equipo}`)}
                    >
            
                      <div className={styles.equipoInfo}>
                        <span className={styles.equipoName}>{eq.nombre_equipo}</span>
                        <span className={styles.equipoLabel}>Ver plantel →</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}