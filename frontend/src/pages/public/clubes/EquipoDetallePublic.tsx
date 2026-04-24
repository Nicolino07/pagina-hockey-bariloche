import { useParams, useNavigate } from "react-router-dom"
import { usePlantelActivo } from "../../../hooks/usePlantelActivo" // Ajusta la ruta
import { useState, useEffect } from "react"
import { getEquipoById } from "../../../api/equipos.api"
import type { Equipo } from "../../../types/equipo"
import styles from "./EquipoDetallePublic.module.css"

/**
 * Página pública de detalle de un equipo.
 * Muestra los integrantes del plantel activo del equipo indicado por URL.
 */
export default function EquipoDetallePublic() {
  const { id_equipo, id_club } = useParams<{ id_equipo: string; id_club: string }>()
  const navigate = useNavigate()
  
  const [equipo, setEquipo] = useState<Equipo | null>(null)
  
  // Usamos hook
  const { integrantes, loading, error, hasPlantel } = usePlantelActivo(Number(id_equipo))

  useEffect(() => {
    if (id_equipo) {
      getEquipoById(Number(id_equipo))
        .then(setEquipo)
        .catch(console.error)
    }
  }, [id_equipo])

  if (loading) return <div className={styles.loader}>Cargando plantel...</div>
  if (error) return <div className={styles.error}>{error}</div>
  if (!equipo) return <div className={styles.error}>Equipo no encontrado.</div>

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => window.history.length > 1 ? navigate(-1) : navigate(id_club ? `/public/clubes/${id_club}` : "/public/clubes")}>← Volver</button>
        <div className={styles.equipoTitleBlock}>
          <h1 className={styles.title}>{equipo.nombre}</h1>
          <p className={styles.equipoMeta}>
            {equipo.categoria}{equipo.division ? ` ${equipo.division}` : ""} · {equipo.genero}
          </p>
          <span className={styles.badge}>
            {hasPlantel ? "Plantel Confirmado" : "Sin Plantel"}
          </span>
        </div>
      </header>

      <div className={styles.mainGrid}>
        <section className={styles.plantelSection}>
          <h2 className={styles.sectionTitle}>Integrantes del Equipo</h2>
          
          <div className={styles.jugadoresGrid}>
            {integrantes.length > 0 ? (
              integrantes.map((jugador) => (
                <article key={jugador.id_plantel_integrante ?? jugador.id_persona} className={styles.playerCard}>
                  <div className={styles.numberBadge}>
                    {jugador.numero_camiseta || '—'}
                  </div>
                  <div className={styles.playerInfo}>
                    <p className={styles.playerName}>
                      {jugador.nombre_persona} {jugador.apellido_persona}
                    </p>
                    <p className={styles.playerRole}>{jugador.rol_en_plantel || 'Jugador'}</p>
                  </div>
                </article>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No hay jugadores registrados en este plantel todavía.</p>
              </div>
            )}
          </div>
        </section>

    
      </div>
    </div>
  )
}