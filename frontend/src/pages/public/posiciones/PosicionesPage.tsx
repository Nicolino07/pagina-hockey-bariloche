import { useState, useEffect } from "react"
import { listarTorneos } from "../../../api/torneos.api"
import { obtenerPosiciones } from "../../../api/vistas/posiciones.api"
import  type { FilaPosiciones } from "../../../types/vistas"
import type { Torneo } from "../../../types/torneo"
import styles from "./PosicionesPage.module.css"



export default function PosicionesPublicas() {
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [idSeleccionado, setIdSeleccionado] = useState<number | null>(null)
  const [tabla, setTabla] = useState<FilaPosiciones[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTabla, setLoadingTabla] = useState(false)

  // Cargar torneos al inicio
  useEffect(() => {
    listarTorneos()
      .then(data => {
        setTorneos(data)
        // Opcional: seleccionar el primero por defecto
        if (data.length > 0) setIdSeleccionado(data[0].id_torneo)
      })
      .catch(err => console.error("Error al cargar torneos", err))
      .finally(() => setLoading(false))
  }, [])

  // Cargar tabla cuando cambie el torneo
    useEffect(() => {
        if (!idSeleccionado) return

        setLoadingTabla(true)
        
        // USAMOS LA FUNCIÓN QUE IMPORTASTE
        obtenerPosiciones(idSeleccionado)
        .then(data => {
            setTabla(data)
        })
        .catch(err => {
            console.error("Error al cargar posiciones", err)
            setTabla([]) // Limpiar en caso de error
        })
        .finally(() => setLoadingTabla(false))
    }, [idSeleccionado])

    if (loading) return <div className={styles.loading}>Cargando torneos...</div>
    
  return (

    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Tablas de Posiciones</h1>
        <p>Selecciona un torneo para ver las estadísticas en vivo</p>
      </header>

      {/* SELECTOR DE TORNEOS */}
      <div className={styles.selectorGrid}>
        {torneos.map((t) => (
          <button
            key={t.id_torneo}
            className={`${styles.card} ${idSeleccionado === t.id_torneo ? styles.active : ""}`}
            onClick={() => setIdSeleccionado(t.id_torneo)}
          >
            <span className={styles.torneoNombre}>{t.nombre}</span>
            <span className={styles.torneoMeta}>{t.categoria} - {t.genero}</span>
          </button>
        ))}
      </div>

      {/* CONTENEDOR DE TABLA */}

        <div className={styles.tableCard}>
        <div className={styles.responsiveScroll}>
            <table className={styles.posicionesTable}>
            <thead>
                <tr>
                <th>#</th>
                <th className={styles.alignLeft}>Equipo</th>
                <th title="Partidos Jugados">PJ</th>
                <th title="Partidos Ganados">PG</th>
                <th title="Partidos Empatados">PE</th>
                <th title="Partidos Perdidos">PP</th>
                <th className={styles.hideMobile} title="Goles a Favor">GF</th>
                <th className={styles.hideMobile} title="Goles en Contra">GC</th>
                <th title="Diferencia de Gol">DG</th>
                <th className={styles.puntosCol} title="Puntos">PTS</th>
                </tr>
            </thead>
            <tbody>
                {tabla.map((fila, index) => (
                <tr key={fila.id_equipo}>
                    <td className={styles.posicion}>{index + 1}</td>
                    <td className={styles.equipoNombre}>{fila.equipo}</td>
                    {/* Mapeo de Pydantic (snake_case) a la tabla */}
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
        </div>
      
        
    </div>
  )
}
    
  