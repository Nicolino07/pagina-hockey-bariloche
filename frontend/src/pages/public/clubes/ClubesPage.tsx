import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getClubes } from "../../../api/clubes.api" // Ajusta la ruta según tu estructura
import type { Club } from "../../../types/club"
import styles from "./ClubesPage.module.css"

export default function ClubesPage() {
  const [clubes, setClubes] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    getClubes()
      .then(data => setClubes(data))
      .catch(err => console.error("Error:", err))
      .finally(() => setLoading(false))
  }, [])

  // Filtrado simple por nombre
  const clubesFiltrados = clubes.filter(c => 
    c.nombre.toLowerCase().includes(filtro.toLowerCase())
  )

  if (loading) return <div className={styles.loader}>Cargando instituciones...</div>

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Nuestros Clubes</h1>
        <p className={styles.subtitle}>Explora las instituciones que forman parte de la liga.</p>
        
        <div className={styles.searchBar}>
          <input 
            type="text" 
            placeholder="Buscar club por nombre..." 
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </header>

      <div className={styles.grid}>
        {clubesFiltrados.map((club) => (
          <article 
            key={club.id_club} 
            className={styles.clubCard}
            onClick={() => navigate(`/public/clubes/${club.id_club}`)}
          >
            <div className={styles.logoContainer}>
              {/* Aquí irá la imagen del logo en el futuro */}
              <div className={styles.logoPlaceholder}>
                {club.nombre.substring(0, 2).toUpperCase()}
              </div>
            </div>
            <div className={styles.clubInfo}>
              <h2 className={styles.clubName}>{club.nombre}</h2>
              {club.ciudad && <p className={styles.localidad}>{club.ciudad}</p>}
              <button className={styles.viewBtn}>Ver Equipos</button>
            </div>
          </article>
        ))}
      </div>

      {clubesFiltrados.length === 0 && !loading && (
        <div className={styles.noResults}>
          No se encontraron clubes que coincidan con "{filtro}"
        </div>
      )}
    </div>
  )
}