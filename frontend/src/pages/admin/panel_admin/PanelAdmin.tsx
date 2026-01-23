
import { Link } from "react-router-dom"
import styles from "./PanelAdmin.module.css"

export default function PanelAdmin() {
  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <h1 className={styles.title}>Panel Administrativo</h1>
        <p className={styles.subtitle}>
          Gestión de clubes, equipos, torneos y partidos
        </p>
      </header>

      <section className={styles.cards}>
        <Link to="/admin/clubes" className={styles.card}>
          Clubes
        </Link>

        <Link to="/admin/torneos" className={styles.card}>
          Torneos
        </Link>

        <Link to="/admin/partidos" className={styles.card}>
          Partidos
        </Link>
      </section>
    </div>
  )
}
