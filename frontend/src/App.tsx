import { Routes, Route } from "react-router-dom"
import Login from "./pages/login/Login"
import Home from "./pages/public/home/Home"
import PanelAdmin from "./pages/admin/panel/PanelAdmin"
import Clubes from "./pages/admin/clubes/Clubes"
import ClubDetalle from "./pages/admin/clubes/ClubDetalle"
import EquipoDetalle from "./pages/admin/equipos/EquipoDetalle"
import TorneosAdmin from "./pages/admin/torneos/TorneosAdmin"
import TorneoDetalle from "./pages/admin/torneos/TorneoDetalle"

import PublicLayout from "./layouts/PublicLayout"
import AdminLayout from "./layouts/AdminLayout"
import { ProtectedRoute } from "./auth/ProtectedRoute"
import Personas from "./pages/admin/personas/Personas"
import PersonaDetalle from "./pages/admin/personas/PersonaDetalle"
import PartidosPage from "./pages/admin/partidos/PartidosPage"
import PartidoPlanilla from "./pages/admin/partidos/PartidoPlanilla"

import PosicionesPage from "./pages/public/posiciones/PosicionesPage"
import TorneosPage from "./pages/public/torneos/TorneosPage"
import ClubesPage from "./pages/public/clubes/ClubesPage"
import ClubesDetallePublic from "./pages/public/clubes/ClubesDetallePublic"
import EquipoDetallePublic from "./pages/public/clubes/EquipoDetallePublic"
import CompletarRegistro from './pages/admin/usuarios/CompletarRegistro'; // El nombre que le pongas
import Unauthorized from "./pages/error/Unauthorized"
import GestionUsuarios from "./pages/admin/usuarios/GestionUsuarios";
import SolicitarRecuperacion from "./pages/login/SolicitarRecuperacion"
import ResetPasswordForm from "./pages/login/ResetPassword";
export default function App() {
  return (
    
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/recuperar-password" element={<SolicitarRecuperacion />}></Route>
      <Route path="/reset-password" element={<ResetPasswordForm />} />
      
      {/* 🌍 Público */}
      <Route element={<PublicLayout />}>

        <Route path="/completar-registro" element={<CompletarRegistro />} />
        <Route path="/" element={<Home />} />
        <Route path="/public/posiciones" element={<PosicionesPage />} />
        <Route path="/public/torneos" element={<TorneosPage />} />
        <Route path="/public/clubes" element={<ClubesPage />} />
        <Route path="/public/clubes/:id_club" element={<ClubesDetallePublic />} />
        <Route 
          path="/public/clubes/:id_club/equipos/:id_equipo" 
          element={<EquipoDetallePublic />} 
        />
      </Route>

      {/* 🔐 Admin - Acceso General (Editores, Admins, Superusers) */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['EDITOR', 'ADMIN', 'SUPERUSUARIO']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<PanelAdmin />} />
        <Route path="/admin/partidos" element={<PartidosPage />} />
        <Route path="/admin/partidos/:id_partido" element={<PartidoPlanilla />} />

      </Route>

      {/* 🔐 Admin - Solo Gestión Estructural (Admins y Superusers) */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPERUSUARIO']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/clubes" element={<Clubes />} />
        <Route path="/admin/clubes/:id_club" element={<ClubDetalle />} />
        <Route path="/admin/equipos/:id_equipo" element={<EquipoDetalle />} />
        <Route path="/admin/torneos" element={<TorneosAdmin />} />
        <Route path="/admin/torneos/:idTorneo" element={<TorneoDetalle />} />
        <Route path="/admin/personas" element={<Personas />} />
        <Route path="/admin/personas/:id_persona" element={<PersonaDetalle />} />
      </Route>

      {/* 🔐 Superusers */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['SUPERUSUARIO']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/login/usuarios" element={<GestionUsuarios />} />
        
      </Route>
      
    </Routes>
  
  )
}
