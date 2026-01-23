import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { login as loginApi } from "../../api/auth.api"
import { useAuth } from "../../auth/AuthContext"
import { decodeJwt } from "../../utils/jwt"
import styles from "./Login.module.css"

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      const data = await loginApi(username, password)
      const payload = decodeJwt(data.access_token)

      login(data.access_token, {
        id: Number(payload.sub),
        email: payload.username,
        rol: payload.rol,
      })

      navigate("/admin")
    } catch {
      setError("Usuario o contraseña incorrectos")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Login</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={styles.input}
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className={styles.input}
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  )
}
