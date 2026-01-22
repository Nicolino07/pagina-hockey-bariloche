import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { login as loginApi } from "../../api/auth.api"
import { useAuth } from "../../auth/AuthContext"
import { decodeJwt } from "../../utils/jwt"

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading) return   // 👈 CLAVE

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

      navigate("/")
    } catch (err) {
      setError("Usuario o contraseña incorrectos")
    } finally {
      setLoading(false)
    }
  }


  return (
    <div style={{ maxWidth: 320, margin: "80px auto" }}>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Entrar"}
        </button>
      </form>
    </div>
  )
}
