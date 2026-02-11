import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PartidosPage.module.css";
import Button from "../../../components/ui/button/Button";
import { listarPartidos } from "../../../api/partidos.api";

export default function PartidosPage() {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    cargarPartidos();
  }, []);

  const cargarPartidos = async () => {
    try {
      const data = await listarPartidos();
      setPartidos(data);
    } catch (err) {
      console.error("Error al cargar partidos", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Gestión de Partidos</h1>
          <p>Administra los encuentros y carga los resultados oficiales.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => navigate("/admin/partidos/nueva-planilla")}
          className={styles.btnNueva}
        >
          + Cargar Planilla
        </Button>
      </header>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span>Partidos Registrados</span>
          <strong>{partidos.length}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Pendientes</span>
          <strong>{partidos.filter((p: any) => p.estado === 'BORRADOR').length}</strong>
        </div>
      </section>

      <div className={styles.tableContainer}>
        <h3>Últimos Encuentros</h3>
        {loading ? (
          <p>Cargando partidos...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Torneo</th>
                <th>Encuentro</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {partidos.map((partido: any) => (
                <tr key={partido.id_partido}>
                  <td>
                    <div className={styles.dateCell}>
                      📅 {new Date(partido.fecha).toLocaleDateString()}
                    </div>
                  </td>
                  <td>{partido.torneo_nombre || "N/A"}</td>
                  <td>
                    <div className={styles.matchup}>
                      <span>{partido.equipo_local}</span>
                      <small>vs</small>
                      <span>{partido.equipo_visitante}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[partido.estado?.toLowerCase() || '']}`}>
                      {partido.estado || 'PENDIENTE'}
                    </span>
                  </td>
                  <td>
                    <Button 
                      variant="secondary" 
          
                      onClick={() => navigate(`/admin/partidos/${partido.id_partido}`)}
                    >
                      📄 Ver
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}