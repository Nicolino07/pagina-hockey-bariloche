import { useState, useEffect } from "react"
import { listarTorneos } from "../../../api/torneos.api"
import type { Torneo } from "../../../types/torneo"
import Button from "../../../components/ui/button/Button"
import styles from "./TorneosPage.module.css"

export default function TorneosPage() {
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listarTorneos()
      .then(data => setTorneos(data))
      .catch(err => console.error("Error al cargar torneos:", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className={styles.loader}>Cargando torneos...</div>

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Torneos Activos</h1>
          <p className={styles.subtitle}>Selecciona un torneo para explorar estadísticas, cruces y resultados.</p>
        </div>
      </header>

      <div className={styles.grid}>
        {torneos.map((torneo) => (
          <article key={torneo.id_torneo} className={styles.card}>
            <div className={styles.cardInfo}>
              <span className={styles.badge}>{torneo.genero}</span>
              <h2 className={styles.torneoNombre}>{torneo.nombre}</h2>
              <p className={styles.categoria}>Categoría: {torneo.categoria}</p>
            </div>
            
            <div className={styles.cardFooter}>
              <Button onClick={() => window.location.href = `/public/posiciones?id=${torneo.id_torneo}`}>
                Ver Posiciones
              </Button>
              <Button variant="secondary">
                Resultados
              </Button>
            </div>
          </article>
        ))}
      </div>

      {torneos.length === 0 && (
        <div className={styles.empty}>
          <p>No hay torneos disponibles en este momento.</p>
        </div>
      )}
    </div>
  )
}