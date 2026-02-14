// src/auth/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "./AuthContext"
import React from "react"

type Props = {
  children: React.ReactNode
  allowedRoles?: string[] // Opcional: si no se envía, solo pide estar logueado
}


export function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return <div>Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Si definiste roles y el usuario no tiene ninguno, lo mandamos a "No autorizado"
  if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}