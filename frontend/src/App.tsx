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


export default function App() {
  return (
    
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* 🌍 Público */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
      </Route>

      {/* 🔐 Admin */}
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
