import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"
import styles from "./NavBar.module.css"

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <header className={styles.navbar}>
      {/* 🔹 IZQUIERDA */}
      <div className={styles.left}>
        <Link to="/" className={styles.link}>
          Torneos
        </Link>

        <Link to="/" className={styles.link}>
          Clubes
        </Link>

        <Link to="/" className={styles.link}>
          Estadísticas
        </Link>
      </div>

      {/* 🔹 DERECHA */}
      <div className={styles.right}>
        {!isAuthenticated && (
          <Link to="/login" className={styles.login}>
            Ingresar
          </Link>
        )}

        {isAuthenticated && (
          <>
            <Link to="/admin" className={styles.link}>
              Panel
            </Link>

            <button onClick={handleLogout} className={styles.button}>
              Salir
            </button>
          </>
        )}
      </div>
    </header>
  )
}
