// pages/noticias/Noticias.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerNoticiasRecientes } from "../../../api/noticias.api";
import styles from "./Noticias.module.css";

export default function Noticias() {
  const [noticias, setNoticias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerNoticiasRecientes();
        setNoticias(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  if (loading) return <div className={styles.loading}>Cargando noticias...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Novedades y Prensa</h1>
        <p>Toda la actualidad del hockey en Bariloche</p>
      </header>

      <div className={styles.mainGrid}>
        {noticias.map((n) => (
          <article 
            key={n.id_noticia} 
            className={styles.newsCard}
            onClick={() => navigate(`/noticias/${n.id_noticia}`)}
          >
            <div className={styles.imageWrapper}>
              <img src={n.imagen_url || "/placeholder.jpg"} alt={n.titulo} />
              {n.epigrafe && <div className={styles.epigrafe}>{n.epigrafe}</div>}
            </div>
            <div className={styles.content}>
              <span className={styles.date}>
                {new Date(n.creado_en).toLocaleDateString()}
              </span>
              <h2>{n.titulo}</h2>
              <p>{n.texto.substring(0, 150)}...</p>
              <span className={styles.readMore}>Leer más →</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}