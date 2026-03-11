import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { useInscripcionesTorneo } from "../../../hooks/useInscripcionesTorneo"
import InscripcionesTorneoLista from "./InscripcionesTorneoLista"
import { useTorneo } from "../../../hooks/useTorneo"
import Button from "../../../components/ui/button/Button"
import InscribirEquipoModal from "./InscribirEquipoModal"
import { obtenerGoleadoresTorneo } from "../../../api/vistas/goleadores.api"
import { obtenerVallaMenosVencida } from "../../../api/vistas/valla.api"
import { obtenerPosiciones } from "../../../api/vistas/posiciones.api"
import { obtenerTarjetasAcumuladas } from "../../../api/vistas/tarjetas.api"
import type { GoleadorTorneo, VallaMenosVencida, FilaPosiciones, TarjetaAcumulada } from "../../../types/vistas"

import styles from "./TorneoDetalle.module.css"

export default function TorneoDetalle() {
  const { idTorneo } = useParams<{ idTorneo: string }>()
  const torneoId = Number(idTorneo)
  const navigate = useNavigate();
  const { torneo, loading: loadingTorneo } = useTorneo(torneoId)
  const {
    inscripciones,
    loading: loadingInscripciones,
    error,
    baja,
    refetch,
  } = useInscripcionesTorneo(torneoId)

  const [open, setOpen] = useState(false)
  const [tabla, setTabla] = useState<FilaPosiciones[]>([])
  const [goleadores, setGoleadores] = useState<GoleadorTorneo[]>([])
  const [valla, setValla] = useState<VallaMenosVencida[]>([])
  const [tarjetas, setTarjetas] = useState<TarjetaAcumulada[]>([])

  useEffect(() => {
    if (!torneoId) return
    Promise.all([
      obtenerPosiciones(torneoId),
      obtenerGoleadoresTorneo(torneoId),
      obtenerVallaMenosVencida(torneoId),
      obtenerTarjetasAcumuladas(torneoId),
    ]).then(([dataPos, dataGol, dataValla, dataTar]) => {
      setTabla(dataPos)
      setGoleadores(dataGol)
      setValla(dataValla)
      setTarjetas(dataTar)
    }).catch(err => console.error("Error cargando estadísticas:", err))
  }, [torneoId])

  const handleInscripto = () => {
    refetch()
  }

  if (loadingTorneo || loadingInscripciones) return <p>Cargando…</p>
  if (error || !torneo) return <p>Error</p>

  return (
    <section className={styles.section}>
      {/* HEADER */}
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{torneo.nombre}</h2>
          <p className={styles.meta}>
            Categoría {torneo.categoria} – {torneo.genero} –{" "}
            {new Date(torneo.fecha_inicio).getFullYear()}
          </p>
        </div>
        <div className={styles.botones}>
          <Button onClick={() => setOpen(true)}>
          ➕ Inscribir equipo
          </Button>
          <Button onClick={() => navigate("/admin/torneos")}>← Volver</Button>
        </div>
      </header>

      {/* LISTA */}
      <InscripcionesTorneoLista
        inscripciones={inscripciones}
        onBaja={baja}
      />

      {/* TABLA DE POSICIONES */}
      <div className={styles.tableCard}>
        <h3 className={styles.statsTitle}>Tabla de posiciones</h3>
        {tabla.length > 0 ? (
          <div className={styles.responsiveScroll}>
            <table className={styles.posicionesTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Equipo</th>
                  <th>PTS</th>
                  <th>PJ</th><th>PG</th><th>PE</th><th>PP</th>
                  <th>GF</th><th>GC</th><th>DG</th>
                </tr>
              </thead>
              <tbody>
                {tabla.map((fila, index) => (
                  <tr key={fila.id_equipo}>
                    <td>{index + 1}</td>
                    <td>{fila.equipo}</td>
                    <td><strong>{fila.puntos}</strong></td>
                    <td>{fila.partidos_jugados}</td>
                    <td>{fila.ganados}</td>
                    <td>{fila.empatados}</td>
                    <td>{fila.perdidos}</td>
                    <td>{fila.goles_a_favor}</td>
                    <td>{fila.goles_en_contra}</td>
                    <td>{fila.diferencia_gol}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className={styles.infoSmall}>Sin posiciones registradas.</p>}
      </div>

      {/* ESTADÍSTICAS */}
      <div className={styles.statsGrid}>
        {/* GOLEADORES */}
        <div className={styles.statsCard}>
          <h3 className={styles.statsTitle}>Goleadores</h3>
          {goleadores.length > 0 ? (
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Jugador</th>
                  <th>Goles</th>
                </tr>
              </thead>
              <tbody>
                {goleadores.slice(0, 5).map((g) => (
                  <tr key={g.id_persona}>
                    <td>{g.ranking_en_torneo}</td>
                    <td>
                      <div>{g.nombre} {g.apellido}</div>
                      <div className={styles.subText}>{g.nombre_equipo}</div>
                    </td>
                    <td className={styles.bold}>{g.goles_netos_en_torneo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className={styles.infoSmall}>Sin goles registrados.</p>}
        </div>

        {/* VALLA MENOS VENCIDA */}
        <div className={styles.statsCard}>
          <h3 className={styles.statsTitle}>Valla menos vencida</h3>
          {valla.length > 0 ? (
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Equipo</th>
                  <th>GC</th>
                  <th>PJ</th>
                </tr>
              </thead>
              <tbody>
                {valla.slice(0, 5).map((v) => (
                  <tr key={v.id_equipo}>
                    <td>{v.ranking_en_torneo}</td>
                    <td>
                      <div>{v.nombre_equipo}</div>
                      <div className={styles.subText}>{v.nombre_club}</div>
                    </td>
                    <td className={styles.bold}>{v.goles_en_contra}</td>
                    <td>{v.partidos_jugados}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className={styles.infoSmall}>Sin datos registrados.</p>}
        </div>
        {/* TARJETAS */}
        <div className={styles.statsCard}>
          <h3 className={styles.statsTitle}>Tarjetas</h3>
          {tarjetas.length > 0 ? (
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>V</th>
                  <th>A</th>
                  <th>R</th>
                </tr>
              </thead>
              <tbody>
                {tarjetas.slice(0, 5).map((t) => (
                  <tr key={t.id_persona}>
                    <td>
                      <div>{t.nombre_persona} {t.apellido_persona}</div>
                      <div className={styles.subText}>{t.equipo}</div>
                    </td>
                    <td>{t.total_verdes}</td>
                    <td>{t.total_amarillas}</td>
                    <td className={t.total_rojas > 0 ? styles.bold : ""}>{t.total_rojas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className={styles.infoSmall}>Sin tarjetas registradas.</p>}
        </div>
      </div>

      {/* MODAL */}
      {open && (
        <InscribirEquipoModal
          torneo={torneo}
          inscripciones={inscripciones}
          onClose={() => setOpen(false)}
          onInscripto={handleInscripto}
        />
      )}
    </section>
  )
}
