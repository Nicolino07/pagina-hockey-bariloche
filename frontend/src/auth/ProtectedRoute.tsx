/**
 * ProtectedRoute.tsx
 * Componente de ruta protegida por autenticación y roles.
 *
 * Redirige al login si el usuario no está autenticado.
 * Redirige a /unauthorized si el usuario no tiene el rol requerido.
 * Muestra un indicador de carga mientras se verifica la sesión.
 *
 * Props:
 *   allowedRoles: lista de roles permitidos (ej. ['ADMIN', 'SUPERUSUARIO']).
 *                 Si se omite, solo verifica que el usuario esté autenticado.
 */
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