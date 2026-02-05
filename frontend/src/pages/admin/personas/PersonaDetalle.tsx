import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./PersonaDetalle.module.css";
import { usePersonaConRoles } from "../../../hooks/usePersonaConRoles";
import { updatePersona } from "../../../api/personas.api";
import type { Persona } from "../../../types/persona";

export default function PersonaDetalle() {
  const { id_persona } = useParams<{ id_persona: string }>();
  const navigate = useNavigate();
  const { personas, loading, error, refresh } = usePersonaConRoles({ 
    idPersona: Number(id_persona) 
  });

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Persona>>({});
  const [isSaving, setIsSaving] = useState(false);

  const persona = personas[0];

  // Sincronizar formData cuando cargue la persona
  useEffect(() => {
    if (persona) {
      setFormData({
        nombre: persona.nombre,
        apellido: persona.apellido,
        dni: persona.dni,
        fecha_nacimiento: persona.fecha_nacimiento
      });
    }
  }, [persona]);

  const handleSavePersona = async () => {
    try {
      setIsSaving(true);
      await updatePersona(Number(id_persona), formData);
      setEditMode(false);
      // Opcional: una función 'refresh' en tu hook para volver a pedir datos
      window.location.reload(); 
    } catch (err) {
      alert("Error al actualizar los datos");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Cargando...</div>;
  if (!persona) return <div className={styles.error}>No se encontró la persona</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate("/admin/personas")}>
          ← Volver al listado
        </button>
        <h1>Ficha de Persona</h1>
      </header>

      {/* TARJETA 1: DATOS PERSONALES */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Datos Personales</h2>
          {!editMode ? (
            <button className={styles.secondaryButton} onClick={() => setEditMode(true)}>
              Editar Datos
            </button>
          ) : (
            <div className={styles.buttonGroup}>
              <button className={styles.saveButton} onClick={handleSavePersona} disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </button>
              <button className={styles.cancelButton} onClick={() => setEditMode(false)}>
                Cancelar
              </button>
            </div>
          )}
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Nombre</label>
            <input 
              type="text" 
              disabled={!editMode}
              value={formData.nombre || ""}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Apellido</label>
            <input 
              type="text" 
              disabled={!editMode}
              value={formData.apellido || ""}
              onChange={(e) => setFormData({...formData, apellido: e.target.value})}
            />
          </div>
          <div className={styles.formGroup}>
            <label>DNI / Documento</label>
            <input 
              type="text" 
              disabled={!editMode}
              value={formData.dni || ""}
              onChange={(e) => setFormData({...formData, dni: e.target.value})}
            />
          </div>
        </div>
      </section>

      {/* TARJETA 2: ROLES (La tabla que ya tenías) */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Roles y Clubes Activos</h2>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rol</th>
                <th>Estado</th>
                <th>Clubes</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {persona.roles.map((rol, idx) => (
                <tr key={idx}>
                  <td className={styles.rolCell}><strong>{rol.rol}</strong></td>
                  <td>
                    <span className={`${styles.badge} ${styles[rol.estado_fichaje.toLowerCase().replace('_', '')]}`}>
                      {rol.estado_fichaje.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{rol.clubes.map(c => c.nombre_club).join(", ") || "Sin Club"}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className={styles.deleteButton}>Cerrar Rol</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}