// pages/noticias/NoticiaDetalle.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/axiosAdmin"; // O tu api de noticias
import Button from "../../../components/ui/button/Button";
import styles from "./NoticiaDetalle.module.css";

export default function NoticiaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [noticia, setNoticia] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarNoticia = async () => {
      try {
        // Asumiendo que tenés un endpoint por ID
        const res = await api.get(`/noticias/${id}/`);
        setNoticia(res.data);
      } catch (error) {
        console.error("Error cargando noticia:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarNoticia();
  }, [id]);

  if (loading) return <div className={styles.loading}>Cargando...</div>;
  if (!noticia) return <div>Noticia no encontrada</div>;

  return (
    <div className={styles.container}>
      <Button variant="secondary" onClick={() => navigate(-1)} className={styles.backBtn}>
        ← Volver
      </Button>

      <article className={styles.article}>
        <header className={styles.header}>
          <span className={styles.date}>
            Publicado el {new Date(noticia.creado_en).toLocaleDateString()}
          </span>
          <h1>{noticia.titulo}</h1>
        </header>

        <figure className={styles.mainImage}>
          <img src={noticia.imagen_url || "/placeholder.jpg"} alt={noticia.titulo} />
          {noticia.epigrafe && <figcaption>{noticia.epigrafe}</figcaption>}
        </figure>

        <div className={styles.content}>
          {/* El texto de la noticia separado por párrafos */}
          {noticia.texto.split('\n').map((parrafo: string, i: number) => (
            <p key={i}>{parrafo}</p>
          ))}
        </div>
      </article>
    </div>
  );
}