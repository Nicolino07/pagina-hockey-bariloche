import { Routes, Route } from "react-router-dom"
import Login from "./pages/login/Login"
import Home from "./pages/public/home/Home"
import PanelAdmin from "./pages/admin/panel/PanelAdmin"
import Clubes from "./pages/admin/clubes/Clubes"
import ClubDetalle from "./pages/admin/clubes/ClubDetalle"
import EquipoDetalle from "./pages/admin/equipos/EquipoDetalle"
import TorneosAdmin from "./pages/admin/torneos/TorneosAdmin"
import TorneoDetalle from "./pages/admin/torneos/TorneoDetalle"
import { ProtectedRoute } from "./auth/ProtectedRoute"
import Personas from "./pages/admin/personas/Personas"
import PersonaDetalle from "./pages/admin/personas/PersonaDetalle"
import PartidosPage from "./pages/admin/partidos/PartidosPage"
import PartidoPlanilla from "./pages/admin/partidos/PartidoPlanilla"
import NoticiasForm from "./pages/admin/noticias/NoticiasForm"

import PosicionesPage from "./pages/public/posiciones/PosicionesPage"
import ClubesPage from "./pages/public/clubes/ClubesPage"
import ClubesDetallePublic from "./pages/public/clubes/ClubesDetallePublic"
import EquipoDetallePublic from "./pages/public/clubes/EquipoDetallePublic"
import CompletarRegistro from './pages/admin/usuarios/CompletarRegistro'; 
import Unauthorized from "./pages/error/Unauthorized"
import GestionUsuarios from "./pages/admin/usuarios/GestionUsuarios";
import SolicitarRecuperacion from "./pages/login/SolicitarRecuperacion"
import ResetPasswordForm from "./pages/login/ResetPassword";
import NoticiaDetalle from "./pages/public/noticias/NoticiaDetalle"
import Noticias from "./pages/public/noticias/Noticias"
import MainLayout from "./layouts/MainLayout"

import { useState, useEffect } from 'react';
import { useAuth } from "./auth/AuthContext"



function ThemeToggle({ isDark, setIsDark }: { isDark: boolean, setIsDark: (v: boolean) => void }) {
  return (
    <button 
      onClick={() => setIsDark(!isDark)}
      style={{
        position: 'fixed', bottom: '20px', right: '20px', 
        zIndex: 1000, padding: '12px', borderRadius: '50%',
        cursor: 'pointer', border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-card)', fontSize: '1.2rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}
      title="Cambiar modo de color"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const { isLoading } = useAuth(); // <--- Opcional: usar el loading aquí también

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Efecto del escudo HTTPS (mantenlo si lo necesitas)
  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost';
    if (!isLocal) {
      const meta = document.createElement('meta');
      meta.httpEquiv = "Content-Security-Policy";
      meta.content = "upgrade-insecure-requests";
      document.head.appendChild(meta);
    }
  }, []);

  // Si el contexto está validando el token, no renderizamos las rutas
  if (isLoading) {
    return <div className="loading-global">Cargando aplicación...</div>;
  }

  return (
    <Routes>

      {/* Layout Global */}
      <Route element={<MainLayout />}>

        {/* Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/recuperar-password" element={<SolicitarRecuperacion />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />
        <Route path="/completar-registro" element={<CompletarRegistro />} />

        <Route path="/public/posiciones" element={<PosicionesPage />} />
        <Route path="/public/clubes" element={<ClubesPage />} />
        <Route path="/public/clubes/:id_club" element={<ClubesDetallePublic />} />
        <Route path="/public/clubes/:id_club/equipos/:id_equipo" element={<EquipoDetallePublic />} />

        <Route path="/noticias" element={<Noticias />} />
        <Route path="/noticias/:id" element={<NoticiaDetalle />} />
        

        {/* ADMIN GENERAL */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['EDITOR','ADMIN','SUPERUSUARIO']} />
          }
        >
          <Route path="/admin" element={<PanelAdmin />} />
          <Route path="/admin/partidos" element={<PartidosPage />} />
          <Route path="/admin/partidos/:id_partido" element={<PartidoPlanilla />} />
          <Route path="/admin/noticias" element={<NoticiasForm />} />
        </Route>

        {/* ADMIN ESTRUCTURAL */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['ADMIN','SUPERUSUARIO']} />
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

        {/* SUPERUSUARIO */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['SUPERUSUARIO']} />
          }
        >
          <Route path="/login/usuarios" element={<GestionUsuarios />} />
        </Route>

      </Route>
    </Routes>
  )
}
