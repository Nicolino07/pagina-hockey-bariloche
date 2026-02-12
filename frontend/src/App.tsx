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


export default function App() {
  return (
    
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* 🌍 Público */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/public/posiciones" element={<PosicionesPage />} />
        <Route path="/public/torneos" element={<TorneosPage />} />
        
        {/* Capa 1: Listado de Clubes */}
        <Route path="/public/clubes" element={<ClubesPage />} />
        
        {/* Capa 2: Detalle del Club (Selector de equipos) */}
        <Route path="/public/clubes/:id_club" element={<ClubesDetallePublic />} />
        
        {/* Capa 3: Detalle del Equipo (Plantel) 
            IMPORTANTE: La ruta debe coincidir exactamente con el link */}
        <Route 
          path="/public/clubes/:id_club/equipos/:id_equipo" 
          element={<EquipoDetallePublic />} 
        />
      </Route>

      {/* 🔐 Admin (se mantiene igual) */}
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<PanelAdmin />} />
        <Route path="/admin/clubes" element={<Clubes />} />
        <Route path="/admin/clubes/:id_club" element={<ClubDetalle />} />
        <Route path="/admin/equipos/:id_equipo" element={<EquipoDetalle />} />
        <Route path="/admin/torneos" element={<TorneosAdmin />} />
        <Route path="/admin/torneos/:idTorneo" element={<TorneoDetalle />} />
        <Route path="/admin/personas" element={<Personas />} />
        <Route path="/admin/personas/:id_persona" element={<PersonaDetalle />} />
        <Route path="/admin/partidos" element={<PartidosPage />} />
        <Route path="/admin/partidos/:id_partido" element={<PartidoPlanilla />} />
       {/*<Route path="/partidos/:id" element={<PartidoDetalle />} />*/}

      </Route>
    </Routes>
  )
}
