import styles from "./Home.module.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerPartidosRecientes } from "../../../api/partidos.api";
import Button from "../../../components/ui/button/Button";
import { usePartidos } from "../../../hooks/usePartidos";

import { obtenerNoticiasRecientes } from "../../../api/noticias.api"; 

export default function Home() {

  const [noticias, setNoticias] = useState<any[]>([]);
  const [loadingNoticias, setLoadingNoticias] = useState(true);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartido, setSelectedPartido] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  
  const navigate = useNavigate();
  const { parseIncidencias } = usePartidos();

  useEffect(() => {
    cargarPartidos();
    cargarNoticias();
  }, []);

  const cargarNoticias = async () => {
    try {
      const data = await obtenerNoticiasRecientes();
      setNoticias(data.slice(0, 3)); // Solo mostramos las 3 más nuevas en el Home
    } catch (error) {
      console.error("Error cargando noticias:", error);
    } finally {
      setLoadingNoticias(false);
    }
  };

  const cargarPartidos = async () => {
    try {
      const data = await obtenerPartidosRecientes(); 
      // Tomamos solo los primeros 5 elementos del array
      setPartidos(data.slice(0, 5)); 
    } catch (err) {
      console.error("Error al cargar partidos", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (partido: any) => {
    setSelectedPartido(partido);
    setShowModal(true);
  };

  const parsePlantilla = (str: string) => {
    if (!str) return [];
    return str.split("; ").map(item => {
      const [apellido, nombre, camiseta] = item.split("|");
      return { nombreCompleto: `${apellido}, ${nombre}`, camiseta };
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Hockey Bariloche</h1>
        </div>
      </header>

      <section className={styles.stats}>
        {/* Widget: Contador */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statContent}>
            <span>Partidos Temporada</span>
            <strong>{partidos.length}</strong>
          </div>
        </div>

        {/* Widget: Último Resultado (Estilo Marcador) */}
        <div className={`${styles.statCard} ${styles.lastResultWidget}`}>
          <span>Último Resultado</span>
          {partidos[0] ? (
            <div className={styles.miniScoreboard}>
              <span className={styles.miniTeam}>{partidos[0].equipo_local_nombre}</span>
              <div className={styles.miniResult}>
                {partidos[0].goles_local} - {partidos[0].goles_visitante}
              </div>
              <span className={styles.miniTeam}>{partidos[0].equipo_visitante_nombre}</span>
            </div>
          ) : (
            <strong>---</strong>
          )}
        </div>
      </section>

      {/* --- SECCIÓN DE NOTICIAS --- */}
          <section className={styles.newsSection}>
            <div className={styles.sectionHeader}>
              <h2>Novedades de la Asociación</h2>
            </div>

            <div className={styles.newsGrid}>
              {noticias.map((n) => (
                <article key={n.id_noticia} className={styles.newsCard}>
                  <div className={styles.newsImageWrapper}>
                    <img src={n.imagen_url || "/placeholder.jpg"} alt={n.titulo} />
                    {n.epigrafe && <span className={styles.epigrafe}>{n.epigrafe}</span>}
                  </div>
                  <div className={styles.newsContent}>
                    {/* Ajustamos a 'creado_en' que viene del Backend */}
                    <span className={styles.newsDate}>
                      {new Date(n.creado_en).toLocaleDateString()}
                    </span>
                    <h3>{n.titulo}</h3>
                    <p>{n.texto}</p>
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
                  <td data-label="Fecha">📅 {new Date(partido.fecha).toLocaleDateString()}</td>
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
                    <Button variant="secondary" size="sm" onClick={() => handleVerDetalle(partido)}>
                      📄 Detalle
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
                  Fecha {selectedPartido.numero_fecha} | {new Date(selectedPartido.fecha).toLocaleDateString()}
                </p>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className={styles.mainScoreBanner}>
              <div className={styles.bigTeamName}>{selectedPartido.equipo_local_nombre}</div>
              <div className={styles.bigScore}>{selectedPartido.goles_local} - {selectedPartido.goles_visitante}</div>
              <div className={styles.bigTeamName}>{selectedPartido.equipo_visitante_nombre}</div>
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
                          <span className={styles.tshirt}>{j.camiseta || '-'}</span> {j.nombreCompleto}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.infoCol}>
                    <label>⚽ Goles / 🎴 Sanciones</label>
                    {parseIncidencias(selectedPartido.lista_goles_local).map((g, i) => (
                      <div key={i} className={styles.incidenciaItem}>
                        <span>⚽ {g.jugador}</span> <small>{g.minuto}' ({g.cuarto}C)</small>
                      </div>
                    ))}
                    {parseIncidencias(selectedPartido.lista_tarjetas_local).map((t, i) => (
                      <div key={i} className={`${styles.incidenciaItem} ${styles[t.extra.toLowerCase() || 'amarilla']}`}>
                        <span>🎴 {t.jugador}</span> <small>{t.minuto}' ({t.cuarto}C)</small>
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
                          <span className={styles.tshirt}>{j.camiseta || '-'}</span> {j.nombreCompleto}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.infoCol}>
                    <label>⚽ Goles / 🎴 Sanciones</label>
                    {parseIncidencias(selectedPartido.lista_goles_visitante).map((g, i) => (
                      <div key={i} className={styles.incidenciaItem}>
                        <span>⚽ {g.jugador}</span> <small>{g.minuto}' ({g.cuarto}C)</small>
                      </div>
                    ))}
                    {parseIncidencias(selectedPartido.lista_tarjetas_visitante).map((t, i) => (
                      <div key={i} className={`${styles.incidenciaItem} ${styles[t.extra.toLowerCase() || 'amarilla']}`}>
                        <span>🎴 {t.jugador}</span> <small>{t.minuto}' ({t.cuarto}C)</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
               <p>Ubicación: <strong>{selectedPartido.ubicacion || 'No especificada'}</strong></p>
               <p className={styles.audit}>Cargado por: {selectedPartido.creado_por || 'Sistema'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}