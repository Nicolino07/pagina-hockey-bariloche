import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "./AuthContext"

type Props = {
  allowedRoles?: string[]
}

export function ProtectedRoute({ allowedRoles }: Props) {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) return <div>Cargando...</div>

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}