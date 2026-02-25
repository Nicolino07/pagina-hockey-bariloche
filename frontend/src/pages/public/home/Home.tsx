import styles from "./Home.module.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerPartidosRecientes } from "../../../api/partidos.api";

export default function Home() {
  const navigate = useNavigate();
  const [partidos, setPartidos] = useState<any[]>([]);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState<any | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const noticias = [
    { id: 1, titulo: "Gran Final del Torneo Apertura", fecha: "20 Feb 2026" },
    { id: 2, titulo: "Convocatoria Selección Sub-16", fecha: "18 Feb 2026" },
  ];


  const parsePlantilla = (str: string) => {
    if (!str) return [];
    return str.split("; ").map(item => {
      const [apellido, nombre, camiseta] = item.split("|");
      return { nombreCompleto: `${apellido}, ${nombre}`, camiseta };
    });
  };

  const abrirModal = (partido: any) => {
    setPartidoSeleccionado(partido);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setPartidoSeleccionado(null);
  };

  useEffect(() => {
    cargarPartidos();
  }, []);

  const cargarPartidos = async () => {
    try {
      const data = await obtenerPartidosRecientes();
      setPartidos(data.slice(0, 4));
    } catch (error) {
      console.error("Error cargando partidos:", error);
    }
  };

 // Función de parseo corregida para Apellido | Nombre | Minuto | Cuarto
const parseIncidencias = (str: string) => {
  if (!str || str.trim() === "" || str === "0") return [];
  
  return str.split("; ").map(item => {
    const partes = item.split("|").map(p => p.trim());
    
    // Si el formato es: Apellido (0) | Nombre (1) | Minuto (2) | Cuarto (3) | Tarjeta (4)
    const tieneNombreYApellido = partes.length >= 2 && isNaN(Number(partes[1]));

    return {
      // Si partes[1] no es un número, es el nombre. Los unimos.
      jugador: tieneNombreYApellido ? `${partes[0]} ${partes[1]}` : partes[0],
      // El minuto ahora debería estar en la posición 2 si hubo nombre, o en la 1 si no.
      minuto: !isNaN(Number(partes[2])) ? partes[2] : (!isNaN(Number(partes[1])) ? partes[1] : ""),
      // El cuarto suele estar después del minuto
      cuarto: partes[3] || (isNaN(Number(partes[2])) ? partes[2] : ""), 
      extra: partes[partes.length - 1] 
    };
  });
};

  const IncidenciasEquipo = ({ goles, tarjetas }: { goles: string; tarjetas: string }) => {
    const golesList = parseIncidencias(goles);
    const tarjetasList = parseIncidencias(tarjetas);

    if (golesList.length === 0 && tarjetasList.length === 0) {
      return <div className={styles.emptyMessage}>Sin incidencias</div>;
    }

    const renderFila = (item: any, icon: string, extraClass: string = "") => {
      return (
        <div className={`${styles.incidenciaItem} ${extraClass}`}>
          <div className={styles.jugadorInfo}>
            <span className={styles.incidenciaIcon}>{icon}</span>
            <span className={styles.jugadorNombre}>{item.jugador}</span>
          </div>
          <div className={styles.tiempoInfo}>
            {item.minuto && <span className={styles.badgeMinuto}>{item.minuto}'</span>}
            {item.cuarto && (
              <span className={styles.badgeCuarto}>{item.cuarto}C</span>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className={styles.incidenciasList}>
        {golesList.map((g, i) => renderFila(g, "⚽", `gol-${i}`))}
        {tarjetasList.map((t, i) => {
          const colorClass = 
            t.extra === 'VERDE' ? styles.verde :
            t.extra === 'AMARILLA' ? styles.amarilla :
            t.extra === 'ROJA' ? styles.roja : "";
          const emoji = t.extra === 'VERDE' ? '🟢' : t.extra === 'AMARILLA' ? '🟡' : '🔴';
          return renderFila(t, emoji, `${styles.tarjeta} ${colorClass}`);
        })}
      </div>
    );
  };

  return (
    <div className={styles.home}>
      <header className={styles.hero}>
        <div className={styles.overlay}>
          <h1>Asociación de Hockey Bariloche y Lagos del Sur</h1>
          <p>Pasión por el hockey en la Patagonia</p>
          <button className={styles.btnPrimary}>Ver Fixture</button>
        </div>
      </header>

      <section className={styles.newsSection}>
        <h2>Últimas Noticias</h2>
        <div className={styles.newsGrid}>
          {noticias.map((item) => (
            <article key={item.id} className={styles.card}>
              <div className={styles.imagePlaceholder}></div>
              <h3>{item.titulo}</h3>
              <span>{item.fecha}</span>
              <p>Breve descripción de lo que está pasando...</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.lastMatches}>
        <h2>Últimos Resultados</h2>
        <div className={styles.tableContainer}>
          <table className={styles.matchesTable}>
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
              {partidos.map((p) => (
                <tr key={p.id_partido} onClick={() => abrirModal(p)} style={{ cursor: 'pointer' }}>
                  <td data-label="Fecha">📅 {new Date(p.fecha).toLocaleDateString()}</td>
                  <td data-label="Torneo">{p.nombre_torneo}</td>
                  <td data-label="Encuentro">
                    <div className={styles.matchupRow}>
                      <strong className={p.goles_local > p.goles_visitante ? styles.winner : ""}>{p.equipo_local_nombre}</strong>
                      <small className={styles.vsLabel}>vs</small>
                      <strong className={p.goles_visitante > p.goles_local ? styles.winner : ""}>{p.equipo_visitante_nombre}</strong>
                    </div>
                  </td>
                  <td data-label="Resultado">
                    <span className={styles.resHighlight}>{p.goles_local} - {p.goles_visitante}</span>
                  </td>
                  <td data-label="Acciones">
                    <button className={styles.detailBtn} onClick={(e) => { e.stopPropagation(); abrirModal(p); }}>📄 Detalle</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modalAbierto && partidoSeleccionado && (
        <div className={styles.modalOverlay} onClick={cerrarModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2>{partidoSeleccionado.nombre_torneo}</h2>
                <p className={styles.subHeader}>Fecha {partidoSeleccionado.numero_fecha} | {new Date(partidoSeleccionado.fecha).toLocaleDateString()}</p>
              </div>
              <button className={styles.closeBtn} onClick={cerrarModal}>×</button>
            </div>

            <div className={styles.mainScoreBanner}>
              <div className={styles.bigTeamName}>{partidoSeleccionado.equipo_local_nombre}</div>
              <div className={styles.bigScore}>{partidoSeleccionado.goles_local} - {partidoSeleccionado.goles_visitante}</div>
              <div className={styles.bigTeamName}>{partidoSeleccionado.equipo_visitante_nombre}</div>
            </div>

            <div className={styles.detailsBody}>
              <div className={styles.teamSection}>
                <h3 className={styles.localTitle}>🏠 {partidoSeleccionado.equipo_local_nombre}</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoCol}>
                    <label>📋 Plantilla</label>
                    <div className={styles.plantillaList}>
                      {parsePlantilla(partidoSeleccionado.lista_jugadores_local).map((j, i) => (
                        <div key={i} className={styles.jugadorRow}>
                          <span className={styles.tshirt}>{j.camiseta || '-'}</span>
                          <span>{j.nombreCompleto}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.infoCol}>
                    <label>⚽ Goles / 🎴 Sanciones</label>
                    <IncidenciasEquipo goles={partidoSeleccionado.lista_goles_local} tarjetas={partidoSeleccionado.lista_tarjetas_local} />
                  </div>
                </div>
              </div>

              <hr className={styles.divider} />

              <div className={styles.teamSection}>
                <h3 className={styles.visitanteTitle}>🚩 {partidoSeleccionado.equipo_visitante_nombre}</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoCol}>
                    <label>📋 Plantilla</label>
                    <div className={styles.plantillaList}>
                      {parsePlantilla(partidoSeleccionado.lista_jugadores_visitante).map((j, i) => (
                        <div key={i} className={styles.jugadorRow}>
                          <span className={styles.tshirt}>{j.camiseta || '-'}</span>
                          <span>{j.nombreCompleto}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.infoCol}>
                    <label>⚽ Goles / 🎴 Sanciones</label>
                    <IncidenciasEquipo goles={partidoSeleccionado.lista_goles_visitante} tarjetas={partidoSeleccionado.lista_tarjetas_visitante} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}