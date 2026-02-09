import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { usePlantelActivo } from "../../../hooks/usePlantelActivo";
import { getFichajesPorClub } from "../../../api/fichajes.api";
import { bajaIntegrantePlantel } from "../../../api/planteles.api";
import { agregarIntegrante } from "../../../api/plantelIntegrantes.api";
import type { TipoRolPersona } from "../../../constants/enums";

import PlantelLista from "./PlantelLista";
import Button from "../../../components/ui/button/Button";
import Modal from "../../../components/ui/modal/Modal";
import styles from "./EquipoDetalle.module.css";

// Mapeo de Enums para legibilidad y consistencia
const ROL_LABELS: Record<string, string> = {
  JUGADOR: "Jugador",
  DT: "Director Técnico",
  ARBITRO: "Árbitro",
  PREPARADOR_FISICO: "Prep. Físico",
  MEDICO: "Médico",
  DELEGADO: "Delegado",
};

interface FichajeActivo {
  id_fichaje_rol: number;
  id_persona: number;
  persona_nombre: string;
  persona_apellido: string;
  persona_documento: string;
  persona_genero: string;
  rol: string;
  fecha_inicio: string;
}

export default function EquipoDetalle() {
  const navigate = useNavigate();
  const { id_equipo } = useParams<{ id_equipo: string }>();
  const equipoId = id_equipo ? Number(id_equipo) : undefined;
  const location = useLocation();

  const { id_club, clubNombre, equipoNombre, categoria, generoEquipo } = 
    (location.state || {}) as {
      id_club?: number;
      clubNombre?: string;
      equipoNombre?: string;
      categoria?: string;
      generoEquipo?: string;
    };

  const { integrantes, id_plantel, loading, refetch } = usePlantelActivo(equipoId);

  // Estados
  const [modalType, setModalType] = useState<"agregar" | "eliminar" | null>(null);
  const [rolSeleccionado, setRolSeleccionado] = useState<string>("JUGADOR");
  const [fichajes, setFichajes] = useState<FichajeActivo[]>([]);
  const [loadingFichajes, setLoadingFichajes] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [genero, setGenero] = useState<string>("TODOS");
  const [integranteAEliminar, setIntegranteAEliminar] = useState<{id_integrante: number, nombre: string} | null>(null);

  // 1. Sincronizar género con el del equipo al abrir el modal
  useEffect(() => {
    if (modalType === "agregar" && generoEquipo) {
      const g = generoEquipo.toUpperCase();
      setGenero(g === "MASCULINO" || g === "FEMENINO" ? g : "TODOS");
    }
  }, [modalType, generoEquipo]);

  // 2. Cargar fichajes del club
  useEffect(() => {
    if (modalType !== "agregar" || !id_club) return;

    const cargarFichajes = async () => {
      setLoadingFichajes(true);
      try {
        const data = await getFichajesPorClub(id_club, true);
        setFichajes(data);
      } catch (err) {
        console.error("Error al cargar fichajes:", err);
      } finally {
        setLoadingFichajes(false);
      }
    };
    cargarFichajes();
  }, [modalType, id_club]);

  // 3. Filtrado de fichajes (useMemo para performance)
  const fichajesFiltrados = useMemo(() => {
    return fichajes.filter((f) => {
      const matchRol = f.rol === rolSeleccionado;
      const matchGenero = genero === "TODOS" || f.persona_genero?.toUpperCase() === genero.toUpperCase();
      
      const searchLower = busqueda.toLowerCase();
      const nombreCompleto = `${f.persona_nombre} ${f.persona_apellido}`.toLowerCase();
      const documento = f.persona_documento?.toString() || "";
      const matchBusqueda = nombreCompleto.includes(searchLower) || documento.includes(searchLower);

      return matchRol && matchGenero && matchBusqueda;
    });
  }, [fichajes, rolSeleccionado, genero, busqueda]);

  // 4. Acción: Agregar integrante
  const handleAgregar = async (f: FichajeActivo) => {
    if (!id_plantel) {
      alert("No hay un plantel activo configurado para este equipo.");
      return;
    }

    try {
      await agregarIntegrante({
        id_plantel: Number(id_plantel),
        id_persona: Number(f.id_persona),
        id_fichaje_rol: Number(f.id_fichaje_rol),
        rol_en_plantel: rolSeleccionado as TipoRolPersona
      });
      
      await refetch();
      setModalType(null);
      setBusqueda("");
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Error al agregar integrante";
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  if (loading) return <div className={styles.empty}>Cargando equipo...</div>;

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <Button variant="secondary" onClick={() => navigate(-1)}>← Volver</Button>
        <div className={styles.titleInfo}>
            <h1>{equipoNombre} <small className={styles.subtext}>({clubNombre})</small></h1>
            <p>{categoria} · {generoEquipo}</p>
        </div>
        <Button onClick={() => setModalType("agregar")}>+ Agregar Integrante</Button>
      </header>

      {integrantes && integrantes.length > 0 ? (
        <div className={styles.plantelSection}>
            <PlantelLista 
                integrantes={integrantes} 
                editable={true} 
                onEliminar={(i) => {
                    setIntegranteAEliminar({ id_integrante: i.id_plantel_integrante, nombre: `${i.nombre} ${i.apellido}` });
                    setModalType("eliminar");
                }} 
            />
        </div>
      ) : (
        <div className={styles.emptyCard}>
            <p>No hay integrantes cargados en este plantel.</p>
        </div>
      )}

      {/* MODAL AGREGAR */}
      <Modal open={modalType === "agregar"} title="Fichajes Disponibles" onClose={() => setModalType(null)}>
        <div className={styles.filters}>
          <div className={styles.row}>
            <select value={rolSeleccionado} onChange={(e) => setRolSeleccionado(e.target.value)}>
              {Object.entries(ROL_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <select value={genero} onChange={(e) => setGenero(e.target.value)}>
              <option value="TODOS">Todos los Géneros</option>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMENINO">Femenino</option>
            </select>
          </div>
          <input 
            type="text" 
            placeholder="Buscar por nombre o DNI..." 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.scrollList}>
          {loadingFichajes ? (
            <p className={styles.empty}>Consultando base de datos...</p>
          ) : (
            fichajesFiltrados.map((f) => (
              <div key={f.id_fichaje_rol} className={styles.personaCard}>
                <div className={styles.personaInfo}>
                  <span className={styles.personaName}>{f.persona_apellido}, {f.persona_nombre}</span>
                  <span className={styles.personaSub}>
                    <strong>DNI:</strong> {f.persona_documento} | <strong>Fichado:</strong> {new Date(f.fecha_inicio).toLocaleDateString()}
                  </span>
                </div>
                <Button
                  onClick={() => handleAgregar(f)}>Agregar</Button>
              </div>
            ))
          )}
          {!loadingFichajes && fichajesFiltrados.length === 0 && (
            <p className={styles.empty}>No se encontraron resultados para los filtros aplicados.</p>
          )}
        </div>
      </Modal>

      {/* MODAL ELIMINAR */}
      <Modal open={modalType === "eliminar"} title="Confirmar Baja" onClose={() => setModalType(null)}>
        <p>¿Estás seguro de quitar a <strong>{integranteAEliminar?.nombre}</strong> del plantel?</p>
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
          <Button variant="danger" onClick={async () => {
             if(integranteAEliminar) {
               await bajaIntegrantePlantel(integranteAEliminar.id_integrante);
               refetch();
               setModalType(null);
             }
          }}>Dar de Baja</Button>
        </div>
      </Modal>
    </section>
  );
}