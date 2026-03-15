import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PartidosPage.module.css";
import Button from "../../../components/ui/button/Button";
import { obtenerPartidosRecientes, obtenerDetallePartido } from "../../../api/partidos.api";
import { listarProximosPartidos } from "../../../api/fixture.api";
import { usePartidos } from "../../../hooks/usePartidos";
import type { FixturePartido } from "../../../types/fixture";

import { useTorneosActivos } from "../../../hooks/useTorneosActivos";
import { useInscripcionesTorneo } from "../../../hooks/useInscripcionesTorneo";
import { getPlantelActivoPorEquipo } from "../../../api/vistas/plantel.api";
import { generarPlanillaPDF } from "../../../services/PlanillaVacia.service";

/**
 * Página administrativa de gestión de partidos.
 * Lista el historial de encuentros con detalle en modal.
 * Permite cargar resultados desde cero o desde el fixture,
 * e imprimir planillas vacías en PDF para completar en campo.
 */
export default function PartidosPage() {
  const [partidos, setPartidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartido, setSelectedPartido] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  
  const navigate = useNavigate();
  const { parseIncidencias } = usePartidos();

  const agruparGoles = (str: string) => {
    const items = parseIncidencias(str);
    const map = new Map<string, { jugador: string; esAutogol: boolean; tiempos: { min: number; label: string }[] }>();
    items.forEach(g => {
      const key = `${g.jugador}|${g.esAutogol}`;
      if (!map.has(key)) map.set(key, { jugador: g.jugador, esAutogol: g.esAutogol, tiempos: [] });
      map.get(key)!.tiempos.push({ min: Number(g.minuto), label: `${g.minuto}'(${g.cuarto}C)` });
    });
    return Array.from(map.values()).map(g => ({
      ...g,
      tiempos: g.tiempos.sort((a, b) => a.min - b.min).map(t => t.label),
    }));
  };

  const agruparTarjetas = (str: string) => {
    const items = parseIncidencias(str);
    const map = new Map<string, { jugador: string; tipoTarjeta?: string; tiempos: { min: number; label: string }[] }>();
    items.forEach(t => {
      const key = `${t.jugador}|${t.tipoTarjeta}`;
      if (!map.has(key)) map.set(key, { jugador: t.jugador, tipoTarjeta: t.tipoTarjeta, tiempos: [] });
      map.get(key)!.tiempos.push({ min: Number(t.minuto), label: `${t.minuto}'(${t.cuarto}C)` });
    });
    return Array.from(map.values()).map(t => ({
      ...t,
      tiempos: t.tiempos.sort((a, b) => a.min - b.min).map(x => x.label),
    }));
  };

  // Estados para modal de fixture
  const [showFixtureModal, setShowFixtureModal] = useState(false);
  const [partidosPendientes, setPartidosPendientes] = useState<FixturePartido[]>([]);
  const [loadingFixture, setLoadingFixture] = useState(false);

  /**
   * Abre el modal de fixture y carga los partidos pendientes programados.
   */
  const abrirModalFixture = async () => {
    setShowFixtureModal(true);
    setLoadingFixture(true);
    try {
      const data = await listarProximosPartidos();
      setPartidosPendientes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFixture(false);
    }
  };

  // Estados para Impresión de Planilla
  const { torneos } = useTorneosActivos();
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selTorneo, setSelTorneo] = useState<any>(null);
  const { inscripciones } = useInscripcionesTorneo(selTorneo?.id_torneo);
  const [equipoL, setEquipoL] = useState<any>(null);
  const [equipoV, setEquipoV] = useState<any>(null);

  // Filtros
  const [filtroTorneo, setFiltroTorneo] = useState<string>("");
  const [filtroFecha, setFiltroFecha] = useState<string>("");

  // Carga el historial de partidos recientes al montar el componente.
  useEffect(() => {
    cargarPartidos();
  }, []);

  /** Obtiene el historial de partidos recientes y actualiza el estado. */
  const cargarPartidos = async () => {
    try {
      const data = await obtenerPartidosRecientes(); 
      setPartidos(data);
    } catch (err) {
      console.error("Error al cargar partidos", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene el plantel activo de un equipo filtrando solo integrantes con persona asignada.
   * @param idEquipo - ID del equipo cuyo plantel se quiere obtener.
   * @returns Array de integrantes válidos, o array vacío si no hay plantel.
   */
  const obtenerDatosPlantel = async (idEquipo: number) => {
    const data = await getPlantelActivoPorEquipo(idEquipo);
    if (!data || data.length === 0) return { jugadores: [], cuerpoTecnico: [] };
    const conPersona = data.filter((i: any) => i.id_persona !== null && i.id_persona !== undefined);
    return {
      jugadores: conPersona.filter((i: any) => i.rol_en_plantel === "JUGADOR"),
      cuerpoTecnico: conPersona.filter((i: any) => i.rol_en_plantel !== "JUGADOR"),
    };
  };

  /**
   * Obtiene los planteles de ambos equipos y genera el PDF de planilla vacía para imprimir.
   * Requiere que ambos equipos estén seleccionados en el modal de impresión.
   */
  const prepararImpresion = async () => {
    if (!equipoL || !equipoV) return alert("Selecciona ambos equipos");

    try {
      setLoading(true);

      const [datosLocal, datosVisit] = await Promise.all([
        obtenerDatosPlantel(equipoL.id_equipo),
        obtenerDatosPlantel(equipoV.id_equipo),
      ]);

      if (datosLocal.jugadores.length === 0 && datosVisit.jugadores.length === 0) {
        alert("Atención: No se encontraron jugadores en estos equipos.");
      }

      generarPlanillaPDF({
        torneo: selTorneo,
        local: equipoL,
        visitante: equipoV,
        plantelLocal: datosLocal.jugadores,
        plantelVisitante: datosVisit.jugadores,
        cuerpoTecnicoLocal: datosLocal.cuerpoTecnico,
        cuerpoTecnicoVisitante: datosVisit.cuerpoTecnico,
      });
      
      setShowPrintModal(false);
    } catch (error) {
      console.error("Error en impresión:", error);
      alert("Error al obtener los planteles para el PDF");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carga el detalle completo de un partido y abre el modal de visualización.
   * @param partido - Objeto partido con al menos `id_partido`.
   */
  const handleVerDetalle = async (partido: any) => {
  try {
    setLoading(true); // Reutilizamos tu estado de loading
    const detalle = await obtenerDetallePartido(partido.id_partido);
    setSelectedPartido(detalle);
    setShowModal(true);
  } catch (error) {
    alert("No se pudo cargar el detalle del partido");
    console.error(error);
  } finally {
    setLoading(false);
  }
};

  /**
   * Parsea el string de plantilla de la DB y retorna un array de jugadores/staff.
   * @param str - String con integrantes separados por "; " y campos por "|".
   *              Formato: "Apellido|Nombre|Camiseta|Rol; ...".
   * @returns Array con nombreCompleto, camiseta y rol de cada integrante.
   */
  const parsePlantilla = (str: string) => {
    if (!str) return [];
    return str.split("; ").map(item => {
      // Usamos split con el pipe. Si vienen 3 campos (viejo) o 4 (nuevo), funcionará.
      const parts = item.split("|");
      const apellido = parts[0];
      const nombre = parts[1];
      const camiseta = parts[2];
      const rol = parts[3] || "JUGADOR"; // Si no existe el 4to campo, es Jugador

      return { 
        nombreCompleto: `${apellido}, ${nombre}`, 
        camiseta: (camiseta === "" || camiseta === "null") ? null : camiseta,
        rol: rol
      };
    });
  };

  /**
   * Retorna el ícono visual correspondiente al tipo de tarjeta disciplinaria.
   * @param tipo - Tipo de tarjeta: "VERDE", "AMARILLA" o "ROJA".
   * @returns Elemento JSX con el ícono, o null si el tipo no aplica.
   */
  const renderIconoTarjeta = (tipo?: string) => {
  switch (tipo) {
    case "VERDE":
      return <span className={`${styles.cardIcon} ${styles.verde}`} />;
    case "AMARILLA":
      return <span className={`${styles.cardIcon} ${styles.amarilla}`} />;
    case "ROJA":
      return <span className={`${styles.cardIcon} ${styles.roja}`} />;
    default:
      return null;
  }
};

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Gestión de Partidos</h1>
          <p>Administra resultados y planillas de campo.</p>
        </div>
        <div className={styles.botones}>
          <Button variant="outline" onClick={() => setShowPrintModal(true)}>
            🖨️ Imprimir Planilla Vacía
          </Button>
          <Button variant="outline" onClick={abrirModalFixture}>
            📋 Desde fixture
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/partidos/nueva-planilla")}>
            + Cargar Resultado
          </Button>
          <Button variant="secondary" onClick={() => navigate("/admin")}>
            ← Volver
          </Button>
        </div>
      </header>

      <div className={styles.tableContainer}>
        <h3>Historial de Encuentros</h3>

        <div className={styles.filterBar}>
          <select value={filtroTorneo} onChange={e => { setFiltroTorneo(e.target.value); setFiltroFecha(""); }}>
            <option value="">— Seleccionar torneo —</option>
            {Array.from(new Set(partidos.map(p => p.id_torneo))).map(idT => {
              const torneo = torneos.find(t => t.id_torneo === idT);
              const partido = partidos.find(p => p.id_torneo === idT);
              const anio = partido ? partido.fecha.slice(0, 4) : "";
              const label = torneo
                ? `${torneo.nombre} — Cat. ${torneo.categoria} (${anio})`
                : partido?.nombre_torneo ?? String(idT);
              return <option key={idT} value={idT}>{label}</option>;
            })}
          </select>
          <select value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} disabled={!filtroTorneo}>
            <option value="">— Seleccionar día —</option>
            {Array.from(new Set(
              partidos
                .filter(p => !filtroTorneo || p.id_torneo === Number(filtroTorneo))
                .map(p => p.fecha.slice(0, 10))
            )).sort((a, b) => b.localeCompare(a)).map(f => (
              <option key={f} value={f}>{new Date(f + "T00:00:00").toLocaleDateString()}</option>
            ))}
          </select>
        </div>

        {loading && !showPrintModal ? (
          <p className={styles.loadingText}>Cargando datos...</p>
        ) : !filtroTorneo ? (
          <p className={styles.loadingText}>Seleccioná un torneo para ver los partidos.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Torneo</th>
                <th>Encuentro</th>
                <th>Resultado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {partidos
                .filter(p => p.id_torneo === Number(filtroTorneo))
                .filter(p => !filtroFecha || p.fecha.slice(0, 10) === filtroFecha)
                .map((partido) => (
                <tr key={partido.id_partido}>
                  <td>📅 {new Date(partido.fecha + "T00:00:00").toLocaleDateString()}</td>
                  <td>{partido.nombre_torneo}</td>
                  <td>
                    <div className={styles.matchupRow}>
                      <strong>{partido.equipo_local_nombre}</strong>
                      <small className={styles.vsLabel}>vs</small>
                      <strong>{partido.equipo_visitante_nombre}</strong>
                    </div>
                  </td>
                  <td>
                    <span className={styles.resHighlight}>
                      {partido.goles_local} - {partido.goles_visitante}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button variant="secondary" size="sm" onClick={() => handleVerDetalle(partido)}>
                        📄 Detalle
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/partidos/nueva-planilla?partido=${partido.id_partido}`)}>
                        ✏️ Editar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
         {/* Modal Detalle */}
      {showModal && selectedPartido && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2>{selectedPartido.nombre_torneo}</h2>
                <p className={styles.subHeader}>
                  Fecha {selectedPartido.numero_fecha} | {new Date(selectedPartido.fecha + "T00:00:00").toLocaleDateString()}
                </p>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className={styles.mainScoreBanner}>
              <div className={styles.bigTeamName}>{selectedPartido.equipo_local_nombre}</div>
              <div className={styles.bigScore}>{selectedPartido.goles_local} - {selectedPartido.goles_visitante}</div>
              <div className={styles.bigTeamName}>{selectedPartido.equipo_visitante_nombre}</div>
            </div>

            {/* --- NUEVA SECCIÓN DE AUTORIDADES --- */}
              <div className={styles.refereeRibbon}>
                <div className={styles.refereeItem}>
                  <span className={styles.icon}>🏁</span>
                  <span>Árbitros: <strong>{selectedPartido.arbitros || "No designados"}</strong></span>
                </div>
                {(selectedPartido.juez_mesa_local || selectedPartido.juez_mesa_visitante) && (
                  <div className={styles.refereeItem}>
                    <span className={styles.icon}>📋</span>
                    <span>Mesa: <strong>{
                      [selectedPartido.juez_mesa_local, selectedPartido.juez_mesa_visitante]
                        .filter(Boolean)
                        .join(" / ")
                    }</strong></span>
                  </div>
                )}
              </div>

            <div className={styles.detailsBody}>
              <div className={styles.teamSection}>
                <h3 className={styles.localTitle}>🏠 {selectedPartido.equipo_local_nombre}</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoCol}>
                    <label>📋 Plantilla</label>
                    <div className={styles.plantillaList}>
                      {parsePlantilla(selectedPartido.lista_jugadores_local).map((j, i) => (
                        <div key={i} className={styles.jugadorRow}>
                          <span className={styles.tshirt}>
                            {/* Si es JUGADOR muestra número, sino un ícono de tablero/carpeta */}
                            {j.rol === "JUGADOR" ? (j.camiseta || '-') : '📋'}
                          </span> 
                          <span className={j.rol !== "JUGADOR" ? styles.staffName : ""}>
                            {j.nombreCompleto} 
                            {/* Etiqueta pequeña si es DT o Ayudante */}
                            {j.rol !== "JUGADOR" && <small className={styles.rolTag}> ({j.rol})</small>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.infoCol}>
                    <label>🏑 Goles / 🎴 Sanciones</label>
                    {agruparGoles(selectedPartido.lista_goles_local).map((g, i) => (
                      <div key={i} className={styles.incidenciaItem}>
                        <div className={styles.incRow}>
                          <span>🏑 {g.jugador} {g.esAutogol && <strong>(En contra)</strong>}</span>
                          {g.tiempos.length > 1 && <span className={styles.incCount}>x{g.tiempos.length}</span>}
                        </div>
                        <small className={styles.incTiempos}>{g.tiempos.join("  ")}</small>
                      </div>
                    ))}
                    {agruparTarjetas(selectedPartido.lista_tarjetas_local).map((t, i) => (
                      <div key={i} className={styles.incidenciaItem}>
                        <div className={styles.incRow}>
                          <span>{renderIconoTarjeta(t.tipoTarjeta)}{t.jugador}</span>
                          {t.tiempos.length > 1 && <span className={styles.incCount}>x{t.tiempos.length}</span>}
                        </div>
                        <small className={styles.incTiempos}>{t.tiempos.join("  ")}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <hr className={styles.divider} />

              <div className={styles.teamSection}>
                <h3 className={styles.visitanteTitle}>🚩 {selectedPartido.equipo_visitante_nombre}</h3>
                <div className={styles.infoGrid}>
                   <div className={styles.infoCol}>
                    <label>📋 Plantilla</label>
                    <div className={styles.plantillaList}>
                      {parsePlantilla(selectedPartido.lista_jugadores_visitante).map((j, i) => (
                        <div key={i} className={styles.jugadorRow}>
                          <span className={styles.tshirt}>
                            {/* Si es JUGADOR muestra número, sino un ícono de tablero/carpeta */}
                            {j.rol === "JUGADOR" ? (j.camiseta || '-') : '📋'}
                          </span> 
                          <span className={j.rol !== "JUGADOR" ? styles.staffName : ""}>
                            {j.nombreCompleto} 
                            {/* Etiqueta pequeña si es DT o Ayudante */}
                            {j.rol !== "JUGADOR" && <small className={styles.rolTag}> ({j.rol})</small>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.infoCol}>
                    <label>🏑 Goles / 🎴 Sanciones</label>
                    {agruparGoles(selectedPartido.lista_goles_visitante).map((g, i) => (
                      <div key={i} className={styles.incidenciaItem}>
                        <div className={styles.incRow}>
                          <span>🏑 {g.jugador} {g.esAutogol && <strong>(En contra)</strong>}</span>
                          {g.tiempos.length > 1 && <span className={styles.incCount}>x{g.tiempos.length}</span>}
                        </div>
                        <small className={styles.incTiempos}>{g.tiempos.join("  ")}</small>
                      </div>
                    ))}
                    {agruparTarjetas(selectedPartido.lista_tarjetas_visitante).map((t, i) => (
                      <div key={i} className={styles.incidenciaItem}>
                        <div className={styles.incRow}>
                          <span>{renderIconoTarjeta(t.tipoTarjeta)}{t.jugador}</span>
                          {t.tiempos.length > 1 && <span className={styles.incCount}>x{t.tiempos.length}</span>}
                        </div>
                        <small className={styles.incTiempos}>{t.tiempos.join("  ")}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
               <p>Ubicación: <strong>{selectedPartido.ubicacion}</strong></p>
               <p className={styles.audit}>Cargado por: {selectedPartido.creado_por}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal fixture pendiente */}
      {showFixtureModal && (
        <div className={styles.modalOverlay} onClick={() => setShowFixtureModal(false)}>
          <div className={styles.modalContentSmall} onClick={e => e.stopPropagation()}>
            <h3>Partidos pendientes del fixture</h3>
            <p className={styles.modalHelp}>Seleccioná un partido para cargar su resultado.</p>

            {loadingFixture ? (
              <p>Cargando...</p>
            ) : partidosPendientes.length === 0 ? (
              <p className={styles.modalHelp}>No hay partidos pendientes en el fixture.</p>
            ) : (
              <div className={styles.fixtureList}>
                {partidosPendientes.map(p => (
                  <button
                    key={p.id_fixture_partido}
                    className={styles.fixtureItem}
                    onClick={() => {
                      setShowFixtureModal(false);
                      navigate(`/admin/partidos/nueva-planilla?fixture=${p.id_fixture_partido}`);
                    }}
                  >
                    <span className={styles.fixtureEquipos}>
                      {p.nombre_equipo_local} vs {p.nombre_equipo_visitante}
                    </span>
                    <span className={styles.fixtureMeta}>
                      {p.nombre_torneo}
                      {p.fecha_programada ? ` · ${p.fecha_programada}` : ""}
                      {p.numero_fecha ? ` · Fecha ${p.numero_fecha}` : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setShowFixtureModal(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {showPrintModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPrintModal(false)}>
          <div className={styles.modalContentSmall} onClick={e => e.stopPropagation()}>
            <h3>Generar Planilla de Campo</h3>
            <p className={styles.modalHelp}>Selecciona los equipos para generar el PDF de asistencia.</p>
            
            <div className={styles.printForm}>
              <select onChange={(e) => {
                const id = Number(e.target.value);
                setSelTorneo(torneos.find(t => t.id_torneo === id));
                setEquipoL(null); setEquipoV(null);
              }}>
                <option value="">Seleccionar Torneo...</option>
                {torneos.map(t => <option key={t.id_torneo} value={t.id_torneo}>{t.nombre}</option>)}
              </select>

              <select disabled={!selTorneo} value={equipoL?.id_inscripcion || ""} onChange={(e) => setEquipoL(inscripciones.find(i => i.id_inscripcion === Number(e.target.value)))}>
                <option value="">Equipo Local</option>
                {inscripciones.map(i => <option key={i.id_inscripcion} value={i.id_inscripcion}>{i.nombre_equipo}</option>)}
              </select>

              <select disabled={!selTorneo} value={equipoV?.id_inscripcion || ""} onChange={(e) => setEquipoV(inscripciones.find(i => i.id_inscripcion === Number(e.target.value)))}>
                <option value="">Equipo Visitante</option>
                {inscripciones.map(i => <option key={i.id_inscripcion} value={i.id_inscripcion}>{i.nombre_equipo}</option>)}
              </select>
            </div>

            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setShowPrintModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={prepararImpresion} disabled={!equipoV || loading}>
                {loading ? "Obteniendo datos..." : "🖨️ Generar PDF"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}