// pages/admin/clubes/clubes.tsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import styles from "./Clubes.module.css"
import ClubCard from "../../../components/clubes/ClubCard"
import { getClubes } from "../../../api/clubes.api"
import type { Club } from "../../../types/club"

export default function Clubes() {
  const [clubes, setClubes] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const loadClubes = async () => {
      const data = await getClubes()
      setClubes(data)
      setLoading(false)
    }

    loadClubes()
  }, [])

  if (loading) {
    return <p>Cargando clubes…</p>
  }

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h1>Clubes</h1>
        <button
          className={styles.primaryButton}
          onClick={() => navigate("/admin/clubes/nuevo")}
        >
          + Nuevo club
        </button>
      </header>

      <div className={styles.list}>
        {clubes.length === 0 && (
          <p className={styles.empty}>
            No hay clubes cargados
          </p>
        )}

        {clubes.map((club) => (
          <ClubCard
            key={club.id_club}
            club={club}
            onClick={() =>
              navigate(`/admin/clubes/${club.id_club}`)
            }
          />
        ))}
      </div>
    </section>
  )
}
