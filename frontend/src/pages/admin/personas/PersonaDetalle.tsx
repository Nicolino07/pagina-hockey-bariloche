import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./PersonaDetalle.module.css";
import { getPersonaById, updatePersona } from "../../../api/personas.api";
import type { Persona } from "../../../types/persona";
import { usePersonaConRoles } from "../../../hooks/usePersonaConRoles";
import axiosAdmin from "../../../api/axiosAdmin"; 
import PersonaForm from "./PersonaForm";

export default function PersonaDetalle() {
  const { id_persona } = useParams<{ id_persona: string }>();
  const navigate = useNavigate();
  
  // 1. Datos de la vista (Roles y Clubes)
  const { personas, loading: loadingVista, refresh } = usePersonaConRoles({ 
    idPersona: Number(id_persona) 
  });

  // 2. Estados de la Persona
  const [personaCompleta, setPersonaCompleta] = useState<Persona | null>(null);
  const [loadingPersona, setLoadingPersona] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 3. Estados para la Gestión de Roles
  const [showAddRol, setShowAddRol] = useState(false);
  const [selectedRol, setSelectedRol] = useState("");

  useEffect(() => {
    const fetchFullData = async () => {
      try {
        setLoadingPersona(true);
        const data = await getPersonaById(Number(id_persona));
        setPersonaCompleta(data);
      } catch (err) {
        console.error("Error cargando detalles técnicos", err);
      } finally {
        setLoadingPersona(false);
      }
    };
    fetchFullData();
  }, [id_persona]);

  const personaVista = personas[0];

  const handleSavePersona = async (formData: any) => {
    try {
      setIsSaving(true);
      const dataToSave = {
        ...formData,
        genero: formData.genero === "F" ? "FEMENINO" : 
                formData.genero === "M" ? "MASCULINO" : 
                formData.genero === "X" ? "OTRO" : null,
        documento: formData.documento ? Number(formData.documento) : null
      };

      await updatePersona(Number(id_persona), dataToSave);
      setEditMode(false);
      const updated = await getPersonaById(Number(id_persona));
      setPersonaCompleta(updated);
      await refresh(); 
      alert("¡Datos actualizados!");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error al actualizar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAsignarRolHabilitante = async () => {
    if (!selectedRol) return alert("Selecciona un rol");
    try {
      setIsSaving(true);
      await axiosAdmin.post(`/personas/${id_persona}/roles`, {
        rol: selectedRol,
        fecha_desde: new Date().toISOString().split('T')[0]
      });
      await refresh(); 
      setShowAddRol(false);
      setSelectedRol("");
    } catch (err: any) {
      alert(err.response?.data?.detail || "La persona ya tiene este rol o hubo un error.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCerrarRol = async (idPersonaRol: number) => {
    if (!window.confirm("¿Seguro que deseas dar de baja este rol? Recuerda que si tiene fichajes activos, la base de datos podría impedirlo.")) return;
    try {
      // Usamos PUT porque según tu lógica es un cierre (setear fecha_hasta), no un borrado físico
      await axiosAdmin.put(`/personas/${id_persona}/roles/${idPersonaRol}`);
      await refresh();
      alert("Rol cerrado correctamente");
    } catch (err: any) {
      alert(err.response?.data?.detail || "No se pudo cerrar el rol. Verifique si tiene fichajes vigentes.");
    }
  };

  if (loadingVista || loadingPersona) return <div className={styles.container}>Cargando...</div>;
  if (!personaVista || !personaCompleta) return <div className={styles.container}>Persona no encontrada</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>← Volver</button>
          <h1>Detalle de Persona</h1>
          <span className={styles.idBadge}>ID: {id_persona}</span>
        </div>
      </header>

      {/* SECCIÓN DATOS PERSONALES */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Información General</h2>
          {!editMode && (
            <button className={styles.addButton} onClick={() => setEditMode(true)}>Editar Datos</button>
          )}
        </div>
        <PersonaForm 
          key={personaCompleta.id_persona}
          initialData={{
            nombre: personaCompleta.nombre || "",
            apellido: personaCompleta.apellido || "",
            documento: personaCompleta.documento || null,
            fecha_nacimiento: personaCompleta.fecha_nacimiento ? personaCompleta.fecha_nacimiento.split('T')[0] : "",
            genero: (personaCompleta.genero === "FEMENINO" ? "F" : 
                    personaCompleta.genero === "MASCULINO" ? "M" : 
                    personaCompleta.genero === "OTRO" ? "X" : "") as any,
            email: personaCompleta.email || "",
            direccion: personaCompleta.direccion || "",
            telefono: personaCompleta.telefono || "",
          }} 
          onSubmit={handleSavePersona} 
          onCancel={() => setEditMode(false)}
          isSaving={isSaving}
          disabled={!editMode} 
        />
      </section>

      {/* SECCIÓN TABLA DE ROLES */}
      <section className={styles.content}>
        <div className={styles.sectionHeader}>
          <h2>Roles Habilitantes</h2>
          <button 
            className={styles.addButton} 
            onClick={() => setShowAddRol(!showAddRol)}
          >
            {showAddRol ? "Cancelar" : "+ Asignar Nuevo Rol"}
          </button>
        </div>

        {/* Formulario rápido para agregar Rol */}
        {showAddRol && (
          <div className={styles.addRolBar}>
            <select 
              className={styles.select} 
              value={selectedRol} 
              onChange={(e) => setSelectedRol(e.target.value)}
            >
              <option value="">Seleccione un Rol...</option>
              <option value="JUGADOR">JUGADOR</option>
              <option value="DT">DT</option>
              <option value="ARBITRO">ARBITRO</option>
              <option value="PREPARADOR_FISICO">PREPARADOR FÍSICO</option>
              <option value="MEDICO">MÉDICO</option>
              <option value="DELEGADO">DELEGADO</option>
              
            </select>
            <button 
              className={styles.saveButtonSmall} 
              onClick={handleAsignarRolHabilitante}
              disabled={isSaving || !selectedRol}
            >
              Confirmar Habilitación
            </button>
          </div>
        )}

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rol</th>
                <th>Estado Fichaje</th>
                <th>Clubes Vinculados</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {personaVista.roles && personaVista.roles.length > 0 ? (
                personaVista.roles.map((rol) => (
                  <tr key={rol.id_persona_rol}>
                    <td className={styles.rolCell}><strong>{rol.rol}</strong></td>
                    <td>
                      <span className={rol.estado_fichaje === 'FICHADO' ? styles.statusFichado : styles.statusLibre}>
                        {rol.estado_fichaje}
                      </span>
                    </td>
                    <td>{rol.clubes.map(c => c.nombre_club).join(", ") || "Sin Club"}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className={styles.deleteButton}
                        onClick={() => handleCerrarRol(rol.id_persona_rol)}
                      >
                        Dar de Baja Rol
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className={styles.empty}>No tiene roles habilitados actualmente.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}