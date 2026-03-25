import styles from "./Home.module.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerPartidosRecientes, obtenerDetallePartido } from "../../../api/partidos.api";
import Button from "../../../components/ui/button/Button";
import PartidoDetalleModal from "../../../components/partidos/PartidoDetalleModal";

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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {partidos.map((partido) => (
                <tr key={partido.id_partido}>
                  <td data-label="Fecha">📅 {new Date(partido.fecha + "T00:00:00").toLocaleDateString()}</td>
                  <td data-label="Torneo">
                    <div className={styles.torneoCol}>
                      <div>{partido.nombre_torneo}</div>
                      <div className={styles.torneoMeta}>
                        {partido.categoria_torneo && <span className={styles.metaBadge}>{partido.categoria_torneo.replace(/_/g, ' ')}</span>}
                        {partido.division_torneo && <span className={styles.metaBadge}>{partido.division_torneo}</span>}
                        {partido.genero_torneo && <span className={styles.metaBadge}>{partido.genero_torneo === 'FEMENINO' ? '♀ Fem.' : partido.genero_torneo === 'MASCULINO' ? '♂ Masc.' : '⚥ Mixto'}</span>}
                      </div>
                    </div>
                  </td>
                  <td data-label="Encuentro">
                    <div className={styles.matchupRow}>
                      <strong>{partido.equipo_local_nombre}</strong>
                      <span className={styles.resHighlight}>{partido.goles_local} - {partido.goles_visitante}</span>
                      <strong>{partido.equipo_visitante_nombre}</strong>
                    </div>
                  </td>
                  <td>
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
        <PartidoDetalleModal partido={selectedPartido} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}