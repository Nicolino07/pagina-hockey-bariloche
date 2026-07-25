import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { login as loginApi } from "../../api/auth.api"
import { useAuth } from "../../auth/AuthContext"
import { decodeJwt } from "../../utils/jwt"
import { takeSessionExpiredReason } from "../../auth/sessionManager"
import styles from "./Login.module.css"
import { Link } from "react-router-dom"

/** Mensaje a mostrar según el motivo por el que se cerró la sesión anterior. */
const AVISO_SESION: Record<string, string> = {
  too_long:
    "Tu sesión superó el tiempo máximo (4 horas). Por seguridad, ingresá tu contraseña nuevamente.",
  inactivity:
    "Tu sesión se cerró por inactividad. Ingresá nuevamente para continuar.",
}

/**
 * Página de inicio de sesión.
 * Autentica al usuario con email y contraseña, decodifica el JWT recibido
 * y guarda los datos de sesión en el contexto de autenticación.
 */
export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  // Muestra (una sola vez) el motivo por el que se cerró la sesión anterior.
  useEffect(() => {
    const reason = takeSessionExpiredReason()
    if (reason && AVISO_SESION[reason]) setAviso(AVISO_SESION[reason])
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      const data = await loginApi(email, password)
      
      // 🔥 decodeJwt ya devuelve JwtPayload | null
      const payload = decodeJwt(data.access_token)
      
      // Verificamos que payload existe
      if (!payload) {
        throw new Error("No se pudo decodificar el token")
      }

      // 🔥 Ahora TypeScript sabe que payload es JwtPayload (no null)
      login(data.access_token, {
        id: Number(payload.sub),
        email: payload.username,  // username existe en JwtPayload
        rol: payload.rol,         // rol existe en JwtPayload
      })

      navigate("/admin")
    } catch (error) {
      console.error("Error en login:", error)
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

        {aviso && (
          <p
            role="status"
            style={{
              background: "#fff8e1",
              border: "1px solid #f0c36d",
              color: "#7a5b00",
              padding: "0.6rem 0.8rem",
              borderRadius: "8px",
              fontSize: "0.9rem",
              margin: "0 0 1rem",
            }}
          >
            {aviso}
          </p>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
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