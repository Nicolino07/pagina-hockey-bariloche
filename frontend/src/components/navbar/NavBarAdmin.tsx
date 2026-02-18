import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"
import styles from "./NavBar.module.css"

export default function NavbarAdmin() {
  const { logout, user } = useAuth() // Extraemos el usuario actual
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  // Helper para verificar roles fácilmente
  const isSuper = user?.rol === 'SUPERUSUARIO';
  const isAdminOrSuper = user?.rol === 'ADMIN' || isSuper;

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        {/* Accesible para todos los del staff (EDITOR, ADMIN, SUPER) */}
        <Link to="/admin" className={styles.link}>
          Panel
        </Link>

        <Link to="/admin/partidos" className={styles.link}>
          Partidos
        </Link>

        {/* 🔐 Solo visible para ADMIN y SUPERUSUARIO */}
        {isAdminOrSuper && (
          <>
            <Link to="/admin/clubes" className={styles.link}>
              Clubes
            </Link>
            <Link to="/admin/torneos" className={styles.link}>
              Torneos
            </Link>
            <Link to="/admin/personas" className={styles.link}>
              Personas
            </Link>
          </>
        )}

        {/* 👑 Solo visible para el SUPERUSUARIO */}
        {isSuper && (
          <Link to="/login/usuarios" className={`${styles.link} ${styles.superLink}`}>
            👥 Gestionar Staff
          </Link>
        )}
      </div>

      <div className={styles.right}>
        <div className={styles.userInfo}>

          <span>{user?.username} - {user?.rol} </span>
      
        </div>
        <button onClick={handleLogout} className={styles.button}>
          Salir
        </button>
      </div>
    </header>
  )
}