import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { getFichajesPorClub } from "../../../api/fichajes.api";
import {
  bajaIntegrantePlantel,
  createPlantel,
  getPlantelesDeEquipo,
  updatePlantel,
  cerrarPlantel,
  deletePlantel,
} from "../../../api/planteles.api";
import { agregarIntegrante } from "../../../api/plantelIntegrantes.api";
import type { TipoRolPersona } from "../../../constants/enums";
import type { Plantel } from "../../../types/plantel";
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
    | "cerrar_plantel"
    | "eliminar_plantel"
    | "agregar"
    | "eliminar_integrante"
    | null;
  const [modalType, setModalType] = useState<ModalType>(null);

  // ── Forms / selección ──────────────────────────────────────
  const [nuevoPlantelData, setNuevoPlantelData] = useState({
    nombre: `Plantel ${equipoNombre || ""} ${new Date().getFullYear()}`,
    temporada: new Date().getFullYear().toString(),
  });
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
  const cargarPlanteles = async () => {
    if (!equipoId) return;
    setLoadingPlanteles(true);
    try {
      const data = await getPlantelesDeEquipo(equipoId);
      setPlanteles(data);
      // Selecciona automáticamente el activo, o el primero si no hay activo
      const activo = data.find(p => p.activo) ?? data[0] ?? null;
      setPlantelSeleccionado(activo);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPlanteles(false);
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
  const handleCrearPlantel = async () => {
    if (!equipoId) return;
    setSaving(true);
    try {
      await createPlantel({ ...nuevoPlantelData, id_equipo: equipoId, activo: true });
      await cargarPlanteles();
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

  const handleCerrarPlantel = async () => {
    if (!plantelSeleccionado) return;
    setSaving(true);
    try {
      await cerrarPlantel(plantelSeleccionado.id_plantel);
      await cargarPlanteles();
      setModalType(null);
    } catch (err: any) {
      alert(getErrorMessage(err, "Error al cerrar plantel"));
    }finally { setSaving(false); }
      };

  const handleEliminarPlantel = async () => {
    if (!plantelSeleccionado) return;
    setSaving(true);
    try {
      await deletePlantel(plantelSeleccionado.id_plantel);
      await cargarPlanteles();
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
          <Button onClick={() => {
            setNuevoPlantelData({
              nombre: `Plantel ${equipoNombre || ""} ${new Date().getFullYear()}`,
              temporada: new Date().getFullYear().toString(),
            });
            setModalType("crear_plantel");
          }}>
            + Nuevo plantel
          </Button>
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
                  <span className={styles.plantelCardTemporada}>{p.temporada}</span>
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
                    {p.activo && (
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnWarning}`}
                        title="Cerrar plantel"
                        onClick={e => { e.stopPropagation(); setPlantelSeleccionado(p); setModalType("cerrar_plantel"); }}
                      >🔒</button>
                    )}
                    {!p.activo && (
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
          <h2 className={styles.sectionTitle}>
            Integrantes — {plantelSeleccionado.nombre}
            {!plantelActivo && <span className={styles.badgeCerrado} style={{ marginLeft: 10 }}>Cerrado</span>}
          </h2>
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
              {plantelActivo && <small>Usá el botón "Agregar Integrante" para comenzar.</small>}
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Crear plantel ── */}
      <Modal open={modalType === "crear_plantel"} title="Nuevo Plantel" onClose={() => setModalType(null)}>
        <div className={styles.formContainer}>
          <div className={styles.field}>
            <label>Nombre</label>
            <input type="text" value={nuevoPlantelData.nombre} onChange={e => setNuevoPlantelData({ ...nuevoPlantelData, nombre: e.target.value })} />
          </div>
          <div className={styles.field}>
            <label>Temporada</label>
            <input type="text" placeholder="2025 o 2025-2026" value={nuevoPlantelData.temporada} onChange={e => setNuevoPlantelData({ ...nuevoPlantelData, temporada: e.target.value })} />
          </div>
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
            <Button onClick={handleCrearPlantel} disabled={saving}>Crear</Button>
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

      {/* ── Modal: Cerrar plantel ── */}
      <Modal open={modalType === "cerrar_plantel"} title="Cerrar Plantel" onClose={() => setModalType(null)}>
        <p>¿Cerrar el plantel <strong>{plantelSeleccionado?.nombre}</strong>?</p>
        <p className={styles.warningText}>Una vez cerrado no podrás agregar más integrantes. El historial queda registrado.</p>
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleCerrarPlantel} disabled={saving}>Cerrar plantel</Button>
        </div>
      </Modal>

      {/* ── Modal: Eliminar plantel ── */}
      <Modal open={modalType === "eliminar_plantel"} title="Eliminar Plantel" onClose={() => setModalType(null)}>
        <p>¿Eliminar el plantel <strong>{plantelSeleccionado?.nombre}</strong>?</p>
        <p className={styles.warningText}>Esta acción es un soft-delete. Solo se puede eliminar un plantel cerrado.</p>
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
