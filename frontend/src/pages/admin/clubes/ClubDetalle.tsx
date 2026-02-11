// ClubDetalle.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./ClubDetalle.module.css";

import Modal from "../../../components/ui/modal/Modal";
import Button from "../../../components/ui/button/Button";
import PlantelEquipo from "../equipos/PlantelEquipo";

import { crearEquipo, getEquiposByClub } from "../../../api/equipos.api";
import { getPersonas as searchPersonas } from "../../../api/personas.api"; // Asegúrate de que este sea el nombre correcto
import { getClubById } from "../../../api/clubes.api";
import { crearFichaje, getFichajesPorClub, darBajaFichaje } from "../../../api/fichajes.api";

import type { Club } from "../../../types/club";
import type { Equipo, EquipoCreate } from "../../../types/equipo";
import { GENEROS, CATEGORIAS } from "../../../constants/enums";

// Definición local de etiquetas para el select
const ROL_LABELS: Record<string, string> = {
  JUGADOR: "Jugador",
  DT: "Director Técnico",
  PREPARADOR_FISICO: "Prep. Físico",
  MEDICO: "Médico",
  DELEGADO: "Delegado",
};

export default function ClubDetalle() {
  const { id_club } = useParams<{ id_club: string }>();
  const navigate = useNavigate();

  const [club, setClub] = useState<Club | null>(null);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [fichajes, setFichajes] = useState<any[]>([]); 
  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFichajeModal, setShowFichajeModal] = useState(false);
  const [showFichados, setShowFichados] = useState(false); 
  const [saving, setSaving] = useState(false);
  const [equipoAbierto, setEquipoAbierto] = useState<number | null>(null);

  const [form, setForm] = useState<EquipoCreate>({
    nombre: "", categoria: "", genero: "", id_club: Number(id_club),
  });

  const [fichajeForm, setFichajeForm] = useState({
    id_persona: "",
    searchTerm: "",
    rol: "JUGADOR" // Valor inicial predeterminado
  });

  const cargarFichajes = async () => {
    if (!id_club) return;
    try {
      const data = await getFichajesPorClub(Number(id_club), true);
      setFichajes(data);
    } catch (err) { console.error(err); }
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
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { cargarDatosPrincipales(); }, [id_club]);

  // Lógica de búsqueda corregida para permitir multifunción
  const buscarPersonas = async (termino: string, rolActual: string) => {
    if (termino.length < 3) {
      setResultadosBusqueda([]);
      return;
    }

    setBuscando(true);
    try {
      const data = await searchPersonas(termino);
      
      const normalizar = (texto: string) =>
        texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

      const tLimpio = normalizar(termino);

      const filtrados = data.filter((p: any) => {
        const nombreCompleto = normalizar(`${p.nombre} ${p.apellido}`);
        const docStr = (p.documento || "").toString();
        const coincide = nombreCompleto.includes(tLimpio) || docStr.includes(tLimpio);

        // Se oculta solo si YA TIENE este rol específico en el club
        const yaFichadoConEseRol = fichajes.some(f => 
          Number(f.id_persona) === Number(p.id_persona) && 
          f.rol === rolActual && 
          f.activo === true
        );

        return coincide && !yaFichadoConEseRol;
      });

      setResultadosBusqueda(filtrados);
    } catch (err) {
      console.error(err);
    } finally {
      setBuscando(false);
    }
  };

  // Efecto para re-buscar si el usuario cambia el ROL en el modal
  useEffect(() => {
    if (fichajeForm.searchTerm.length >= 3) {
        buscarPersonas(fichajeForm.searchTerm, fichajeForm.rol);
    }
  }, [fichajeForm.rol]);

  const handleFichaje = async () => {
    if (!fichajeForm.id_persona) return;
    try {
      setSaving(true);
      await crearFichaje({
        id_persona: Number(fichajeForm.id_persona),
        id_club: Number(id_club),
        rol: fichajeForm.rol, // Usa el rol seleccionado en el form
        fecha_inicio: new Date().toISOString().split('T')[0],
        creado_por: "admin"
      });
      setShowFichajeModal(false);
      setFichajeForm({ id_persona: "", searchTerm: "", rol: "JUGADOR" });
      setResultadosBusqueda([]);
      await cargarFichajes();
    } catch (err) { alert("Error al fichar"); } 
    finally { setSaving(false); }
  };

  const handleCreateEquipo = async () => {
    if (!form.nombre.trim() || !form.categoria || !form.genero) return alert("Completa los datos");
    try {
      setSaving(true);
      const nuevoEquipo = await crearEquipo(form);
      setEquipos((prev) => [...prev, nuevoEquipo]);
      setShowModal(false);
      setForm({ ...form, nombre: "", categoria: "", genero: "" });
    } catch (err) { alert("Error al crear equipo"); } 
    finally { setSaving(false); }
  };

  if (loading || !club) return <div className={styles.container}>Cargando...</div>;

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <Button onClick={() => navigate("/admin/clubes")}>← Volver</Button>
        <div className={styles.titleInfo}>
          <h1>{club.nombre}</h1>
          <span className={styles.cityBadge}>{club.ciudad}</span>
        </div>
      </header>

      <div className={styles.actionBar}>
        <div className={styles.actionButtons}>
          <Button variant="primary" onClick={() => setShowFichados(!showFichados)}>
            {showFichados ? "Ocultar Personal" : "Personal y Miembros"}
          </Button>
          <Button onClick={() => setShowFichajeModal(true)} variant="secondary">⚡ Fichar</Button>
          <Button onClick={() => setShowModal(true)}>+ Nuevo equipo</Button>
        </div>
      </div>

      {showFichados && (
        <div className={styles.fichadosSection}>
          <div className={styles.fichadosGrid}>
            {fichajes.map((f) => (
              <div key={f.id_fichaje_rol} className={styles.fichadoCard}>
                <div>
                  <span className={styles.fichadoName}>{f.persona_apellido}, {f.persona_nombre}</span>
                  <div className={styles.fichadoTags}>
                    <span className={`${styles.rolTag} ${styles[f.rol] || ''}`}>{f.rol}</span>
                    <span className={styles.dateTag}>DNI: {f.persona_documento}</span>
                  </div>
                </div>
                <button 
                  className={styles.btnBaja} 
                  onClick={async () => {
                    if(confirm("¿Baja?")) {
                      await darBajaFichaje(f.id_fichaje_rol, {
                        fecha_fin: new Date().toISOString().split('T')[0],
                        actualizado_por: ""
                      });
                      cargarFichajes();
                    }
                  }}
                >Baja</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.equiposList}>
        {equipos.map((equipo) => (
          <div key={equipo.id_equipo} className={styles.equipoItem}>
            <div className={styles.equipoHeader} onClick={() => setEquipoAbierto(equipoAbierto === equipo.id_equipo ? null : equipo.id_equipo)}>
              <div>
                <span className={styles.equipoName}>{equipo.nombre}</span>
                <span className={styles.equipoMeta}>{equipo.categoria} · {equipo.genero}</span>
              </div>
              <button 
                className={styles.manageBtn} 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  navigate(`/admin/equipos/${equipo.id_equipo}`, {
                    state: {
                      id_club: club.id_club,
                      clubNombre: club.nombre,
                      equipoNombre: equipo.nombre,
                      categoria: equipo.categoria,
                      generoEquipo: equipo.genero
                    }
                  }); 
                }}
              >
                Gestionar
              </button>
            </div>
            {equipoAbierto === equipo.id_equipo && (
              <div className={styles.plantelContainer}>
                <PlantelEquipo id_equipo={equipo.id_equipo} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL FICHAJE CON FILTRO DE ROL */}
      <Modal open={showFichajeModal} title="Fichar Persona" onClose={() => setShowFichajeModal(false)}>
        <div className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>1. Seleccionar Rol de Fichaje</label>
            <select 
              value={fichajeForm.rol} 
              onChange={(e) => setFichajeForm({...fichajeForm, rol: e.target.value})}
            >
              {Object.entries(ROL_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>2. Buscar Persona (Nombre o DNI)</label>
            <input 
              type="text" 
              className={styles.stickySearch}
              placeholder="Escriba para buscar..."
              value={fichajeForm.searchTerm}
              onChange={(e) => {
                setFichajeForm({...fichajeForm, searchTerm: e.target.value});
                buscarPersonas(e.target.value, fichajeForm.rol);
              }}
            />
          </div>

          <div className={styles.selectorScrollable}>
            {buscando ? <p style={{padding: '10px'}}>Buscando...</p> : 
              resultadosBusqueda.map(p => (
                <div 
                  key={p.id_persona} 
                  className={`${styles.selectorItem} ${fichajeForm.id_persona === String(p.id_persona) ? styles.selectedItem : ''}`}
                  onClick={() => setFichajeForm({...fichajeForm, id_persona: String(p.id_persona)})}
                >
                  <div>
                    <span className={styles.itemName}>{p.apellido}, {p.nombre}</span>
                    <span className={styles.itemDni}>DNI: {p.documento}</span>
                  </div>
                  {fichajeForm.id_persona === String(p.id_persona) && <span className={styles.checkIcon}>✓</span>}
                </div>
              ))
            }
          </div>

          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setShowFichajeModal(false)}>Cancelar</Button>
            <Button onClick={handleFichaje} disabled={saving || !fichajeForm.id_persona}>
              Fichar como {ROL_LABELS[fichajeForm.rol]}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL NUEVO EQUIPO */}
      <Modal open={showModal} title="Nuevo Equipo" onClose={() => setShowModal(false)}>
        <div className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Nombre</label>
            <input value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} />
          </div>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Categoría</label>
              <select value={form.categoria} onChange={(e) => setForm({...form, categoria: e.target.value})}>
                <option value="">Seleccionar</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Género</label>
              <select value={form.genero} onChange={(e) => setForm({...form, genero: e.target.value})}>
                <option value="">Seleccionar</option>
                {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleCreateEquipo} disabled={saving}>Crear</Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}