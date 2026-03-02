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

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

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