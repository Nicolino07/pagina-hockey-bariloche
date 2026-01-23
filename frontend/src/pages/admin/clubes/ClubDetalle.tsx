import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import styles from "./ClubDetalle.module.css"
import { getClubById } from "../../../api/clubes.api"
import type { Club } from "../../../types/club"

export default function ClubDetalle() {
  const { id_club } = useParams<{ id_club: string }>()
  const navigate = useNavigate()

  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id_club) return

    const loadClub = async () => {
      try {
        const data = await getClubById(Number(id_club))
        setClub(data)
      } finally {
        setLoading(false)
      }
    }

    loadClub()
  }, [id_club])

  if (loading) return <p>Cargando club…</p>
  if (!club) return <p>Club no encontrado</p>

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <button
            className={styles.backButton}
            onClick={() => navigate("/admin/clubes")}
        >
            ← Volver
        </button>

        <div className={styles.title}>
            <h1>{club.nombre}</h1>
            <span className={styles.city}>{club.ciudad}</span>
        </div>

        <div className={styles.actions}>
            <button className={styles.edit}>Editar</button>
            <button className={styles.delete}>Eliminar</button>
        </div>
        </header>

        <section className={styles.section}>
        <div className={styles.sectionHeader}>
            <h2>Equipos</h2>
            <button>+ Nuevo equipo</button>
        </div>

        <p className={styles.empty}>Este club aún no tiene equipos</p>
        </section>
    </section>
  )
}
