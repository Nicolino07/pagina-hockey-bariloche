import { useEffect, useState } from "react";
import { obtenerPartidosRecientes, obtenerDetallePartido } from "../../../api/partidos.api";
import { useTorneosActivos } from "../../../hooks/useTorneosActivos";
import { usePartidos } from "../../../hooks/usePartidos";
import styles from "./ResultadosPage.module.css";

export default function ResultadosPage() {
  const [partidos, setPartidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTorneo, setFiltroTorneo] = useState<string>("");
  const [filtroFecha, setFiltroFecha] = useState<string>("");
  const [selectedPartido, setSelectedPartido] = useState<any>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const { torneos } = useTorneosActivos();
  const { parseIncidencias } = usePartidos();

  useEffect(() => {
    obtenerPartidosRecientes()
      .then(setPartidos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleVerDetalle = async (partido: any) => {
    setLoadingDetalle(true);
    try {
      const detalle = await obtenerDetallePartido(partido.id_partido);
      setSelectedPartido(detalle);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const parsePlantilla = (str: string) => {
    if (!str) return [];
    return str.split("; ").map(item => {
      const parts = item.split("|");
      return {
        nombreCompleto: `${parts[0]}, ${parts[1]}`,
        camiseta: (parts[2] === "" || parts[2] === "null") ? null : parts[2],
        rol: parts[3] || "JUGADOR",
      };
    });
  };

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

  const renderIconoTarjeta = (tipo?: string) => {
    switch (tipo) {
      case "VERDE":   return <span className={`${styles.cardIcon} ${styles.verde}`} />;
      case "AMARILLA": return <span className={`${styles.cardIcon} ${styles.amarilla}`} />;
      case "ROJA":    return <span className={`${styles.cardIcon} ${styles.roja}`} />;
      default: return null;
    }
  };

  const partidosFiltrados = partidos
    .filter(p => !filtroTorneo || p.id_torneo === Number(filtroTorneo))
    .filter(p => !filtroFecha || p.fecha.slice(0, 10) === filtroFecha);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Resultados</h1>
        <p>Historial completo de encuentros jugados.</p>
      </div>

      <div className={styles.filterBar}>
        <select value={filtroTorneo} onChange={e => { setFiltroTorneo(e.target.value); setFiltroFecha(""); }}>
          <option value="">— Seleccionar torneo —</option>
          {Array.from(new Set(partidos.map(p => p.id_torneo))).map(idT => {
            const torneo = torneos.find(t => t.id_torneo === idT);
            const partido = partidos.find(p => p.id_torneo === idT);
            const anio = partido ? partido.fecha.slice(0, 4) : "";
            const label = torneo
              ? `${torneo.nombre} — Cat. ${torneo.categoria}${torneo.division ? ` ${torneo.division}` : ""} (${anio})`
              : partido?.nombre_torneo ?? String(idT);
            return <option key={idT} value={idT}>{label}</option>;
          })}
        </select>
        <select value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} disabled={!filtroTorneo}>
          <option value="">— Todas las fechas —</option>
          {Array.from(new Set(
            partidos
              .filter(p => !filtroTorneo || p.id_torneo === Number(filtroTorneo))
              .map(p => p.fecha.slice(0, 10))
          )).sort((a, b) => b.localeCompare(a)).map(f => (
            <option key={f} value={f}>{new Date(f + "T00:00:00").toLocaleDateString()}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className={styles.msg}>Cargando partidos...</p>
      ) : !filtroTorneo ? (
        <p className={styles.msg}>Seleccioná un torneo para ver los resultados.</p>
      ) : partidosFiltrados.length === 0 ? (
        <p className={styles.msg}>No hay partidos para los filtros seleccionados.</p>
      ) : (
        <div className={styles.lista}>
          {partidosFiltrados.map(p => (
            <button key={p.id_partido} className={styles.card} onClick={() => handleVerDetalle(p)}>
              <span className={styles.cardFecha}>{new Date(p.fecha + "T00:00:00").toLocaleDateString()}</span>
              <div className={styles.cardEncuentro}>
                <span className={styles.equipo}>{p.equipo_local_nombre}</span>
                <span className={styles.marcador}>{p.goles_local} - {p.goles_visitante}</span>
                <span className={styles.equipo}>{p.equipo_visitante_nombre}</span>
              </div>
              <span className={styles.cardTorneo}>{p.nombre_torneo}</span>
            </button>
          ))}
        </div>
      )}

      {/* Modal detalle — igual al de Home */}
      {selectedPartido && (
        <div className={styles.modalOverlay} onClick={() => setSelectedPartido(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2>{selectedPartido.nombre_torneo}</h2>
                <p className={styles.subHeader}>
                  Fecha {selectedPartido.numero_fecha} | {new Date(selectedPartido.fecha + "T00:00:00").toLocaleDateString()}
                </p>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedPartido(null)}>×</button>
            </div>

            <div className={styles.mainScoreBanner}>
              <div className={styles.bigTeamName}>{selectedPartido.equipo_local_nombre}</div>
              <div className={styles.bigScore}>{selectedPartido.goles_local} - {selectedPartido.goles_visitante}</div>
              <div className={styles.bigTeamName}>{selectedPartido.equipo_visitante_nombre}</div>
            </div>

            <div className={styles.refereeRibbon}>
              <div className={styles.refereeItem}>
                <span>🏁</span>
                <span>Árbitros: <strong>{selectedPartido.arbitros || "No designados"}</strong></span>
              </div>
            </div>

            <div className={styles.detailsBody}>
              {selectedPartido.categoria_torneo === "SUB_12" ? (
                /* Vista simplificada para SUB_12: solo plantilla, sin goles ni tarjetas */
                <div className={styles.sub12Grid}>
                  <div className={styles.teamSection}>
                    <h3 className={styles.localTitle}>🏠 {selectedPartido.equipo_local_nombre}</h3>
                    <div className={styles.plantillaList}>
                      {parsePlantilla(selectedPartido.lista_jugadores_local).map((j, i) => (
                        <div key={i} className={styles.jugadorRow}>
                          <span className={styles.tshirt}>{j.rol === "JUGADOR" ? (j.camiseta || '-') : '📋'}</span>
                          <span className={j.rol !== "JUGADOR" ? styles.staffName : ""}>
                            {j.nombreCompleto}
                            {j.rol !== "JUGADOR" && <small className={styles.rolTag}> ({j.rol})</small>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.teamSection}>
                    <h3 className={styles.visitanteTitle}>🚩 {selectedPartido.equipo_visitante_nombre}</h3>
                    <div className={styles.plantillaList}>
                      {parsePlantilla(selectedPartido.lista_jugadores_visitante).map((j, i) => (
                        <div key={i} className={styles.jugadorRow}>
                          <span className={styles.tshirt}>{j.rol === "JUGADOR" ? (j.camiseta || '-') : '📋'}</span>
                          <span className={j.rol !== "JUGADOR" ? styles.staffName : ""}>
                            {j.nombreCompleto}
                            {j.rol !== "JUGADOR" && <small className={styles.rolTag}> ({j.rol})</small>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.teamSection}>
                    <h3 className={styles.localTitle}>🏠 {selectedPartido.equipo_local_nombre}</h3>
                    <div className={styles.infoGrid}>
                      <div className={styles.infoCol}>
                        <label>📋 Plantilla</label>
                        <div className={styles.plantillaList}>
                          {parsePlantilla(selectedPartido.lista_jugadores_local).map((j, i) => (
                            <div key={i} className={styles.jugadorRow}>
                              <span className={styles.tshirt}>{j.rol === "JUGADOR" ? (j.camiseta || '-') : '📋'}</span>
                              <span className={j.rol !== "JUGADOR" ? styles.staffName : ""}>
                                {j.nombreCompleto}
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
                              <span className={styles.cardWrapper}>{renderIconoTarjeta(t.tipoTarjeta)}{t.jugador}</span>
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
                              <span className={styles.tshirt}>{j.rol === "JUGADOR" ? (j.camiseta || '-') : '📋'}</span>
                              <span className={j.rol !== "JUGADOR" ? styles.staffName : ""}>
                                {j.nombreCompleto}
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
                              <span className={styles.cardWrapper}>{renderIconoTarjeta(t.tipoTarjeta)}{t.jugador}</span>
                              {t.tiempos.length > 1 && <span className={styles.incCount}>x{t.tiempos.length}</span>}
                            </div>
                            <small className={styles.incTiempos}>{t.tiempos.join("  ")}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className={styles.modalFooter}>
              <p>Ubicación: <strong>{selectedPartido.ubicacion}</strong></p>
            </div>
          </div>
        </div>
      )}

      {loadingDetalle && <div className={styles.loadingOverlay}>Cargando detalle...</div>}
    </div>
  );
}
