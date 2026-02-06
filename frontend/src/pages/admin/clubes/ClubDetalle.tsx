import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./ClubDetalle.module.css";
import Modal from "../../../components/ui/modal/Modal";
import Button from "../../../components/ui/button/Button";

import { crearEquipo, getEquiposByClub } from "../../../api/equipos.api";
import { getClubById } from "../../../api/clubes.api";
import { usePersonaConRoles } from "../../../hooks/usePersonaConRoles";
import { crearFichaje, getFichajesByClub, darBajaFichaje } from "../../../api/fichajes.api";

import type { Club } from "../../../types/club";
import type { Equipo, EquipoCreate } from "../../../types/equipo";

import PlantelEquipo from "../equipos/PlantelEquipo";
import { GENEROS, CATEGORIAS, ROLES_PERSONA } from "../../../constants/enums";

export default function ClubDetalle() {
  const { id_club } = useParams<{ id_club: string }>();
  const navigate = useNavigate();

  // --- ESTADOS DE DATOS ---
  const [club, setClub] = useState<Club | null>(null);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [fichajes, setFichajes] = useState<any[]>([]); 
  const { personas } = usePersonaConRoles();
  
  // --- ESTADOS DE UI ---
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFichajeModal, setShowFichajeModal] = useState(false);
  const [showFichados, setShowFichados] = useState(false); 
  const [saving, setSaving] = useState(false);
  const [equipoAbierto, setEquipoAbierto] = useState<number | null>(null);
  const [filtroRol, setFiltroRol] = useState<string>("TODOS");

  // --- FORMULARIOS ---
  const [form, setForm] = useState<EquipoCreate>({
    nombre: "", categoria: "", genero: "", id_club: Number(id_club),
  });

  const [fichajeForm, setFichajeForm] = useState({
    id_persona: "",
    rol: "JUGADOR",
    searchTerm: ""
  });

  // --- CARGA DE DATOS ---
  const cargarFichajes = async () => {
    if (!id_club) return;
    try {
      const data = await getFichajesByClub(Number(id_club), true);
      setFichajes(data);
    } catch (err) { console.error("Error cargando fichajes", err); }
  };

  const cargarDatosPrincipales = async () => {
    if (!id_club) return;
    setLoading(true);
    try {
      const [clubData, equiposData] = await Promise.all([
        getClubById(Number(id_club)),
        getEquiposByClub(Number(id_club))
      ]);
      setClub(clubData);
      setEquipos(equiposData);
      await cargarFichajes();
    } catch (err) { console.error("Error al cargar datos", err);
    } finally { setLoading(false); }
  };

  useEffect(() => { cargarDatosPrincipales(); }, [id_club]);

  // --- LÓGICA DE FILTRADO ---
  const fichajesFiltrados = fichajes.filter(f => {
    const coincideRol = filtroRol === "TODOS" || f.rol === filtroRol;
    const estaActivo = f.activo === true; // <--- Validación de seguridad
    return coincideRol && estaActivo;
  });
  const personasSugeridas = fichajeForm.searchTerm.length > 2 
    ? personas.filter(p => 
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(fichajeForm.searchTerm.toLowerCase())
      ).slice(0, 5)
    : [];

  // --- ACCIONES ---
  const handleFichaje = async () => {
    if (!fichajeForm.id_persona) return alert("Selecciona una persona");
    try {
      setSaving(true);
      await crearFichaje({
        id_persona: Number(fichajeForm.id_persona),
        id_club: Number(id_club),
        rol: fichajeForm.rol,
        fecha_inicio: new Date().toISOString().split('T')[0],
        creado_por: "admin"
      });
      setShowFichajeModal(false);
      setFichajeForm({ id_persona: "", rol: "JUGADOR", searchTerm: "" });
      await cargarFichajes();
    } catch (err) { alert("Error al procesar el fichaje");
    } finally { setSaving(false); }
  };

  const handleBajaFichaje = async (id_fichaje_rol: number) => {
  if (!confirm("¿Estás seguro de dar de baja este fichaje?")) return;
  
  try {
    setSaving(true);
    
    // 1. Esperamos a que el backend confirme la baja
    await darBajaFichaje(id_fichaje_rol, {
      fecha_fin: new Date().toISOString().split('T')[0],
      actualizado_por: "admin"
    });

    // 2. IMPORTANTE: Actualizamos el estado local INMEDIATAMENTE
    // Esto quita a la persona de la lista sin necesidad de hacer otro GET
    setFichajes(prev => prev.filter(f => f.id_fichaje_rol !== id_fichaje_rol));
    
    // 3. Opcional: Recargar de todos modos para asegurar sincronía total
    // pero ya habiendo limpiado el estado local
    // await cargarFichajes(); 

  } catch (err) {
    console.error("Error al dar de baja:", err);
    alert("No se pudo procesar la baja. Intente nuevamente.");
  } finally {
    setSaving(false);
  }
};

  const handleCreateEquipo = async () => {
    if (!form.nombre.trim() || !form.categoria || !form.genero) return alert("Completa los datos");
    try {
      setSaving(true);
      const nuevoEquipo = await crearEquipo(form);
      setEquipos((prev) => [...prev, nuevoEquipo]);
      setShowModal(false);
      setForm({ ...form, nombre: "", categoria: "", genero: "" });
    } catch (err) { alert("Error al crear equipo");
    } finally { setSaving(false); }
  };

  if (loading || !club) return <section className={styles.container}><p>Cargando...</p></section>;

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate("/admin/clubes")}>← Volver</button>
        <div className={styles.titleInfo}>
          <h1>{club.nombre}</h1>
          <span className={styles.cityBadge}>{club.ciudad}</span>
        </div>
      </header>

      <section className={styles.mainContent}>
        <div className={styles.actionBar}>
          <div className={styles.actionLeft}>
            <h2>Gestión de Club</h2>
          </div>
          <div className={styles.actionButtons}>
            <Button variant="primary" onClick={() => setShowFichados(!showFichados)}>
              {showFichados ? "Ocultar Personas" : "Personal y Miembros"}
            </Button>
            <Button onClick={() => setShowFichajeModal(true)} variant="secondary">⚡ Fichar</Button>
            <Button onClick={() => setShowModal(true)}>+ Nuevo equipo</Button>
          </div>
        </div>

        {showFichados && (
          <div className={styles.fichadosSection}>
            <div className={styles.filterHeader}>
              <div className={styles.filterTabs}>
                {["TODOS", "JUGADOR", "DT", "DELEGADO"].map(r => (
                  <button 
                    key={r} 
                    className={`${styles.tab} ${filtroRol === r ? styles.activeTab : ''}`}
                    onClick={() => setFiltroRol(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {fichajesFiltrados.length === 0 ? (
              <p className={styles.emptyMsg}>No hay registros para mostrar.</p>
            ) : (
              <div className={styles.fichadosGrid}>
                {fichajesFiltrados.map((f) => (
                  <div key={f.id_fichaje_rol} className={styles.fichadoCard}>
                    <div className={styles.fichadoMain}>
                      <span className={styles.fichadoName}>{f.persona_apellido}, {f.persona_nombre}</span>
                      <div className={styles.fichadoTags}>
                        <span className={`${styles.rolTag} ${styles[f.rol]}`}>{f.rol}</span>
                        <span className={styles.dateTag}>📅 {f.fecha_inicio}</span>
                      </div>
                    </div>
                    <button className={styles.btnBaja} onClick={() => handleBajaFichaje(f.id_fichaje_rol)} disabled={saving}>
                      Baja
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={styles.equiposSection}>
          <h3>Equipos Registrados</h3>
          <div className={styles.equiposList}>
            {equipos.map((equipo) => (
              <div key={equipo.id_equipo} className={styles.equipoItem}>
                <div className={styles.equipoHeader} onClick={() => setEquipoAbierto(equipoAbierto === equipo.id_equipo ? null : equipo.id_equipo)}>
                  <div className={styles.equipoInfo}>
                    <span className={styles.equipoName}>{equipo.nombre}</span>
                    <span className={styles.equipoMeta}>{equipo.categoria} · {equipo.genero}</span>
                  </div>
                  <div className={styles.equipoActions}>
                    <button className={styles.manageBtn} onClick={(e) => { e.stopPropagation(); navigate(`/admin/equipos/${equipo.id_equipo}`, { state: { clubNombre: club.nombre, clubId: club.id_club }}); }}>
                      Gestionar
                    </button>
                    <span className={styles.arrow}>{equipoAbierto === equipo.id_equipo ? '▲' : '▼'}</span>
                  </div>
                </div>
                {equipoAbierto === equipo.id_equipo && (
                  <div className={styles.plantelContainer}>
                    <PlantelEquipo id_equipo={equipo.id_equipo} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODAL FICHAJE */}
      <Modal open={showFichajeModal} title="Fichar Persona" onClose={() => setShowFichajeModal(false)}>
        <div className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Buscar Persona (Nombre o Apellido)</label>
            <input 
              type="text" 
              placeholder="Escribe al menos 3 letras..."
              value={fichajeForm.searchTerm}
              onChange={(e) => setFichajeForm({...fichajeForm, searchTerm: e.target.value})}
            />
            {personasSugeridas.length > 0 && (
              <div className={styles.dropdown}>
                {personasSugeridas.map(p => (
                  <div 
                    key={p.id_persona} 
                    className={`${styles.dropdownItem} ${fichajeForm.id_persona === String(p.id_persona) ? styles.selectedItem : ''}`}
                    onClick={() => setFichajeForm({...fichajeForm, id_persona: String(p.id_persona), searchTerm: `${p.apellido}, ${p.nombre}`})}
                  >
                    {p.apellido}, {p.nombre}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={styles.formGroup}>
            <label>Rol asignado</label>
            <select value={fichajeForm.rol} onChange={(e) => setFichajeForm({...fichajeForm, rol: e.target.value})}>
              {ROLES_PERSONA.map(rol => <option key={rol} value={rol}>{rol}</option>)}
            </select>
          </div>
          <div className={styles.modalActions}>
            <Button variant="primary" onClick={() => setShowFichajeModal(false)}>Cancelar</Button>
            <Button onClick={handleFichaje} disabled={saving || !fichajeForm.id_persona}>
              {saving ? "Fichando..." : "Confirmar Fichaje"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL CREAR EQUIPO */}
      <Modal open={showModal} title="Nuevo Equipo" onClose={() => setShowModal(false)}>
        <div className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Nombre del Equipo</label>
            <input name="nombre" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} placeholder="Ej: Nahuel Primera" />
          </div>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Categoría</label>
              <select name="categoria" value={form.categoria} onChange={(e) => setForm({...form, categoria: e.target.value})}>
                <option value="">Seleccionar</option>
                {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Género</label>
              <select name="genero" value={form.genero} onChange={(e) => setForm({...form, genero: e.target.value})}>
                <option value="">Seleccionar</option>
                {GENEROS.map(gen => <option key={gen} value={gen}>{gen}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.modalActions}>
            <Button variant="primary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleCreateEquipo} disabled={saving}>Crear</Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}