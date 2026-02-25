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

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.logo}>
          <Link to="/">Hockey Bariloche</Link>
        </div>

        <button
          className={styles.menuToggle}
          onClick={() => setMenuOpen(true)}
        >
          ☰
        </button>
      </header>

      {/* Overlay */}
      <div
        className={`${styles.overlay} ${menuOpen ? styles.show : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${menuOpen ? styles.open : ""}`}>
        <button
          className={styles.closeBtn}
          onClick={() => setMenuOpen(false)}
        >
          ✕
        </button>

        <nav className={styles.menu}>
          {/* Públicos */}
          <Link to="/" onClick={() => setMenuOpen(false)}>Inicio</Link>
          <Link to="/public/clubes" onClick={() => setMenuOpen(false)}>Clubes</Link>
          <Link to="/public/posiciones" onClick={() => setMenuOpen(false)}>Posiciones</Link>

          {isAuthenticated && (
            <>
              <hr />
              <Link to="/admin" onClick={() => setMenuOpen(false)}>Panel</Link>
              <Link to="/admin/partidos" onClick={() => setMenuOpen(false)}>Partidos</Link>
              <Link to="/admin/noticias" onClick={() => setMenuOpen(false)}>Noticias</Link>

              {isAdminOrSuper && (
                <>
                  <Link to="/admin/clubes" onClick={() => setMenuOpen(false)}>Clubes</Link>
                  <Link to="/admin/torneos" onClick={() => setMenuOpen(false)}>Torneos</Link>
                  <Link to="/admin/personas" onClick={() => setMenuOpen(false)}>Personas</Link>
                </>
              )}

              {isSuper && (
                <Link to="/login/usuarios" className={styles.superLink}
                  onClick={() => setMenuOpen(false)}>
                  👥 Gestionar Staff
                </Link>
              )}

              <hr />

              <div className={styles.userInfo}>
                <span>{user?.email}</span>
                <span>{user?.rol}</span>
              </div>

              <button onClick={handleLogout} className={styles.logout}>
                Salir
              </button>
            </>
          )}

          {!isAuthenticated && (
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              Ingresar
            </Link>
          )}
        </nav>
      </aside>
    </>
  )
}