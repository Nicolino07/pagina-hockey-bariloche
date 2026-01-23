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
      try {
        const data = await getClubes()
        setClubes(data)
      } finally {
        setLoading(false)
      }
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
        <button onClick={() => navigate("/admin/clubes/nuevo")}>
          + Nuevo club
        </button>
      </header>

      <div className={styles.list}>
        {clubes.map((club) => (
          <ClubCard
            key={club.id_club}
            club={club}
            onClick={(c) => navigate(`/admin/clubes/${c.id_club}`)}
          />
        ))}
      </div>
    </section>
  )
}
