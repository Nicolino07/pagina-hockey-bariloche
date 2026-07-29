import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { getFichajesPorClub } from "../../../api/fichajes.api";
import {
  bajaIntegrantePlantel,
  createPlantel,
  getPlantelesDeEquipo,
  updatePlantel,
  deletePlantel,
} from "../../../api/planteles.api";
import { copiarPlantel } from "../../../api/planteles.api";
import { agregarIntegrante } from "../../../api/plantelIntegrantes.api";
import { useTorneosActivos } from "../../../hooks/useTorneosActivos";
import type { TipoRolPersona } from "../../../constants/enums";
import type { Plantel } from "../../../types/plantel";
import type { Torneo } from "../../../types/torneo";
import type { PlantelActivoIntegrante } from "../../../types/vistas";

import PlantelLista from "./PlantelLista";
import Button from "../../../components/ui/button/Button";
import Modal from "../../../components/ui/modal/Modal";
import styles from "./EquipoDetalle.module.css";

const ROL_LABELS: Record<string, string> = {
  JUGADOR: "Jugador",
  DT: "Director Técnico",
  ARBITRO: "Árbitro",
  ASISTENTE: "Asistente",
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

  const { id_club, clubNombre, equipoNombre, categoria, division, generoEquipo } =
    (location.state || {}) as {
      id_club?: number;
      clubNombre?: string;
      equipoNombre?: string;
      categoria?: string;
      division?: string | null;
      generoEquipo?: string;
    };

  // -------funcion de error -------------------------------------------------

  const getErrorMessage = (err: any, fallback: string) => {
    return (
      err.response?.data?.error?.message ||
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      fallback
    );
  };


  // `torneos` (todos los activos) se usa solo para mostrar nombres en las
  // tarjetas. Para el alta se usa `torneosDisponibles`, que trae únicamente los
  // válidos para este equipo y evita ofrecer opciones que terminarían en error.
  const { torneos } = useTorneosActivos();
  const [torneosDisponibles, setTorneosDisponibles] = useState<Torneo[]>([]);

  // ── Planteles ────────────────────────────────────────��─────
  const [planteles, setPlanteles] = useState<Plantel[]>([]);
  const [plantelSeleccionado, setPlantelSeleccionado] = useState<Plantel | null>(null);
  const [loadingPlanteles, setLoadingPlanteles] = useState(true);

  // ── Integrantes del plantel seleccionado ───────────────────
  const [integrantes, setIntegrantes] = useState<PlantelActivoIntegrante[]>([]);
  const [loadingIntegrantes, setLoadingIntegrantes] = useState(false);

  // ── Modales ────────────────────────────────────────────────
  type ModalType =
    | "crear_plantel"
    | "editar_plantel"
    | "eliminar_plantel"
    | "agregar"
    | "eliminar_integrante"
    | "copiar_plantel"
    | null;
  const [modalType, setModalType] = useState<ModalType>(null);

  // ── Forms / selección ──────────────────────────────────────
  // El alta solo pide el torneo: nombre y temporada los deriva el backend.
  const [nuevoPlantelData, setNuevoPlantelData] = useState({ id_torneo: "" as string });
  // Copia de nómina: se elige el plantel de origen; el destino es el abierto.
  const [copiaData, setCopiaData] = useState({ id_plantel_origen: "" });
  const [editPlantelData, setEditPlantelData] = useState({
    nombre: "",
    temporada: "",
    descripcion: "",
  });

  const [rolSeleccionado, setRolSeleccionado] = useState<string>("JUGADOR");
  const [busqueda, setBusqueda] = useState("");
  const [genero, setGenero] = useState<string>("TODOS");
  const [fichajes, setFichajes] = useState<FichajeActivo[]>([]);
  const [loadingFichajes, setLoadingFichajes] = useState(false);
  const [integranteAEliminar, setIntegranteAEliminar] = useState<{ id: number; nombreCompleto: string } | null>(null);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [resultadoCarga, setResultadoCarga] = useState<{ ok: string[]; errores: string[] } | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Carga inicial de planteles ─────────────────────────────
  /**
   * Recarga los planteles del equipo.
   *
   * @param idSeleccionar - Plantel a dejar abierto (ej. el recién creado). Sin
   * este dato se conserva el que ya estaba abierto; y si no había ninguno, se
   * abre el primer activo. Elegir "el primer activo" a secas dejó de alcanzar:
   * un equipo puede tener varios activos, uno por torneo.
   */
  const cargarPlanteles = async (idSeleccionar?: number) => {
    if (!equipoId) return;
    setLoadingPlanteles(true);
    try {
      const data = await getPlantelesDeEquipo(equipoId);
      setPlanteles(data);
      setPlantelSeleccionado(prev => {
        const buscado = idSeleccionar ?? prev?.id_plantel;
        return (
          data.find(p => p.id_plantel === buscado) ??
          data.find(p => p.activo) ??
          data[0] ??
          null
        );
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPlanteles(false);
    }
  };

  /** Refresca los torneos elegibles: al crear una nómina, ese torneo sale de la lista. */
  const refrescarTorneosDisponibles = async () => {
    if (!equipoId) return;
    try {
      const m = await import("../../../api/planteles.api");
      setTorneosDisponibles(await m.getTorneosDisponiblesParaPlantel(equipoId));
    } catch {
      setTorneosDisponibles([]);
    }
  };

  useEffect(() => { cargarPlanteles(); }, [equipoId]);

  // ── Carga integrantes cuando cambia el plantel seleccionado ─
  useEffect(() => {
    if (!plantelSeleccionado) { setIntegrantes([]); return; }
    setLoadingIntegrantes(true);
    import("../../../api/planteles.api")
      .then(m => m.getIntegrantesByPlantel(plantelSeleccionado.id_plantel, plantelSeleccionado.activo))
      .then(data => {
        // Mapea PlantelIntegrante (con persona anidada) al shape que espera PlantelLista
        const mapped = (data as any[]).map(i => ({
          ...i,
          nombre_persona: i.persona?.nombre ?? "",
          apellido_persona: i.persona?.apellido ?? "",
          documento: i.persona?.documento ?? null,
        }));
        setIntegrantes(mapped);
      })
      .catch(console.error)
      .finally(() => setLoadingIntegrantes(false));
  }, [plantelSeleccionado]);

  const integrantesValidos = useMemo(
    () => integrantes.filter(i => i.id_plantel_integrante !== null),
    [integrantes]
  );

  // ── Fichajes para modal agregar ────────────────────────────
  useEffect(() => {
    if (modalType === "agregar") {
      setSeleccionados(new Set());
      setResultadoCarga(null);
      if (generoEquipo) {
        const g = generoEquipo.toUpperCase();
        setGenero(g === "MASCULINO" || g === "FEMENINO" ? g : "TODOS");
      }
    }
  }, [modalType, generoEquipo]);

  useEffect(() => {
    if (modalType !== "agregar" || !id_club) return;
    setLoadingFichajes(true);
    getFichajesPorClub(Number(id_club), true)
      .then(data => setFichajes(data))
      .catch(console.error)
      .finally(() => setLoadingFichajes(false));
  }, [modalType, id_club]);

  const fichajesFiltrados = useMemo(() => {
    return fichajes.filter(f => {
      const matchRol = f.rol === rolSeleccionado;
      const esJugador = rolSeleccionado === "JUGADOR";
      const matchGenero = !esJugador || genero === "TODOS" || f.persona_genero?.toUpperCase() === genero.toUpperCase();
      const searchLower = busqueda.toLowerCase();
      const matchBusqueda =
        `${f.persona_nombre} ${f.persona_apellido}`.toLowerCase().includes(searchLower) ||
        f.persona_documento?.toString().includes(searchLower);
      return matchRol && matchGenero && matchBusqueda;
    });
  }, [fichajes, rolSeleccionado, genero, busqueda]);

  // ── Handlers planteles ─────────────────────────────────────
  const handleCopiarPlantel = async () => {
    if (!copiaData.id_plantel_origen || !plantelSeleccionado) return;
    setSaving(true);
    try {
      // Se copia HACIA el plantel abierto: la idea es traer la nómina completa
      // de un golpe y después ajustarla (agregar o quitar) sobre ese mismo.
      const res = await copiarPlantel({
        id_plantel_origen: Number(copiaData.id_plantel_origen),
        id_plantel_destino: plantelSeleccionado.id_plantel,
      });
      await cargarPlanteles();
      // Recarga integrantes (mismo patrón que el alta manual)
      const updated = await import("../../../api/planteles.api")
        .then(m => m.getIntegrantesByPlantel(plantelSeleccionado.id_plantel));
      setIntegrantes((updated as any[]).map(i => ({
        ...i,
        nombre_persona: i.persona?.nombre ?? "",
        apellido_persona: i.persona?.apellido ?? "",
        documento: i.persona?.documento ?? null,
      })));
      setModalType(null);
      // Los omitidos no son un error: son integrantes que ya no son elegibles
      // (fichaje vencido, suspensión, etc.) y hay que resolverlos a mano.
      if (res.omitidos.length > 0) {
        const detalle = res.omitidos.map(o => `• ${o.nombre}: ${o.motivo}`).join("\n");
        alert(`Se copiaron ${res.copiados} integrantes.\n\nNo se pudieron copiar ${res.omitidos.length}:\n${detalle}`);
      } else {
        alert(`Se copiaron ${res.copiados} integrantes.`);
      }
    } catch (err: any) {
      alert(getErrorMessage(err, "Error al copiar el plantel"));
    } finally { setSaving(false); }
  };

  const handleCrearPlantel = async () => {
    if (!equipoId || !nuevoPlantelData.id_torneo) return;
    setSaving(true);
    try {
      // El torneo es obligatorio: la nómina existe siempre para una competencia.
      // El backend deriva de ahí el nombre y la temporada.
      const creado = await createPlantel({
        id_equipo: equipoId,
        id_torneo: Number(nuevoPlantelData.id_torneo),
        activo: true,
      });
      // Se abre directo la nómina nueva, que es lo que se va a querer llenar.
      await cargarPlanteles(creado.id_plantel);
      await refrescarTorneosDisponibles();
      setModalType(null);
    } catch (err: any) {
      alert(getErrorMessage(err, "Error al crear plantel"));
    } finally { setSaving(false); }
  };

  const handleEditarPlantel = async () => {
    if (!plantelSeleccionado) return;
    setSaving(true);
    try {
      await updatePlantel(plantelSeleccionado.id_plantel, editPlantelData);
      await cargarPlanteles();
      setModalType(null);
    } catch (err: any) {
      alert(getErrorMessage(err, "Error al editar plantel"));
    } finally { setSaving(false); }
  };

  const handleEliminarPlantel = async () => {
    if (!plantelSeleccionado) return;
    setSaving(true);
    try {
      await deletePlantel(plantelSeleccionado.id_plantel);
      await cargarPlanteles();
      // Al borrar la nómina, ese torneo vuelve a estar disponible.
      await refrescarTorneosDisponibles();
      setModalType(null);
    } catch (err: any) {
      alert(getErrorMessage(err, "Error al eliminar plantel"));
    } finally { setSaving(false); }
  };

  // ── Handlers integrantes ───────────────────────────────────
  const toggleSeleccionado = (id: number) => {
    setSeleccionados(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAgregarSeleccionados = async () => {
    if (!plantelSeleccionado) return;
    const aAgregar = fichajesFiltrados.filter(f => seleccionados.has(f.id_fichaje_rol));
    const resultados = await Promise.allSettled(
      aAgregar.map(f =>
        agregarIntegrante({
          id_plantel: plantelSeleccionado.id_plantel,
          id_persona: Number(f.id_persona),
          id_fichaje_rol: Number(f.id_fichaje_rol),
          rol_en_plantel: rolSeleccionado as TipoRolPersona,
        }).then(() => `${f.persona_apellido}, ${f.persona_nombre}`)
      )
    );
    // Recarga integrantes
    const updated = await import("../../../api/planteles.api")
      .then(m => m.getIntegrantesByPlantel(plantelSeleccionado.id_plantel));
    setIntegrantes((updated as any[]).map(i => ({
      ...i,
      nombre_persona: i.persona?.nombre ?? "",
      apellido_persona: i.persona?.apellido ?? "",
      documento: i.persona?.documento ?? null,
    })));

    const ok = resultados.filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled").map(r => r.value);
    const errores = resultados.filter((r): r is PromiseRejectedResult => r.status === "rejected").map((r, i) => {
      const nombre = `${aAgregar[i].persona_apellido}, ${aAgregar[i].persona_nombre}`;
      const detalle = getErrorMessage(r.reason, "Error desconocido");
      return `${nombre}: ${detalle}`;
    });
    if (errores.length === 0) setModalType(null);
    else setResultadoCarga({ ok, errores });
  };

  const handleBajaConfirmada = async () => {
    if (!integranteAEliminar?.id || !plantelSeleccionado) return;
    try {
      await bajaIntegrantePlantel(integranteAEliminar.id);
      const updated = await import("../../../api/planteles.api")
        .then(m => m.getIntegrantesByPlantel(plantelSeleccionado.id_plantel));
      setIntegrantes((updated as any[]).map(i => ({
        ...i,
        nombre_persona: i.persona?.nombre ?? "",
        apellido_persona: i.persona?.apellido ?? "",
        documento: i.persona?.documento ?? null,
      })));
      setModalType(null);
      setIntegranteAEliminar(null);
    } catch (err: any) {
      alert(`No se pudo dar de baja: ${getErrorMessage(err, "Error del servidor")}`);
    }
  };

  if (loadingPlanteles) return <div className={styles.empty}>Cargando...</div>;

  const plantelActivo = plantelSeleccionado?.activo ?? false;

  return (
    <section className={styles.container}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <Button variant="secondary" onClick={() => navigate(-1)}>← Volver</Button>
        <div className={styles.titleInfo}>
          <h1>{equipoNombre} <small className={styles.subtext}>({clubNombre})</small></h1>
          <p>{categoria}{division ? ` ${division}` : ""} · {generoEquipo}</p>
        </div>
      </header>

      {/* ── Sección de planteles ── */}
      <div className={styles.plantelesSection}>
        <div className={styles.plantelesHeader}>
          <h2 className={styles.sectionTitle}>Planteles</h2>
          <div className={styles.plantelesHeaderActions}>
            <Button onClick={() => {
              setNuevoPlantelData({ id_torneo: "" });
              if (equipoId) {
                import("../../../api/planteles.api")
                  .then(m => m.getTorneosDisponiblesParaPlantel(equipoId))
                  .then(ts => {
                    setTorneosDisponibles(ts);
                    // Con un solo torneo elegible, se preselecciona.
                    if (ts.length === 1) {
                      setNuevoPlantelData({ id_torneo: String(ts[0].id_torneo) });
                    }
                  })
                  .catch(() => setTorneosDisponibles([]));
              }
              setModalType("crear_plantel");
            }}>
              + Nuevo plantel
            </Button>
          </div>
        </div>

        {planteles.length === 0 ? (
          <div className={styles.emptyCard}>
            <p>No hay planteles creados para este equipo.</p>
            <small>Crea uno para comenzar.</small>
          </div>
        ) : (
          <div className={styles.plantelesGrid}>
            {planteles.map(p => (
              <div
                key={p.id_plantel}
                className={`${styles.plantelCard} ${plantelSeleccionado?.id_plantel === p.id_plantel ? styles.plantelCardActive : ""}`}
                onClick={() => setPlantelSeleccionado(p)}
              >
                <div className={styles.plantelCardInfo}>
                  <span className={styles.plantelCardNombre}>{p.nombre}</span>
                  <span className={styles.plantelCardTemporada}>
                    {p.id_torneo
                      ? (torneos.find(t => t.id_torneo === p.id_torneo)?.nombre ?? `Torneo #${p.id_torneo}`)
                      : `Histórico${p.temporada ? ` · ${p.temporada}` : ""}`}
                  </span>
                  {p.descripcion && <span className={styles.plantelCardDesc}>{p.descripcion}</span>}
                </div>
                <div className={styles.plantelCardFooter}>
                  <span className={p.activo ? styles.badgeActivo : styles.badgeCerrado}>
                    {p.activo ? "Activo" : "Cerrado"}
                  </span>
                  <div className={styles.plantelCardActions}>
                    {p.activo && (
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnAdd}`}
                        title="Agregar integrante"
                        onClick={e => {
                          e.stopPropagation();
                          setPlantelSeleccionado(p);
                          setModalType("agregar");
                        }}
                      >+ Agregar</button>
                    )}
                    <button
                      className={styles.iconBtn}
                      title="Editar"
                      onClick={e => {
                        e.stopPropagation();
                        setEditPlantelData({ nombre: p.nombre, temporada: p.temporada, descripcion: p.descripcion || "" });
                        setPlantelSeleccionado(p);
                        setModalType("editar_plantel");
                      }}
                    >✏</button>
                    {(
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        title="Eliminar plantel"
                        onClick={e => { e.stopPropagation(); setPlantelSeleccionado(p); setModalType("eliminar_plantel"); }}
                      >🗑</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Integrantes del plantel seleccionado ── */}
      {plantelSeleccionado && (
        <div className={styles.plantelSection}>
          <div className={styles.plantelesHeader}>
            <h2 className={styles.sectionTitle}>
              Integrantes — {plantelSeleccionado.nombre}
              {!plantelActivo && <span className={styles.badgeCerrado} style={{ marginLeft: 10 }}>Cerrado</span>}
            </h2>
            {plantelActivo && (
              <div className={styles.plantelesHeaderActions}>
                {planteles.length > 1 && (
                  <Button variant="secondary" onClick={() => {
                    setCopiaData({ id_plantel_origen: "" });
                    setModalType("copiar_plantel");
                  }}>
                    Traer nómina de otro torneo
                  </Button>
                )}
                <Button onClick={() => setModalType("agregar")}>+ Agregar integrantes</Button>
              </div>
            )}
          </div>
          {loadingIntegrantes ? (
            <p>Cargando integrantes...</p>
          ) : integrantesValidos.length > 0 ? (
            <PlantelLista
              integrantes={integrantesValidos}
              editable={plantelActivo}
              onEliminar={i => {
                if (i.id_plantel_integrante) {
                  setIntegranteAEliminar({
                    id: i.id_plantel_integrante,
                    nombreCompleto: `${i.nombre_persona} ${i.apellido_persona}`,
                  });
                  setModalType("eliminar_integrante");
                }
              }}
            />
          ) : (
            <div className={styles.emptyCard}>
              <p>Este plantel no tiene integrantes.</p>
              {plantelActivo && (
                <small>
                  Agregá integrantes a mano, o traé la nómina completa de otro
                  torneo y ajustala.
                </small>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Traer nómina desde otro plantel ── */}
      <Modal
        open={modalType === "copiar_plantel"}
        title={`Traer nómina a "${plantelSeleccionado?.nombre ?? ""}"`}
        onClose={() => setModalType(null)}
      >
        <div className={styles.formContainer}>
          <div className={styles.field}>
            <label>Copiar desde</label>
            <select
              value={copiaData.id_plantel_origen}
              onChange={e => setCopiaData({ id_plantel_origen: e.target.value })}
            >
              <option value="">— Elegí el plantel de origen —</option>
              {planteles
                .filter(pl => pl.id_plantel !== plantelSeleccionado?.id_plantel)
                .map(pl => (
                  <option key={pl.id_plantel} value={pl.id_plantel}>
                    {pl.nombre}
                    {pl.id_torneo
                      ? ` (${torneos.find(t => t.id_torneo === pl.id_torneo)?.nombre ?? `Torneo #${pl.id_torneo}`})`
                      : " (histórico)"}
                  </option>
                ))}
            </select>
            <small>
              Se agregan los integrantes activos del plantel elegido a esta
              nómina. Los que ya están no se duplican, y después podés agregar o
              quitar a mano. No se modifica el plantel de origen.
            </small>
          </div>
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
            <Button onClick={handleCopiarPlantel} disabled={saving || !copiaData.id_plantel_origen}>
              Traer nómina
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Crear plantel ── */}
      <Modal open={modalType === "crear_plantel"} title="Nuevo Plantel" onClose={() => setModalType(null)}>
        <div className={styles.formContainer}>
          {torneosDisponibles.length === 0 ? (
            // Sin torneos elegibles no hay plantel que crear: la nómina existe
            // siempre para un torneo puntual.
            <div className={styles.field}>
              <p className={styles.warningText}>
                Este equipo no está anotado en ningún torneo pendiente de nómina.
              </p>
              <small>
                Inscribilo primero en un torneo desde la pantalla del torneo. Si ya
                está inscripto, puede que ya le hayas cargado la nómina de todos sus
                torneos activos.
              </small>
            </div>
          ) : (
            <div className={styles.field}>
              <label>Torneo</label>
              <select
                value={nuevoPlantelData.id_torneo}
                onChange={e => setNuevoPlantelData({ ...nuevoPlantelData, id_torneo: e.target.value })}
              >
                <option value="">— Elegí el torneo —</option>
                {torneosDisponibles.map(t => (
                  <option key={t.id_torneo} value={t.id_torneo}>
                    {t.nombre} — {t.categoria} {t.genero}
                  </option>
                ))}
              </select>
              <small>
                Solo los torneos donde el equipo está inscripto y todavía no tiene
                nómina. El nombre y la temporada se derivan del torneo.
              </small>
            </div>
          )}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setModalType(null)}>
              {torneosDisponibles.length === 0 ? "Entendido" : "Cancelar"}
            </Button>
            {torneosDisponibles.length > 0 && (
              <Button
                onClick={handleCrearPlantel}
                disabled={saving || !nuevoPlantelData.id_torneo}
              >
                Crear
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* ── Modal: Editar plantel ── */}
      <Modal open={modalType === "editar_plantel"} title="Editar Plantel" onClose={() => setModalType(null)}>
        <div className={styles.formContainer}>
          <div className={styles.field}>
            <label>Nombre</label>
            <input type="text" value={editPlantelData.nombre} onChange={e => setEditPlantelData({ ...editPlantelData, nombre: e.target.value })} />
          </div>
          <div className={styles.field}>
            <label>Temporada</label>
            <input type="text" value={editPlantelData.temporada} onChange={e => setEditPlantelData({ ...editPlantelData, temporada: e.target.value })} />
          </div>
          <div className={styles.field}>
            <label>Descripción <small>(opcional)</small></label>
            <input type="text" value={editPlantelData.descripcion} onChange={e => setEditPlantelData({ ...editPlantelData, descripcion: e.target.value })} />
          </div>
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
            <Button onClick={handleEditarPlantel} disabled={saving}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Eliminar plantel ── */}
      <Modal open={modalType === "eliminar_plantel"} title="Eliminar Plantel" onClose={() => setModalType(null)}>
        <p>¿Eliminar el plantel <strong>{plantelSeleccionado?.nombre}</strong>?</p>
        <p className={styles.warningText}>
          Se elimina de forma <strong>definitiva</strong>, junto con sus integrantes, y no
          se puede deshacer. Solo se permite si nunca se jugó un partido con esta nómina:
          si ya se jugó, no se borra (perdería goles y tarjetas).
        </p>
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleEliminarPlantel} disabled={saving}>Eliminar</Button>
        </div>
      </Modal>

      {/* ── Modal: Agregar integrantes ── */}
      <Modal open={modalType === "agregar"} title="Agregar Integrantes" onClose={() => setModalType(null)}>
        {resultadoCarga ? (
          <>
            <div className={styles.resultadoCarga}>
              {resultadoCarga.ok.length > 0 && (
                <div className={styles.resultadoOk}>
                  <strong>✓ Agregados ({resultadoCarga.ok.length})</strong>
                  <ul>{resultadoCarga.ok.map(n => <li key={n}>{n}</li>)}</ul>
                </div>
              )}
              {resultadoCarga.errores.length > 0 && (
                <div className={styles.resultadoError}>
                  <strong>✗ Fallaron ({resultadoCarga.errores.length})</strong>
                  <ul>{resultadoCarga.errores.map(e => <li key={e}>{e}</li>)}</ul>
                </div>
              )}
            </div>
            <div className={styles.modalActions}>
              <Button onClick={() => setModalType(null)}>Cerrar</Button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.filters}>
              <select value={rolSeleccionado} onChange={e => setRolSeleccionado(e.target.value)}>
                {Object.entries(ROL_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
              <input type="text" placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className={styles.searchInput} />
            </div>
            <div className={styles.scrollList}>
              {loadingFichajes ? <p>Cargando...</p> : fichajesFiltrados.map(f => {
                const checked = seleccionados.has(f.id_fichaje_rol);
                return (
                  <label key={f.id_fichaje_rol} className={`${styles.personaCard} ${checked ? styles.personaCardSelected : ""}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleSeleccionado(f.id_fichaje_rol)} className={styles.checkbox} />
                    <div className={styles.personaInfo}>
                      <span className={styles.personaName}>{f.persona_apellido}, {f.persona_nombre}</span>
                      <small>DNI: {f.persona_documento}</small>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
              <Button onClick={handleAgregarSeleccionados} disabled={seleccionados.size === 0}>
                Agregar seleccionados ({seleccionados.size})
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* ── Modal: Dar de baja integrante ── */}
      <Modal open={modalType === "eliminar_integrante"} title="Confirmar Baja" onClose={() => setModalType(null)}>
        <p>¿Dar de baja a <strong>{integranteAEliminar?.nombreCompleto}</strong>?</p>
        <p className={styles.warningText}>El registro histórico se conserva.</p>
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleBajaConfirmada}>Confirmar Baja</Button>
        </div>
      </Modal>
    </section>
  );
}
