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

  const [modalType, setModalType] = useState<"agregar" | "eliminar" | "crear_plantel" | null>(null);
  const [rolSeleccionado, setRolSeleccionado] = useState<string>("JUGADOR");
  const [busqueda, setBusqueda] = useState("");
  const [genero, setGenero] = useState<string>("TODOS");
  
  const [fichajes, setFichajes] = useState<FichajeActivo[]>([]);
  const [loadingFichajes, setLoadingFichajes] = useState(false);
  const [integranteAEliminar, setIntegranteAEliminar] = useState<{id: number, nombreCompleto: string} | null>(null);
  const [nuevoPlantelData, setNuevoPlantelData] = useState({
    nombre: `Plantel ${equipoNombre || ''} ${new Date().getFullYear()}`,
    temporada: new Date().getFullYear().toString(),
  });

  const tienePlantelCreado = id_plantel !== null;
  
  // Mapeo limpio asegurando que existan los datos mínimos para la lista
  const integrantesValidos = useMemo(() => {
    if (!integrantes) return [];
    return integrantes.filter(i => i.id_plantel_integrante !== null);
  }, [integrantes]);

  useEffect(() => {
    if (modalType === "agregar" && generoEquipo) {
      const g = generoEquipo.toUpperCase();
      setGenero(g === "MASCULINO" || g === "FEMENINO" ? g : "TODOS");
    }
  }, [modalType, generoEquipo]);

  useEffect(() => {
    // Verificamos que exista id_club antes de disparar la carga
    if (modalType !== "agregar" || !id_club) return;

    const cargarFichajes = async () => {
      setLoadingFichajes(true);
      try {
        // Usamos id_club que viene del state de ClubDetalle
        const data = await getFichajesPorClub(Number(id_club), true);
        setFichajes(data);
      } catch (err) { 
        console.error("Error al cargar fichajes del club:", err); 
      } finally { 
        setLoadingFichajes(false); 
      }

      console.log({
        clubRecibido: id_club,
        fichajesEncontrados: fichajes.length,
        plantelActual: id_plantel,
        generoFiltro: genero
      });
    };

  cargarFichajes();
}, [modalType, id_club]); // Se dispara cuando se abre el modal O cambia el id_club

  const fichajesFiltrados = useMemo(() => {
    return fichajes.filter((f) => {
      // 1. Coincidencia de Rol (Siempre obligatoria)
      const matchRol = f.rol === rolSeleccionado;

      // 2. Coincidencia de Género (SÓLO si es JUGADOR)
      // Si el rol NO es jugador, matchGenero siempre será true.
      const esJugador = rolSeleccionado === "JUGADOR";
      const matchGenero = !esJugador || 
                          genero === "TODOS" || 
                          f.persona_genero?.toUpperCase() === genero.toUpperCase();

      // 3. Coincidencia de Búsqueda (Texto)
      const searchLower = busqueda.toLowerCase();
      const matchBusqueda = `${f.persona_nombre} ${f.persona_apellido}`.toLowerCase().includes(searchLower) || 
                            f.persona_documento?.toString().includes(searchLower);

      return matchRol && matchGenero && matchBusqueda;
    });
  }, [fichajes, rolSeleccionado, genero, busqueda]);

  const handleOpenAdd = () => !tienePlantelCreado ? setModalType("crear_plantel") : setModalType("agregar");

  const handleCrearPlantelInicial = async () => {
    if (!equipoId) return;
    try {
      await createPlantel({ ...nuevoPlantelData, id_equipo: equipoId, activo: true, creado_por: "admin" });
      await refetch();
      setModalType("agregar"); 
    } catch (err: any) {
      if (err.response?.status === 409) { await refetch(); setModalType("agregar"); }
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
    } catch (err: any) { alert(err.response?.data?.detail || "Error al agregar"); }
  };

  const handleBajaConfirmada = async () => {
    if (!integranteAEliminar?.id) return;
    try {
      await bajaIntegrantePlantel(integranteAEliminar.id);
      await refetch();
      setModalType(null);
      setIntegranteAEliminar(null);
    } catch (err: any) {
      alert(`No se pudo eliminar: ${err.response?.data?.detail || "Error del servidor"}`);
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

      {integrantesValidos.length > 0 ? (
        <div className={styles.plantelSection}>
            <PlantelLista 
              integrantes={integrantesValidos} 
              editable={true} 
              onEliminar={(i) => {
                if (i.id_plantel_integrante) {
                  setIntegranteAEliminar({ 
                    id: i.id_plantel_integrante,
                    nombreCompleto: `${i.nombre_persona} ${i.apellido_persona}`,
                  });
                  setModalType("eliminar");
                }
              }}
            />
        </div>
      ) : (
        <div className={styles.emptyCard}>
            <p>{tienePlantelCreado ? "El plantel no tiene integrantes aún." : "No hay un plantel configurado."}</p>
            <small>Usa el botón superior para empezar.</small>
        </div>
      )}

      {/* Modal Crear Plantel */}
      <Modal open={modalType === "crear_plantel"} title="Iniciar Nuevo Plantel" onClose={() => setModalType(null)}>
        <div className={styles.formContainer}>
          <div className={styles.field}><label>Nombre</label>
            <input type="text" value={nuevoPlantelData.nombre} onChange={(e) => setNuevoPlantelData({...nuevoPlantelData, nombre: e.target.value})} />
          </div>
          <div className={styles.field}><label>Temporada</label>
            <input type="text" value={nuevoPlantelData.temporada} onChange={(e) => setNuevoPlantelData({...nuevoPlantelData, temporada: e.target.value})} />
          </div>
          <div className={styles.modalActions}>
             <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
             <Button onClick={handleCrearPlantelInicial}>Crear Plantel</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Agregar */}
      <Modal open={modalType === "agregar"} title="Fichajes Disponibles" onClose={() => setModalType(null)}>
        <div className={styles.filters}>
          <select value={rolSeleccionado} onChange={(e) => setRolSeleccionado(e.target.value)}>
            {Object.entries(ROL_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
          <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={styles.searchInput} />
        </div>
        <div className={styles.scrollList}>
          {loadingFichajes ? <p>Cargando...</p> : fichajesFiltrados.map((f) => (
            <div key={f.id_fichaje_rol} className={styles.personaCard}>
              <div className={styles.personaInfo}>
                <span className={styles.personaName}>{f.persona_apellido}, {f.persona_nombre}</span>
                <small>DNI: {f.persona_documento}</small>
              </div>
              <Button onClick={() => handleAgregar(f)}>Agregar</Button>
            </div>
          ))}
        </div>
      </Modal>

      {/* Modal Eliminar */}
      <Modal open={modalType === "eliminar"} title="Confirmar Baja" onClose={() => setModalType(null)}>
        <p>¿Estás seguro de que deseas quitar a <strong>{integranteAEliminar?.nombreCompleto}</strong>?</p>
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleBajaConfirmada}>Confirmar Baja</Button>
        </div>
      </Modal>
    </section>
  );
}