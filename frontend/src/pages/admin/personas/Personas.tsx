import { useNavigate } from "react-router-dom";
import { useState } from "react";
import styles from "./Personas.module.css";
import { usePersonaConRoles } from "../../../hooks/usePersonaConRoles";
import PersonaForm from "./PersonaForm"; 
import { createPersonaConRol } from "../../../api/personas.api";
import Button from "../../../components/ui/button/Button";
import { ROLES_PERSONA } from "../../../constants/enums";

const ICONOS_ROLES: Record<string, string> = {
  JUGADOR: "🏑",
  DT: "📋",
  ARBITRO: "🏁",
  ASISTENTE: "🚩",
  MEDICO: "🏥",
  PREPARADOR_FISICO: "🏃",
  DELEGADO: "👔",
};

export default function Personas() {
  const { personas, loading, error, refresh } = usePersonaConRoles();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRol, setSelectedRol] = useState("JUGADOR");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRol, setFilterRol] = useState("");

  const personasFiltradas = (personas || [])
    .filter(p => {
      const matchesName = `${p.nombre} ${p.apellido}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRol = filterRol === "" || p.roles.some(r => r.rol === filterRol);
      return matchesName && matchesRol;
    })
    .sort((a, b) => (a.apellido || "").toLowerCase().localeCompare((b.apellido || "").toLowerCase()));

  const handleCreatePersona = async (formData: any) => {
    try {
      setIsSaving(true);
      await createPersonaConRol(formData, selectedRol);
      alert(`Persona creada correctamente`);
      setIsModalOpen(false);
      refresh(); 
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error al crear");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <p className={styles.loading}>Cargando personas...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Personas</h1>
        <div className={styles.toolbar}>
          <input 
            type="text" 
            placeholder="Buscar por nombre o apellido..." 
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Filtro en Toolbar usando el array de roles */}
          <select 
            value={filterRol} 
            onChange={(e) => setFilterRol(e.target.value)} 
            className={styles.filterSelect}
          >
            <option value="">Todos los Roles</option>
            {ROLES_PERSONA.map(rol => (
              <option key={rol} value={rol}>{rol.replace("_", " ")}</option>
            ))}
          </select>

          <button className={styles.primaryButton} onClick={() => setIsModalOpen(true)}>
            + Nueva persona
          </button>
            <Button className={styles.backButton} onClick={() => navigate(-1)}>
            ← volver
            </Button>

        </div>
      </header>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Registrar Nueva Persona</h2>
            <div className={styles.rolSelector}>
              <label>Asignar rol inicial:</label>
              <select value={selectedRol} onChange={(e) => setSelectedRol(e.target.value)}>
                {/* 2. Desplegable dinámico del Modal */}
                {ROLES_PERSONA.map(rol => (
                  <option key={rol} value={rol}>
                    {ICONOS_ROLES[rol] || ""} {rol.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <PersonaForm 
              onSubmit={handleCreatePersona} 
              onCancel={() => setIsModalOpen(false)} 
              isSaving={isSaving} 
            />
          </div>
        </div>
      )}

      <div className={styles.list}>
        {personasFiltradas.length > 0 ? (
          personasFiltradas.map(persona => (
            <div 
              key={persona.id_persona} 
              className={styles.personaCard}
              onClick={() => navigate(`/admin/personas/${persona.id_persona}`)}
            >
              <div className={styles.personaMain}>
                <h3>{persona.apellido}, {persona.nombre}</h3>
              </div>

              <div className={styles.rolesContainer}>
                {persona.roles.map((rol, index) => (
                  <div key={index} className={styles.rolRow}>
                    <span className={styles.rolName}>
                      {ICONOS_ROLES[rol.rol] || "👤"} {rol.rol.replace("_", " ")}
                    </span>
                    <span className={`${styles.stadoBadge} ${rol.estado_fichaje === "FICHADO" ? styles.fichado : styles.sinfichar}`}>
                      {rol.estado_fichaje === "FICHADO" ? "FICHADO" : "SIN FICHAR"}
                    </span>
                    <span className={styles.clubName}>
                      {rol.clubes.length > 0 ? rol.clubes[0].nombre_club : 'Sin Club'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className={styles.empty}>No se encontraron resultados.</p>
        )}
      </div>
    </div>
  );
}