import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getClubById } from "../../../api/clubes.api" 
import { getEquiposByClub } from "../../../api/equipos.api" // Necesitaremos esta función
import type { Club } from "../../../types/club"
import type { Equipo } from "../../../types/equipo"
import styles from "./ClubesDetallePublic.module.css"
import Button from "../../../components/ui/button/Button"


export default function ClubesDetallePublic() {
  const { id_club } = useParams<{ id_club: string }>()
  const navigate = useNavigate()
  
  const [club, setClub] = useState<Club | null>(null)
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id_club) return

    setLoading(true)
    // Cargamos la info del club y sus equipos
    Promise.all([
      getClubById(Number(id_club)),
      getEquiposByClub (Number(id_club))
    ])
      .then(([dataClub, dataEquipos]) => {
        setClub(dataClub)
        setEquipos(dataEquipos)
      })
      .catch(err => console.error("Error al cargar detalle del club:", err))
      .finally(() => setLoading(false))
  }, [id_club])

  if (loading) return <div className={styles.loader}>Cargando información del club...</div>
  if (!club) return <div className={styles.error}>No se encontró el club solicitado.</div>

  return (
    <div className={styles.container}>
       <Button variant="primary" size="md" onClick={() => navigate(-1)}>
        ← Volver
      </Button>
      {/* Portada / Header del Club */}
      <header className={styles.clubHeader}>
        <div className={styles.mainInfo}>
          <div className={styles.logoGrande}>
            {club.nombre.substring(0, 2).toUpperCase()}
          </div>
          <div className={styles.textos}>
            <h1 className={styles.clubName}>{club.nombre}</h1>
            <p className={styles.localidad}>📍 {club.ciudad || "Localidad no definida"}</p>
          </div>
        </div>
      </header>

      <section className={styles.content}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.title}>Nuestros Equipos</h2>
          <p className={styles.subtitle}>Selecciona una categoría para ver el plantel y estadísticas.</p>
        </div>

        {/* Grid de Equipos del Club */}
        <div className={styles.equiposGrid}>
          {equipos.length > 0 ? (
            equipos.map((equipo) => (
              <div 
                key={equipo.id_equipo} 
                className={styles.equipoCard}
                onClick={() => navigate(`/public/clubes/${id_club}/equipos/${equipo.id_equipo}`)}
              >
                <div className={styles.equipoHeader}>
                  <span className={styles.categoriaBadge}>Cat. {equipo.categoria || 'Libre'}</span>
                </div>
                <h3 className={styles.equipoNombre}>{equipo.nombre}</h3>
                <div className={styles.equipoFooter}>
                  <span>Ver plantel</span>
                  <span className={styles.arrow}>→</span>
                </div>
              </div>
            ))
          ) : (
            <p className={styles.noData}>Este club aún no tiene equipos registrados.</p>
          )}
        </div>
      </section>

  
    </div>
  )
}