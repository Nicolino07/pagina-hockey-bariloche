import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { useInscripcionesTorneo } from "../../../hooks/useInscripcionesTorneo"
import InscripcionesTorneoLista from "./InscripcionesTorneoLista"
import { useTorneo } from "../../../hooks/useTorneo"
import Button from "../../../components/ui/button/Button"
import InscribirEquipoModal from "./InscribirEquipoModal"
import { obtenerGoleadoresTorneo } from "../../../api/vistas/goleadores.api"
import { obtenerVallaMenosVencida } from "../../../api/vistas/valla.api"
import type { GoleadorTorneo, VallaMenosVencida } from "../../../types/vistas"

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
  const [goleadores, setGoleadores] = useState<GoleadorTorneo[]>([])
  const [valla, setValla] = useState<VallaMenosVencida[]>([])

  useEffect(() => {
    if (!torneoId) return
    Promise.all([
      obtenerGoleadoresTorneo(torneoId),
      obtenerVallaMenosVencida(torneoId),
    ]).then(([dataGol, dataValla]) => {
      setGoleadores(dataGol)
      setValla(dataValla)
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
