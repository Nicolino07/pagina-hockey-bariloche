import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"
import styles from "./NavBar.module.css"

export default function NavbarAdmin() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <Link to="/admin" className={styles.link}>
          Panel
        </Link>

        <Link to="/admin/clubes" className={styles.link}>
          Clubes
        </Link>

        <Link to="/admin/torneos" className={styles.link}>
          Torneos
        </Link>

        <Link to="/admin/partidos" className={styles.link}>
          Partidos
        </Link>

        <Link to="/admin/personas" className={styles.link}>
          Personas
        </Link>

      </div>

      <div className={styles.right}>
        <button onClick={handleLogout} className={styles.button}>
          Salir
        </button>
      </div>
    </header>
  )
}
