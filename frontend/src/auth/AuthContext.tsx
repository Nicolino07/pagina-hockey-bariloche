// src/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react"
import * as authApi from "../api/auth.api"

type User = {
  id: number
  email: string
  rol: string
}

type AuthContextType = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  // 🔁 restaurar sesión al refrescar
  useEffect(() => {
    const storedToken = localStorage.getItem("access_token")
    const storedUser = localStorage.getItem("user")

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password)

    // ⚠️ asumimos que backend devuelve esto:
    // { access_token, user }
    localStorage.setItem("access_token", data.access_token)
    localStorage.setItem("user", JSON.stringify(data.user))

    setToken(data.access_token)
    setUser(data.user)
  }

  const logout = async () => {
    await authApi.logout()
    localStorage.removeItem("access_token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider")
  }
  return context
}
