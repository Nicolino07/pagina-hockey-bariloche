import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"
import { useEffect, useRef, useState } from "react"
import styles from "./NavBar.module.css"

/**
 * Barra de navegación principal de la aplicación.
 * Muestra los links públicos siempre, y los links del panel admin
 * solo cuando el usuario está autenticado.
 * Los links de gestión de usuarios/torneos se muestran solo para ADMIN y SUPERUSUARIO.
 * En mobile utiliza un menú lateral (sidebar) activado por el botón hamburguesa.
 */
export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  /** Cierra la sesión del usuario, navega al inicio y cierra el menú mobile. */
  const handleLogout = () => {
    logout()
    navigate("/")
    setMenuOpen(false)
    setUserMenuOpen(false)
  }

  const isSuper = user?.rol === "SUPERUSUARIO"
  const isAdminOrSuper = user?.rol === "ADMIN" || isSuper
  const isAdminArbitros = user?.rol === "ADMIN_ARBITROS" || isSuper
  // Noticias/Fichajes son rutas EDITOR/ADMIN/SUPERUSUARIO (ver App.tsx).
  // ADMIN_ARBITROS no gestiona nada más que designaciones.
  const puedeGestion = user?.rol === "EDITOR" || isAdminOrSuper

  const close = () => setMenuOpen(false)

  // Cierra el dropdown de usuario al hacer click afuera.
  useEffect(() => {
    if (!userMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [userMenuOpen])

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.logo}>
          <Link to="/"><img src="/logoAHBLS.png" alt="Hockey Bariloche" height={40} className={styles.logoImg} /></Link>
        </div>

        {/* ---- NAV DESKTOP ---- */}
        <nav className={styles.desktopNav}>
          <Link to="/public/clubes">Clubes</Link>
          <Link to="/public/posiciones">Posiciones</Link>
          <Link to="/public/ranking">Estadísticas</Link>
          <Link to="/fixture">Fixture</Link>
          <Link to="/resultados">Resultados</Link>
          <Link to="/noticias">Noticias</Link>

          {isAuthenticated && (
            <>
              <span className={styles.separator} />

              {puedeGestion && (
                <>
                  <Link to="/admin/noticias">Noticias</Link>
                  <Link to="/admin/fichajes">Fichajes</Link>
                </>
              )}

              {isAdminArbitros && (
                <Link to="/admin/arbitros">Designaciones</Link>
              )}

              {isAdminOrSuper && (
                <>
                  <Link to="/admin/clubes">Clubes</Link>
                  <Link to="/admin/torneos">Torneos</Link>
                  <Link to="/admin/personas">Personas</Link>
                  <Link to="/admin/suspensiones">Suspensiones</Link>
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
            <div className={styles.userMenu} ref={userMenuRef}>
              <button
                className={styles.userChipBtn}
                onClick={() => setUserMenuOpen((v) => !v)}
              >
                <span className={styles.userChip}>{user?.email}</span>
                <span className={`${styles.chevron} ${userMenuOpen ? styles.chevronOpen : ""}`}>▾</span>
              </button>

              {userMenuOpen && (
                <div className={styles.userDropdown}>
                  <Link to="/mi-perfil" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                    Mi Perfil
                  </Link>
                  <button onClick={handleLogout} className={styles.logoutItem}>Salir</button>
                </div>
              )}
            </div>
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
          <Link to="/public/clubes" onClick={close}>Clubes</Link>
          <Link to="/public/posiciones" onClick={close}>Posiciones</Link>
          <Link to="/public/ranking" onClick={close}>Estadísticas</Link>
          <Link to="/fixture" onClick={close}>Fixture</Link>
          <Link to="/resultados" onClick={close}>Resultados</Link>
          <Link to="/noticias" onClick={close}>Noticias</Link>

          {isAuthenticated && (
            <>
              <hr />

              {puedeGestion && (
                <>
                  <Link to="/admin/noticias" onClick={close}>Noticias</Link>
                  <Link to="/admin/fichajes" onClick={close}>Fichajes</Link>
                </>
              )}

              {isAdminArbitros && (
                <Link to="/admin/arbitros" onClick={close}>Designaciones</Link>
              )}

              {isAdminOrSuper && (
                <>
                  <Link to="/admin/clubes" onClick={close}>Clubes</Link>
                  <Link to="/admin/torneos" onClick={close}>Torneos</Link>
                  <Link to="/admin/personas" onClick={close}>Personas</Link>
                  <Link to="/admin/suspensiones" onClick={close}>Suspensiones</Link>
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
              <Link to="/mi-perfil" onClick={close}>Mi Perfil</Link>
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