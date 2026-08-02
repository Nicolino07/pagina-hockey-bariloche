import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { getFichajesPorClub } from "../../../api/fichajes.api";
import {
  bajaIntegrantePlantel,
  createPlantel,
  getPlantelesDeEquipo,
  getIntegrantesByPlantel,
  updatePlantel,
  deletePlantel,
} from "../../../api/planteles.api";
import { agregarIntegrante } from "../../../api/plantelIntegrantes.api";
import { useTorneosActivos } from "../../../hooks/useTorneosActivos";
import { marcarSuspendidos } from "../../../utils/suspensiones";
import type { TipoRolPersona } from "../../../constants/enums";
import type { Plantel } from "../../../types/plantel";
import type { Torneo } from "../../../types/torneo";
import type { PlantelIntegrante } from "../../../types/plantelIntegrante";
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

  /** Mapea PlantelIntegrante (con persona anidada) al shape que espera PlantelLista. */
  const mapIntegrantes = (data: any[]): PlantelActivoIntegrante[] =>
    data.map(i => ({
      ...i,
      nombre_persona: i.persona?.nombre ?? "",
      apellido_persona: i.persona?.apellido ?? "",
      documento: i.persona?.documento ?? null,
    }));


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
  // La copia no inserta directo: primero se trae una vista previa editable
  // (`copiaPreview` + `copiaSeleccionados`) y recién al confirmar se insertan
  // los integrantes elegidos.
  const [copiaData, setCopiaData] = useState({ id_plantel_origen: "" });
  const [copiaPreview, setCopiaPreview] = useState<PlantelIntegrante[]>([]);
  const [copiaSeleccionados, setCopiaSeleccionados] = useState<Set<number>>(new Set());
  // Informativo: se muestran en rojo en la vista previa, no se descartan solos
  // (el trigger de la base los rechaza igual al confirmar si corresponde).
  const [copiaSuspendidos, setCopiaSuspendidos] = useState<Set<number>>(new Set());
  const [loadingCopiaPreview, setLoadingCopiaPreview] = useState(false);
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
    } catch (err: any) {
      // Si esto falla en silencio, la pantalla queda con los planteles viejos
      // sin ningún indicio de que algo salió mal (parece que "no se refrescó").
      alert(getErrorMessage(err, "No se pudo actualizar la lista de planteles. Recargá la página."));
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
    getIntegrantesByPlantel(plantelSeleccionado.id_plantel, plantelSeleccionado.activo)
      .then(data => setIntegrantes(mapIntegrantes(data)))
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
    if (modalType !== "agregar" || !id_club || !plantelSeleccionado) return;
    setLoadingFichajes(true);
    // Si el plantel es de un torneo, no ofrecemos personas que ya estén
    // anotadas en el plantel de otro equipo del mismo club para ese mismo
    // torneo: el backend lo bloquearía igual, pero no tiene sentido mostrarlas.
    const filtroTorneo = plantelSeleccionado.id_torneo
      ? { id_torneo: plantelSeleccionado.id_torneo, id_equipo: plantelSeleccionado.id_equipo }
      : undefined;
    getFichajesPorClub(Number(id_club), true, filtroTorneo)
      .then(data => setFichajes(data))
      .catch(console.error)
      .finally(() => setLoadingFichajes(false));
  }, [modalType, id_club, plantelSeleccionado]);

  // Quien ya integra el plantel activo con ese rol no debe ofrecerse de nuevo.
  const yaEnPlantelPorRol = useMemo(
    () => new Set(
      integrantesValidos
        .filter(i => i.rol_en_plantel === rolSeleccionado)
        .map(i => i.id_persona)
    ),
    [integrantesValidos, rolSeleccionado]
  );

  const fichajesFiltrados = useMemo(() => {
    return fichajes.filter(f => {
      const matchRol = f.rol === rolSeleccionado;
      const esJugador = rolSeleccionado === "JUGADOR";
      const matchGenero = !esJugador || genero === "TODOS" || f.persona_genero?.toUpperCase() === genero.toUpperCase();
      const searchLower = busqueda.toLowerCase();
      const matchBusqueda =
        `${f.persona_nombre} ${f.persona_apellido}`.toLowerCase().includes(searchLower) ||
        f.persona_documento?.toString().includes(searchLower);
      return matchRol && matchGenero && matchBusqueda && !yaEnPlantelPorRol.has(f.id_persona);
    });
  }, [fichajes, rolSeleccionado, genero, busqueda, yaEnPlantelPorRol]);

  // ── Handlers planteles ─────────────────────────────────────
  /**
   * Al elegir el plantel de origen se trae su nómina activa como vista previa
   * (sin insertar nada todavía). El admin puede destildar a quien no quiera
   * traer y recién al confirmar (`handleConfirmarCopia`) se insertan.
   */
  const handleSeleccionarOrigenCopia = async (idOrigenStr: string) => {
    setCopiaData({ id_plantel_origen: idOrigenStr });
    setCopiaPreview([]);
    setCopiaSeleccionados(new Set());
    setCopiaSuspendidos(new Set());
    if (!idOrigenStr) return;
    setLoadingCopiaPreview(true);
    try {
      const data = await getIntegrantesByPlantel(Number(idOrigenStr));
      // Los que ya están activos en el destino se omiten: no tiene sentido
      // ofrecer duplicarlos.
      const yaEstan = new Set(integrantesValidos.map(i => i.id_persona));
      const preview = data.filter(i => !yaEstan.has(i.id_persona));
      setCopiaPreview(preview);
      setCopiaSeleccionados(new Set(preview.map(i => i.id_plantel_integrante)));
      // Solo informativo: se marcan en rojo, no se destildan solos. El
      // trigger de la base los rechaza igual al confirmar si corresponde.
      marcarSuspendidos(preview)
        .then(marcados => setCopiaSuspendidos(new Set(
          marcados.filter(m => m.suspendido).map(m => m.id_plantel_integrante)
        )))
        .catch(() => setCopiaSuspendidos(new Set()));
    } catch (err: any) {
      alert(getErrorMessage(err, "Error al cargar la nómina de origen"));
    } finally { setLoadingCopiaPreview(false); }
  };

  const toggleCopiaSeleccionado = (id: number) => {
    setCopiaSeleccionados(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleConfirmarCopia = async () => {
    if (!plantelSeleccionado) return;
    const aImportar = copiaPreview.filter(i => copiaSeleccionados.has(i.id_plantel_integrante));
    if (aImportar.length === 0) return;
    setSaving(true);
    try {
      // Igual que el alta manual: se inserta uno por uno para que las
      // validaciones de negocio (fichaje vencido, suspensión, etc.) corran por
      // integrante sin abortar el resto.
      const resultados = await Promise.allSettled(
        aImportar.map(i =>
          agregarIntegrante({
            id_plantel: plantelSeleccionado.id_plantel,
            id_persona: i.id_persona,
            id_fichaje_rol: i.id_fichaje_rol,
            rol_en_plantel: i.rol_en_plantel,
            numero_camiseta: i.numero_camiseta ?? undefined,
          }).then(() => `${i.persona?.apellido}, ${i.persona?.nombre}`)
        )
      );
      const updated = await getIntegrantesByPlantel(plantelSeleccionado.id_plantel);
      setIntegrantes(mapIntegrantes(updated));

      const ok = resultados.filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled").map(r => r.value);
      // OJO: filtrar y después mapear con el índice del array YA filtrado
      // desalinea ese índice contra `aImportar` (el índice deja de ser el
      // original apenas hay un `fulfilled` antes de un `rejected`). Por eso
      // se guarda el índice original antes de filtrar.
      const errores = resultados
        .map((r, idx) => ({ r, idx }))
        .filter((x): x is { r: PromiseRejectedResult; idx: number } => x.r.status === "rejected")
        .map(({ r, idx }) => {
          const nombre = `${aImportar[idx].persona?.apellido}, ${aImportar[idx].persona?.nombre}`;
          return `${nombre}: ${getErrorMessage(r.reason, "Error desconocido")}`;
        });
      if (errores.length === 0) {
        setModalType(null);
        alert(`Se importaron ${ok.length} integrantes.`);
      } else {
        alert(`Se importaron ${ok.length} integrantes.\n\nNo se pudieron importar ${errores.length}:\n${errores.join("\n")}`);
      }
    } catch (err: any) {
      alert(getErrorMessage(err, "Error al importar la nómina"));
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
    const updated = await getIntegrantesByPlantel(plantelSeleccionado.id_plantel);
    setIntegrantes(mapIntegrantes(updated));

    const ok = resultados.filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled").map(r => r.value);
    // Mismo cuidado que en handleConfirmarCopia: el índice se toma ANTES de
    // filtrar, para no desalinearlo contra `aAgregar`.
    const errores = resultados
      .map((r, i) => ({ r, i }))
      .filter((x): x is { r: PromiseRejectedResult; i: number } => x.r.status === "rejected")
      .map(({ r, i }) => {
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
    } catch (err: any) {
      alert(`No se pudo dar de baja: ${getErrorMessage(err, "Error del servidor")}`);
      return;
    }
    setModalType(null);
    setIntegranteAEliminar(null);
    try {
      const updated = await getIntegrantesByPlantel(plantelSeleccionado.id_plantel);
      setIntegrantes(mapIntegrantes(updated));
    } catch (err: any) {
      // La baja ya se aplicó: si esto falla, no hay que decir que falló la
      // baja, solo que la lista quedó desactualizada.
      alert(getErrorMessage(err, "La baja se aplicó, pero no se pudo actualizar la lista. Recargá la página."));
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
                    setCopiaPreview([]);
                    setCopiaSeleccionados(new Set());
                    setCopiaSuspendidos(new Set());
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
              onChange={e => handleSeleccionarOrigenCopia(e.target.value)}
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
              Elegí el plantel de origen para ver su nómina. Los que ya están en
              esta nómina no se muestran (no se duplican). Podés destildar a
              quien no quieras traer antes de confirmar. No se modifica el
              plantel de origen.
            </small>
          </div>

          {copiaData.id_plantel_origen && (
            loadingCopiaPreview ? (
              <p>Cargando nómina…</p>
            ) : copiaPreview.length === 0 ? (
              <p className={styles.warningText}>
                No hay integrantes para traer (o ya están todos en esta nómina).
              </p>
            ) : (
              <div className={styles.scrollList}>
                {copiaPreview.map(i => {
                  const checked = copiaSeleccionados.has(i.id_plantel_integrante);
                  const suspendido = copiaSuspendidos.has(i.id_plantel_integrante);
                  return (
                    <label
                      key={i.id_plantel_integrante}
                      className={`${styles.personaCard} ${checked ? styles.personaCardSelected : ""} ${suspendido ? styles.personaCardSuspendido : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCopiaSeleccionado(i.id_plantel_integrante)}
                        className={styles.checkbox}
                      />
                      <div className={styles.personaInfo}>
                        <span className={styles.personaName}>
                          {i.persona?.apellido}, {i.persona?.nombre}
                          {suspendido && <span className={styles.suspendidoBadge}>SUSPENDIDO</span>}
                        </span>
                        <small>{ROL_LABELS[i.rol_en_plantel] ?? i.rol_en_plantel}</small>
                      </div>
                    </label>
                  );
                })}
              </div>
            )
          )}

          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setModalType(null)}>Cancelar</Button>
            <Button
              onClick={handleConfirmarCopia}
              disabled={saving || copiaSeleccionados.size === 0}
            >
              Confirmar e importar ({copiaSeleccionados.size})
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
