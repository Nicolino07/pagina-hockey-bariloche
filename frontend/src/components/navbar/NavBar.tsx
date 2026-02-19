import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../auth/AuthContext"
import styles from "./NavBar.module.css"
import Button from "../ui/button/Button"

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
        <Link to="/public/torneos" className={styles.link}>
          Torneos
        </Link>

        <Link to="/public/clubes" className={styles.link}>
          Clubes
        </Link>

        <Link to="/" className={styles.link}>
          Estadísticas
        </Link>

        <Link to="/public/posiciones" className={styles.link}>
          Posiciones
        </Link>

      </div>

      {/* 🔹 DERECHA */}
      <div className={styles.right}>
        {!isAuthenticated && (
          <Link to="/login" className={styles.login}>
            <Button>
              Ingresar
            </Button>
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
