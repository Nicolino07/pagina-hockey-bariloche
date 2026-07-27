
import { Link } from "react-router-dom"
import styles from "./PanelAdmin.module.css"
import { useAuth } from "../../../auth/AuthContext"

/**
 * Dashboard principal del panel administrativo.
 * Muestra accesos directos según el rol del usuario:
 * - ADMIN_ARBITROS solo ve la designación de árbitros.
 * - EDITOR/ADMIN/SUPERUSUARIO ven las secciones de gestión habituales.
 */
export default function PanelAdmin() {
  const { user } = useAuth()
  const rol = user?.rol

  const esArbitros = rol === "ADMIN_ARBITROS"
  const puedeGestion = rol === "EDITOR" || rol === "ADMIN" || rol === "SUPERUSUARIO"
  const puedeArbitros = esArbitros || rol === "SUPERUSUARIO"
  const puedeSuspensiones = rol === "ADMIN" || rol === "SUPERUSUARIO"

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <h1 className={styles.title}>Panel Administrativo</h1>
        <p className={styles.subtitle}>
          {esArbitros
            ? "Designación de árbitros"
            : "Gestión de clubes, equipos, torneos y partidos"}
        </p>
      </header>

      <section className={styles.cards}>
        {puedeGestion && (
          <>
            <Link to="/admin/clubes" className={styles.card}>
              Clubes
            </Link>

            <Link to="/admin/torneos" className={styles.card}>
              Torneos
            </Link>

            <Link to="/admin/personas" className={styles.card}>
              Personas
            </Link>

            <Link to="/admin/noticias" className={styles.card}>
              Noticias
            </Link>

            <Link to="/admin/fichajes" className={styles.card}>
              Fichajes
            </Link>
          </>
        )}

        {puedeArbitros && (
          <Link to="/admin/arbitros" className={styles.card}>
            Designación de árbitros
          </Link>
        )}

        {puedeSuspensiones && (
          <Link to="/admin/suspensiones" className={styles.card}>
            Suspensiones
          </Link>
        )}
      </section>
    </div>
  )
}
