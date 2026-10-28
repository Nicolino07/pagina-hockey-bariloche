import { usePartidos } from "../../hooks/usePartidos";
import { etiquetaMotivoPuntos } from "../../constants/enums";
import styles from "./PartidoDetalleModal.module.css";

interface Props {
  partido: any;
  onClose: () => void;
}

/**
 * Modal de detalle de partido reutilizable.
 * Muestra plantilla, goles y sanciones de ambos equipos.
 * Para categoría SUB_12 solo muestra plantillas (sin goles/tarjetas).
 */
export default function PartidoDetalleModal({ partido, onClose }: Props) {
  const { parseIncidencias } = usePartidos();

  const parsePlantilla = (str: string) => {
    if (!str) return [];
    return str.split("; ").map(item => {
      const parts = item.split("|");
      return {
        nombreCompleto: `${parts[0]}, ${parts[1]}`,
        camiseta: (parts[2] === "" || parts[2] === "null") ? null : parts[2],
        rol: parts[3] || "JUGADOR",
        capitan: parts[4] === "true",
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

  /**
   * Parsea la lista de penales de la tanda: "Apellido|Nombre|convertido".
   * Va aparte de goles y tarjetas a propósito: un penal de la tanda no es un
   * gol y no aparece mezclado con ellos.
   */
  const parsePenales = (str?: string | null) => {
    if (!str) return [];
    return str.split("; ").map(item => {
      const parts = item.split("|");
      return {
        jugador: `${parts[0]}, ${parts[1]}`,
        convertido: parts[2] === "true",
      };
    });
  };

  const renderIconoTarjeta = (tipo?: string) => {
    switch (tipo) {
      case "VERDE":    return <span className={`${styles.cardIcon} ${styles.verde}`} />;
      case "AMARILLA": return <span className={`${styles.cardIcon} ${styles.amarilla}`} />;
      case "ROJA":     return <span className={`${styles.cardIcon} ${styles.roja}`} />;
      default: return null;
    }
  };

  const esSub12 = partido.categoria_torneo === "SUB_12";

  // Entrega de puntos: se muestra el motivo, nunca la descripción (interna).
  const motivoPuntos = etiquetaMotivoPuntos(
    partido.motivo_puntos,
    partido.equipo_local_nombre,
    partido.equipo_visitante_nombre,
  );

  const hubopenales = Boolean(partido.hubo_definicion_por_penales);
  const penalesLocal = parsePenales(partido.lista_penales_local);
  const penalesVisitante = parsePenales(partido.lista_penales_visitante);

  const equipos = [
    {
      titulo: `🏠 ${partido.equipo_local_nombre}`,
      jugadores: partido.lista_jugadores_local,
      goles: partido.lista_goles_local,
      tarjetas: partido.lista_tarjetas_local,
    },
    {
      titulo: `🚩 ${partido.equipo_visitante_nombre}`,
      jugadores: partido.lista_jugadores_visitante,
      goles: partido.lista_goles_visitante,
      tarjetas: partido.lista_tarjetas_visitante,
    },
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h2>{partido.nombre_torneo}</h2>
            <p className={styles.subHeader}>
              Fecha {partido.numero_fecha} | {new Date(partido.fecha + "T00:00:00").toLocaleDateString()}
            </p>
            <div className={styles.torneoMeta}>
              {partido.categoria_torneo && (
                <span className={styles.metaBadge}>{partido.categoria_torneo.replace(/_/g, " ")}</span>
              )}
              {partido.division_torneo && (
                <span className={styles.metaBadge}>{partido.division_torneo}</span>
              )}
              {partido.genero_torneo && (
                <span className={styles.metaBadge}>
                  {partido.genero_torneo === "FEMENINO" ? "♀ Fem." : partido.genero_torneo === "MASCULINO" ? "♂ Masc." : "⚥ Mixto"}
                </span>
              )}
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* Score banner */}
        <div className={styles.mainScoreBanner}>
          <div className={styles.bigTeamName}>{partido.equipo_local_nombre}</div>
          <div className={styles.scoreCol}>
            <div className={styles.bigScore}>{partido.goles_local} - {partido.goles_visitante}</div>
            {hubopenales && (
              <div className={styles.penalesScore}>
                ({partido.penales_local}-{partido.penales_visitante} pen.)
              </div>
            )}
          </div>
          <div className={styles.bigTeamName}>{partido.equipo_visitante_nombre}</div>
        </div>

        {/* Árbitros */}
        <div className={styles.refereeRibbon}>
          <div className={styles.refereeItem}>
            <span className={styles.icon}>🏁</span>
            <span>Árbitros: <strong>{partido.arbitros || "No designados"}</strong></span>
          </div>
        </div>

        {/* Entrega de puntos: explica por qué el marcador no tiene goleadores. */}
        {motivoPuntos && (
          <div className={styles.walkoverRibbon}>
            <span className={styles.walkoverIcon}>⚠️</span>
            <span>
              {motivoPuntos}
              {partido.sin_puntos && (
                <small className={styles.walkoverExtra}>
                  No se otorgaron puntos a ninguno de los dos equipos.
                </small>
              )}
            </span>
          </div>
        )}

        {/* Cuerpo */}
        <div className={styles.detailsBody}>
          {esSub12 ? (
            <div className={styles.sub12Grid}>
              {equipos.map(({ titulo, jugadores }) => (
                <div key={titulo} className={styles.teamSection}>
                  <h3>{titulo}</h3>
                  <div className={styles.plantillaList}>
                    {parsePlantilla(jugadores).map((j, i) => (
                      <div key={i} className={styles.jugadorRow}>
                        <span className={styles.tshirt}>{j.rol === "JUGADOR" ? (j.camiseta || "-") : "📋"}</span>
                        <span className={j.rol !== "JUGADOR" ? styles.staffName : ""}>
                          {j.nombreCompleto}
                          {j.capitan && <small className={styles.capitanTag}> (C)</small>}
                          {j.rol !== "JUGADOR" && <small className={styles.rolTag}> ({j.rol})</small>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            equipos.map(({ titulo, jugadores, goles, tarjetas }, idx) => (
              <div key={idx}>
                {idx > 0 && <hr className={styles.divider} />}
                <div className={styles.teamSection}>
                  <h3 className={idx === 0 ? styles.localTitle : styles.visitanteTitle}>{titulo}</h3>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoCol}>
                      <label>📋 Plantilla</label>
                      <div className={styles.plantillaList}>
                        {parsePlantilla(jugadores).map((j, i) => (
                          <div key={i} className={styles.jugadorRow}>
                            <span className={styles.tshirt}>{j.rol === "JUGADOR" ? (j.camiseta || "-") : "📋"}</span>
                            <span className={j.rol !== "JUGADOR" ? styles.staffName : ""}>
                              {j.nombreCompleto}
                              {j.capitan && <small className={styles.capitanTag}> (C)</small>}
                              {j.rol !== "JUGADOR" && <small className={styles.rolTag}> ({j.rol})</small>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={styles.infoCol}>
                      <label>🏑 Goles / 🎴 Sanciones</label>
                      {agruparGoles(goles).map((g, i) => (
                        <div key={i} className={styles.incidenciaItem}>
                          <div className={styles.incRow}>
                            <span>🏑 {g.jugador} {g.esAutogol && <strong className={styles.autogol}>(En contra)</strong>}</span>
                            {g.tiempos.length > 1 && <span className={styles.incCount}>x{g.tiempos.length}</span>}
                          </div>
                          <small className={styles.incTiempos}>{g.tiempos.join("  ")}</small>
                        </div>
                      ))}
                      {agruparTarjetas(tarjetas).map((t, i) => (
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
              </div>
            ))
          )}
        </div>

        {/* Definición por penales: sección propia, separada de goles y tarjetas.
            No suma al marcador ni al ranking de goleadores. */}
        {hubopenales && !esSub12 && (
          <div className={styles.penalesSection}>
            <h3 className={styles.penalesTitulo}>
              🥅 Definición por penales
              <span className={styles.penalesResultado}>
                {partido.penales_local} - {partido.penales_visitante}
              </span>
            </h3>
            <p className={styles.penalesNota}>
              No cuenta para el marcador ni para el ranking de goleadores.
            </p>
            <div className={styles.penalesGrid}>
              {[
                { equipo: partido.equipo_local_nombre, lista: penalesLocal },
                { equipo: partido.equipo_visitante_nombre, lista: penalesVisitante },
              ].map(({ equipo, lista }, idx) => (
                <div key={idx} className={styles.penalesCol}>
                  <label>{equipo}</label>
                  {lista.length === 0 ? (
                    <span className={styles.penalesVacio}>Sin ejecutantes</span>
                  ) : (
                    lista.map((pen, i) => (
                      <div key={i} className={styles.penalRow}>
                        <span className={pen.convertido ? styles.penalOk : styles.penalFail}>
                          {pen.convertido ? "✓" : "✗"}
                        </span>
                        <span>{pen.jugador}</span>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={styles.modalFooter}>
          <p>Ubicación: <strong>{partido.ubicacion || "—"}</strong></p>
        </div>

      </div>
    </div>
  );
}
