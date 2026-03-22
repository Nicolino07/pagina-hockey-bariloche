import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getClubes } from "../../../api/clubes.api"
import type { Club } from "../../../types/club"
import styles from "./ClubesPage.module.css"

export default function ClubesPage() {
  const [clubes, setClubes] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    getClubes()
      .then(data => setClubes([...data].sort((a, b) => a.nombre.localeCompare(b.nombre))))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const clubesFiltrados = clubes.filter(c =>
    c.nombre.toLowerCase().includes(filtro.toLowerCase())
  )

  if (loading) return <div className={styles.loader}>Cargando clubes...</div>

  return (
    <div className={styles.container}>

      <button className={styles.backBtn} onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")}>← Volver</button>

      <header className={styles.header}>
        <h1 className={styles.title}>Clubes</h1>
        <p className={styles.subtitle}>Instituciones que forman parte de la liga</p>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar club..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </header>

      {clubesFiltrados.length === 0 ? (
        <p className={styles.noResults}>No se encontraron clubes para "{filtro}"</p>
      ) : (
        <div className={styles.tabla}>
          {/* Header de la tabla */}
          <div className={styles.tablaHeader}>
            <span className={styles.grupoIcono}>🏒</span>
            <span className={styles.tablaHeaderTitulo}>CLUBES AHBLS</span>
          </div>

          {/* Filas */}
          {clubesFiltrados.map(club => (
            <button
              key={club.id_club}
              className={styles.row}
              onClick={() => navigate(`/public/clubes/${club.id_club}`)}
            >
              <span className={styles.clubNombre}>{club.nombre}</span>
              {club.ciudad && (
                <span className={styles.clubCiudad}>📍 {club.ciudad}</span>
              )}
              <span className={styles.rowChevron}>›</span>
            </button>
          ))}
        </div>
      )}

    </div>
  )
}
