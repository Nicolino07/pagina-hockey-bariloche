import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"
import { useState } from "react"
import styles from "./NavBar.module.css"

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/")
    setMenuOpen(false)
  }

  const isSuper = user?.rol === "SUPERUSUARIO"
  const isAdminOrSuper = user?.rol === "ADMIN" || isSuper

  const close = () => setMenuOpen(false)

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.logo}>
          <Link to="/">Hockey Bariloche</Link>
        </div>

        {/* ---- NAV DESKTOP ---- */}
        <nav className={styles.desktopNav}>
          <Link to="/">Inicio</Link>
          <Link to="/public/clubes">Clubes</Link>
          <Link to="/public/posiciones">Posiciones</Link>
          <Link to="/fixture">Fixture</Link>

          {isAuthenticated && (
            <>
              <span className={styles.separator} />
              <Link to="/admin">Panel</Link>
              <Link to="/admin/fixture">Fixture</Link>
              <Link to="/admin/partidos">Partidos</Link>
              <Link to="/admin/noticias">Noticias</Link>
              <Link to="/admin/fichajes">Fichajes</Link>

              {isAdminOrSuper && (
                <>
                  <Link to="/admin/torneos">Torneos</Link>
                  <Link to="/admin/personas">Personas</Link>
                </>
              )}

              {isSuper && (
                <Link to="/login/usuarios" className={styles.superLink}>
                  Staff
                </Link>
              )}
            </>
          )}
        </nav>

        {/* ---- DERECHA DESKTOP: usuario + salir / ingresar ---- */}
        <div className={styles.desktopRight}>
          {isAuthenticated ? (
            <>
              <span className={styles.userChip}>{user?.email}</span>
              <button onClick={handleLogout} className={styles.logoutBtn}>Salir</button>
            </>
          ) : (
            <Link to="/login" className={styles.loginLink}>Ingresar</Link>
          )}
        </div>

        {/* ---- HAMBURGUESA (solo mobile) ---- */}
        <button className={styles.menuToggle} onClick={() => setMenuOpen(true)}>
          ☰
        </button>
      </header>

      {/* Overlay */}
      <div
        className={`${styles.overlay} ${menuOpen ? styles.show : ""}`}
        onClick={close}
      />

      {/* Sidebar (solo mobile) */}
      <aside className={`${styles.sidebar} ${menuOpen ? styles.open : ""}`}>
        <button className={styles.closeBtn} onClick={close}>✕</button>

        <nav className={styles.menu}>
          <Link to="/" onClick={close}>Inicio</Link>
          <Link to="/public/clubes" onClick={close}>Clubes</Link>
          <Link to="/public/posiciones" onClick={close}>Posiciones</Link>
          <Link to="/fixture" onClick={close}>Fixture</Link>

          {isAuthenticated && (
            <>
              <hr />
              <Link to="/admin" onClick={close}>Panel</Link>
              <Link to="/admin/fixture" onClick={close}>Fixture</Link>
              <Link to="/admin/partidos" onClick={close}>Partidos</Link>
              <Link to="/admin/noticias" onClick={close}>Noticias</Link>
              <Link to="/admin/fichajes" onClick={close}>Fichajes</Link>

              {isAdminOrSuper && (
                <>
                  <Link to="/admin/clubes" onClick={close}>Clubes (Admin)</Link>
                  <Link to="/admin/torneos" onClick={close}>Torneos</Link>
                  <Link to="/admin/personas" onClick={close}>Personas</Link>
                </>
              )}

              {isSuper && (
                <Link to="/login/usuarios" className={styles.superLink} onClick={close}>
                  Gestionar Staff
                </Link>
              )}

              <hr />
              <div className={styles.userInfo}>
                <span>{user?.email}</span>
                <span>{user?.rol}</span>
              </div>
              <button onClick={handleLogout} className={styles.logout}>Salir</button>
            </>
          )}

          {!isAuthenticated && (
            <Link to="/login" onClick={close}>Ingresar</Link>
          )}
        </nav>
      </aside>
    </>
  )
}