// pages/noticias/NoticiaDetalle.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { obtenerNoticiaPorId } from "../../../api/noticias.api"; // ✅ Usamos la API
import Button from "../../../components/ui/button/Button";
import { useSeo } from "../../../hooks/useSeo";
import styles from "./NoticiaDetalle.module.css";

/**
 * Página pública de detalle de una noticia.
 * Carga la noticia por su ID desde la URL y muestra título, imagen,
 * epígrafe y el cuerpo del texto separado en párrafos.
 */
export default function NoticiaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [noticia, setNoticia] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const cargarData = async () => {
      try {
        const data = await obtenerNoticiaPorId(id); // ✅ Llamada limpia
        if (data.url_externa) {
          window.location.replace(data.url_externa);
          return;
        }
        setNoticia(data);
      } catch (error) {
        console.error("Error cargando noticia:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarData();
  }, [id]);

  // Resumen corto para la meta description y las previsualizaciones en redes.
  const resumen: string = noticia
    ? (noticia.epigrafe || String(noticia.texto || "").replace(/\s+/g, " ").trim()).slice(0, 160)
    : "Noticias del hockey sobre pista de Bariloche y Lagos del Sur.";

  const jsonLd = useMemo(
    () =>
      noticia
        ? {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: noticia.titulo,
            description: resumen,
            image: noticia.imagen_url ? [noticia.imagen_url] : undefined,
            datePublished: noticia.creado_en,
            dateModified: noticia.actualizado_en || noticia.creado_en,
            publisher: {
              "@type": "Organization",
              name: "Asociación de Hockey Bariloche y Lagos del Sur",
              logo: {
                "@type": "ImageObject",
                url: "https://hockeybariloche.com.ar/logoAHBLS.png",
              },
            },
          }
        : null,
    [noticia, resumen]
  );

  useSeo({
    title: noticia ? noticia.titulo : "Noticia",
    description: resumen,
    image: noticia?.imagen_url || undefined,
    type: "article",
    // Sin noticia cargada (o mientras redirige a una fuente externa) no hay nada que indexar.
    noIndex: !noticia,
    jsonLd,
  });

  if (loading) return <div className={styles.loading}>Cargando...</div>;
  if (!noticia) return <div>Noticia no encontrada</div>;

  return (
    <div className={styles.container}>
      <Button variant="secondary" onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/noticias")} className={styles.backBtn}>
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