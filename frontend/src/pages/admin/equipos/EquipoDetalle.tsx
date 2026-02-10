import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { usePlantelActivo } from "../../../hooks/usePlantelActivo";
import { getFichajesPorClub } from "../../../api/fichajes.api";
import { bajaIntegrantePlantel, createPlantel } from "../../../api/planteles.api";
import { agregarIntegrante } from "../../../api/plantelIntegrantes.api";
import type { TipoRolPersona } from "../../../constants/enums";

import PlantelLista from "./PlantelLista";
import Button from "../../../components/ui/button/Button";
import Modal from "../../../components/ui/modal/Modal";
import styles from "./EquipoDetalle.module.css";

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

  // Estados de UI
  const [modalType, setModalType] = useState<"agregar" | "eliminar" | "editar" | "crear_plantel" | null>(null);
  const [rolSeleccionado, setRolSeleccionado] = useState<string>("JUGADOR");
  const [busqueda, setBusqueda] = useState("");
  const [genero, setGenero] = useState<string>("TODOS");
  
  // Estados de Datos
  const [fichajes, setFichajes] = useState<FichajeActivo[]>([]);
  const [loadingFichajes, setLoadingFichajes] = useState(false);
  const [integranteAEliminar, setIntegranteAEliminar] = useState<{id_integrante: number, nombre: string} | null>(null);

  // Estado para la creación del plantel inicial
  const [nuevoPlantelData, setNuevoPlantelData] = useState({
    nombre: `Plantel ${equipoNombre} ${new Date().getFullYear()}`,
    temporada: new Date().getFullYear().toString(),
  });

  // --- LÓGICA DE TRADUCCIÓN DE DATOS ---
  const tienePlantelCreado = id_plantel !== null;
  
  // 1. Filtramos y mapeamos para que PlantelLista reciba lo que espera (nombre, apellido, documento)
  const integrantesMapeados = useMemo(() => {
    return integrantes
      .filter(i => i.id_persona !== null) // Solo los que son personas reales
      .map(i => ({
        ...i,
        nombre: i.nombre_persona,    // Traducción para PlantelLista
        apellido: i.apellido_persona, // Traducción para PlantelLista
        documento: i.documento_persona // Traducción para PlantelLista
      }));
  }, [integrantes]);

  // 1. Sincronizar género con el del equipo
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

  // 3. Filtrado de fichajes para el buscador
  const fichajesFiltrados = useMemo(() => {
    return fichajes.filter((f) => {
      const matchRol = f.rol === rolSeleccionado;
      const matchGenero = genero === "TODOS" || f.persona_genero?.toUpperCase() === genero.toUpperCase();
      const searchLower = busqueda.toLowerCase();
      const nombreCompleto = `${f.persona_nombre} ${f.persona_apellido}`.toLowerCase();
      const matchBusqueda = nombreCompleto.includes(searchLower) || f.persona_documento?.toString().includes(searchLower);
      return matchRol && matchGenero && matchBusqueda;
    });
  }, [fichajes, rolSeleccionado, genero, busqueda]);

  const handleOpenAdd = () => {
    if (!tienePlantelCreado) setModalType("crear_plantel");
    else setModalType("agregar");
  };

  const handleCrearPlantelInicial = async () => {
    if (!equipoId) return;
    try {
      await createPlantel({
        ...nuevoPlantelData,
        id_equipo: equipoId,
        activo: true,
        creado_por: "Nico_super"
      });
      await refetch();
      setModalType("agregar"); 
    } catch (err: any) {
      if (err.response?.status === 409) {
        await refetch();
        setModalType("agregar");
      }
    }
  };

  const handleAgregar = async (f: FichajeActivo) => {
    if (!id_plantel) return;
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
      alert("Error: " + (err.response?.data?.detail || "No se pudo agregar"));
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
        <Button onClick={handleOpenAdd}>+ Agregar Integrante</Button>
      </header>

      {integrantesMapeados.length > 0 ? (
        <div className={styles.plantelSection}>
            <PlantelLista 
                integrantes={integrantesMapeados} 
                editable={true} 
                onEliminar={(i) => {
                    setIntegranteAEliminar({ 
                        id_integrante: i.id_plantel_integrante, 
                        nombre: `${i.nombre} ${i.apellido}` 
                    });
                    setModalType("eliminar");
                }} 
            />
        </div>
      ) : (
        <div className={styles.emptyCard}>
            {tienePlantelCreado ? (
              <>
                <p>El plantel está configurado pero aún no tiene integrantes.</p>
                <small>Haz clic en "Agregar Integrante" para comenzar.</small>
              </>
            ) : (
              <>
                <p>No hay integrantes en el plantel activo.</p>
                <small>El equipo aún no tiene un plantel configurado.</small>
              </>
            )}
        </div>
      )}

      {/* --- LOS MODALES SE MANTIENEN IGUAL --- */}
      <Modal open={modalType === "crear_plantel"} title="Iniciar Nuevo Plantel" onClose={() => setModalType(null)}>
        <div className={styles.formContainer}>
          <div className={styles.field}>
            <label>Nombre del Plantel</label>
            <input type="text" value={nuevoPlantelData.nombre} onChange={(e) => setNuevoPlantelData({...nuevoPlantelData, nombre: e.target.value})} />
          </div>
          <div className={styles.field}>
            <label>Temporada</label>
            <input type="text" value={nuevoPlantelData.temporada} onChange={(e) => setNuevoPlantelData({...nuevoPlantelData, temporada: e.target.value})} />
          </div>
          <div className={styles.modalActions}>
             <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
             <Button onClick={handleCrearPlantelInicial}>Crear y Continuar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={modalType === "agregar"} title="Fichajes Disponibles" onClose={() => setModalType(null)}>
        <div className={styles.filters}>
          <div className={styles.row}>
            <select value={rolSeleccionado} onChange={(e) => setRolSeleccionado(e.target.value)}>
              {Object.entries(ROL_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={styles.searchInput} />
        </div>
        <div className={styles.scrollList}>
          {loadingFichajes ? <p>Cargando...</p> : fichajesFiltrados.map((f) => (
            <div key={f.id_fichaje_rol} className={styles.personaCard}>
              <div className={styles.personaInfo}>
                <span className={styles.personaName}>{f.persona_apellido}, {f.persona_nombre}</span>
              </div>
              <Button onClick={() => handleAgregar(f)}>Agregar</Button>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={modalType === "eliminar"} title="Confirmar Baja" onClose={() => setModalType(null)}>
        <p>¿Quitar a <strong>{integranteAEliminar?.nombre}</strong>?</p>
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
          <Button variant="danger" onClick={async () => {
             if(integranteAEliminar) {
               await bajaIntegrantePlantel(integranteAEliminar.id_integrante);
               await refetch();
               setModalType(null);
             }
          }}>Confirmar</Button>
        </div>
      </Modal>
    </section>
  );
}