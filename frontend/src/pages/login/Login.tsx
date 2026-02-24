import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { login as loginApi } from "../../api/auth.api"
import { useAuth } from "../../auth/AuthContext"
import { decodeJwt } from "../../utils/jwt"
import styles from "./Login.module.css"
import { Link } from "react-router-dom"

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  // 1. Cambiamos 'username' por 'email'
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false) // Estado para el ojito

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      // 2. Enviamos el email a la API. 
      // Nota: Asegúrate de que tu función loginApi en auth.api ahora espere (email, password)
      const data = await loginApi(email, password)
      const payload = decodeJwt(data.access_token)

      login(data.access_token, {
        id: Number(payload.sub),
        email: payload.username, // El payload suele traer el email en 'username' o 'email'
        rol: payload.rol,
      })

      navigate("/admin")
    } catch {
      setError("Email o contraseña incorrectos")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Hockey Bariloche</h1>
        <h2 className={styles.title}>Iniciar sesión</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 3. Input de Email optimizado */}
          <div className={styles.inputGroup}>
            <input
              className={styles.input}
              type="email" 
              placeholder="Correo electrónico"
              value={email}
              autoComplete="email"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* 4. Input de Contraseña con Ojito */}
          <div style={{ position: 'relative' }}>
            <input
              className={styles.input}
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              autoComplete="current-password"
              required
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%' }}
            />
            <button 
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>

        <div className={styles.footerLinks}>
          <Link to="/recuperar-password" className={styles.forgotLink}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  )
}