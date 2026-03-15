import styles from "./Home.module.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerPartidosRecientes, obtenerDetallePartido } from "../../../api/partidos.api";
import Button from "../../../components/ui/button/Button";
import { usePartidos } from "../../../hooks/usePartidos";

import { obtenerNoticiasRecientes } from "../../../api/noticias.api"; 
import { obtenerStatsGlobales } from "../../../api/estadisticas.api";

/**
 * Página de inicio pública.
 * Muestra estadísticas globales (partidos y goles), las últimas noticias
 * y los últimos encuentros jugados con detalle en modal al hacer clic.
 */
export default function Home() {

  const [noticias, setNoticias] = useState<any[]>([]);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [selectedPartido, setSelectedPartido] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({ partidos_totales: 0, goles_totales: 0 });
  const navigate = useNavigate();
  const { parseIncidencias } = usePartidos();


  // Carga en paralelo partidos recientes, noticias y estadísticas globales al montar el componente.
  useEffect(() => {
    const cargarTodo = async () => {
      setLoading(true);
      try {
        // Usamos Promise.all para que carguen en paralelo, es más eficiente 🚀
        const [partidosData, noticiasData, statsData] = await Promise.all([
          obtenerPartidosRecientes(),
          obtenerNoticiasRecientes(),
          obtenerStatsGlobales()
        ]);

        setPartidos(partidosData.slice(0, 5));
        setNoticias(noticiasData.slice(0, 3));
        setStats(statsData);
      } catch (error) {
        console.error("Error cargando datos del Home:", error);
      } finally {
        setLoading(false);
       
      }
    };

    cargarTodo();
  }, []);



  /**
   * Carga el detalle completo de un partido y abre el modal de visualización.
   * @param partido - Objeto de partido con al menos `id_partido`.
   */
  const handleVerDetalle = async (partido: any) => {
    try {
      setLoadingDetalle(true);
      const detalle = await obtenerDetallePartido(partido.id_partido);
      setSelectedPartido(detalle);
      setShowModal(true);
    } catch (error) {
      console.error("Error al cargar detalle:", error);
      alert("No se pudo obtener el detalle del encuentro.");
    } finally {
      setLoadingDetalle(false);
    }
  };

  /**
   * Parsea el string de plantilla de la DB y retorna un array de jugadores.
   * @param str - String con jugadores separados por "; " y campos por "|".
   * @returns Array con nombreCompleto, camiseta y rol de cada integrante.
   */
  const parsePlantilla = (str: string) => {
    if (!str) return [];
    return str.split("; ").map(item => {
      const parts = item.split("|");
      const apellido = parts[0];
      const nombre = parts[1];
      const camiseta = parts[2];
      const rol = parts[3] || "JUGADOR";


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
        <div className={styles.headerTitle}>
          <img src="/logo_icon.png" alt="Logo" className={styles.headerLogo} />
          <h1>Asociación Hockey Bariloche</h1>
        </div>
      </header>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statContent}>
            <span>Partidos Temporada</span>
            {/* Ahora este número viene del count() real de la DB */}
            <strong>{stats.partidos_totales}</strong> 
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🏑</div>
          <div className={styles.statContent}>
            <span>Goles Convertidos</span>
            <strong>{stats.goles_totales}</strong>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN DE NOTICIAS --- */}
        <section className={styles.newsSection}>
          <div className={styles.sectionHeader}>
            <h2>Novedades de la Asociación</h2>
            <Button variant="primary" onClick={() => navigate("/noticias")}>
              Ver todas →
            </Button>
          </div>

          <div className={styles.newsGrid}>
            {noticias.map((n) => (
              <article key={n.id_noticia} className={styles.newsCard}>
                <div className={styles.newsImageWrapper}>
                  <img src={n.imagen_url || "/placeholder.jpg"} alt={n.titulo} />
                  
                  {/* Pie de foto suave en el margen inferior de la imagen */}
                  {n.epigrafe && (
                    <div className={styles.epigrafeSutil}>
                      {n.epigrafe}
                    </div>
                  )}
                </div>
                
                <div className={styles.newsContent}>
                  <div className={styles.newsMeta}>
                    {/* <span className={styles.newsTag}>Institucional</span> */}
                    <span className={styles.newsDate}>
                      {new Date(n.creado_en).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  
                  <h3>{n.titulo}</h3>
                  
                  <p className={styles.newsExcerpt}>
                    {n.texto.length > 110 ? `${n.texto.substring(0, 110)}...` : n.texto}
                  </p>
                  
                  <div className={styles.newsFooter}>
                    <button className={styles.readMoreBtn} onClick={() => navigate(`/noticias/${n.id_noticia}`)}>
                      Leer noticia completa
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

      <div className={styles.tableContainer}>
        <h3>Ultimos Encuentros</h3>
        {loading ? (
          <p className={styles.loadingText}>Cargando datos...</p>
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
              {partidos.map((partido) => (
                <tr key={partido.id_partido}>
                  <td data-label="Fecha">📅 {new Date(partido.fecha + "T00:00:00").toLocaleDateString()}</td>
                  <td data-label="Torneo">{partido.nombre_torneo}</td>
                  <td data-label="Encuentro">
                    <div className={styles.matchupRow}>
                      <strong>{partido.equipo_local_nombre}</strong> 
                      <small className={styles.vsLabel}>vs</small> 
                      <strong>{partido.equipo_visitante_nombre}</strong>
                    </div>
                  </td>
                  <td data-label="Resultado">
                    <span className={styles.resHighlight}>
                      {partido.goles_local} - {partido.goles_visitante}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    <Button variant="secondary" size="sm" onClick={() => handleVerDetalle(partido)} disabled={loadingDetalle}>
                      {loadingDetalle ? "Cargando..." : "📄 Detalle"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
            </div>

            <div className={styles.detailsBody}>
              {/* Equipo Local */}
              <div className={styles.teamSection}>
                <h3 className={styles.localTitle}>🏠 {selectedPartido.equipo_local_nombre}</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoCol}>
                    <label>📋 Plantilla</label>
                    <div className={styles.plantillaList}>
                      {parsePlantilla(selectedPartido.lista_jugadores_local).map((j, i) => (
                        <div key={i} className={styles.jugadorRow}>
                          <span className={styles.tshirt}>
                            {j.rol === "JUGADOR" ? (j.camiseta || '-') : '📋'}
                          </span> 
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
                          <span>🏑 {g.jugador} {g.esAutogol && <strong className={styles.autogol}>(En contra)</strong>}</span>
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

              {/* Equipo Visitante */}
              <div className={styles.teamSection}>
                <h3 className={styles.visitanteTitle}>🚩 {selectedPartido.equipo_visitante_nombre}</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoCol}>
                    <label>📋 Plantilla</label>
                    <div className={styles.plantillaList}>
                      {parsePlantilla(selectedPartido.lista_jugadores_visitante).map((j, i) => (
                        <div key={i} className={styles.jugadorRow}>
                          <span className={styles.tshirt}>
                            {j.rol === "JUGADOR" ? (j.camiseta || '-') : '📋'}
                          </span>
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
                          <span>🏑 {g.jugador} {g.esAutogol && <strong className={styles.autogol}>(En contra)</strong>}</span>
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
            </div>
            
            <div className={styles.modalFooter}>
               <p>Ubicación: <strong>{selectedPartido.ubicacion}</strong></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}