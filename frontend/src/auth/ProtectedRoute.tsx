import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext"
import React from "react"

type Props = {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <div>Cargando...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
