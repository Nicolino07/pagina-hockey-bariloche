import { useState, useEffect } from "react";
import { obtenerNoticiasRecientes, crearNoticia, eliminarNoticia, previewUrlExterna } from "../../../api/noticias.api";
import Button from "../../../components/ui/button/Button";
import styles from "./NoticiasForm.module.css";

export default function Noticias() {
  const [noticias, setNoticias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    imagen_url: "",
    epigrafe: "",
    texto: "",
    url_externa: "",
    creado_por: "Admin Local"
  });

  // Estado para el modo "nota externa"
  const [urlPreview, setUrlPreview] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [errorPreview, setErrorPreview] = useState<string | null>(null);
  const [modoExterno, setModoExterno] = useState(false);

  useEffect(() => {
    fetchNoticias();
  }, []);

  const fetchNoticias = async () => {
    const data = await obtenerNoticiasRecientes(10);
    setNoticias(data);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCargarPreview = async () => {
    if (!urlPreview.trim()) return;
    setLoadingPreview(true);
    setErrorPreview(null);
    try {
      const data = await previewUrlExterna(urlPreview.trim());
      setForm(f => ({
        ...f,
        titulo: data.titulo || f.titulo,
        imagen_url: data.imagen_url || f.imagen_url,
        texto: data.descripcion || f.texto,
        url_externa: urlPreview.trim(),
      }));
    } catch {
      setErrorPreview("No se pudo obtener la vista previa. Podés ingresar la imagen manualmente.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await crearNoticia({
        ...form,
        url_externa: form.url_externa || null,
      });
      setForm({ titulo: "", imagen_url: "", epigrafe: "", texto: "", url_externa: "", creado_por: "Admin Local" });
      setUrlPreview("");
      setModoExterno(false);
      fetchNoticias();
      alert("Noticia publicada correctamente");
    } catch (error) {
      alert("Error al publicar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar esta noticia?")) {
      await eliminarNoticia(id);
      fetchNoticias();
    }
  };

  return (
    <div className={styles.adminWrapper}>
      <section className={styles.formSection}>
        <h2>🗞️ Nueva Noticia</h2>

        {/* Toggle modo externo */}
        <div className={styles.modoToggle}>
          <button
            type="button"
            className={`${styles.modoBtn} ${!modoExterno ? styles.modoBtnActivo : ""}`}
            onClick={() => setModoExterno(false)}
          >
            Noticia propia
          </button>
          <button
            type="button"
            className={`${styles.modoBtn} ${modoExterno ? styles.modoBtnActivo : ""}`}
            onClick={() => setModoExterno(true)}
          >
            Compartir nota externa
          </button>
        </div>

        {/* Sección de carga desde URL externa */}
        {modoExterno && (
          <div className={styles.urlExternaBox}>
            <label className={styles.urlExternaLabel}>URL de la nota</label>
            <div className={styles.urlExternaRow}>
              <input
                className={styles.urlExternaInput}
                type="url"
                value={urlPreview}
                onChange={e => setUrlPreview(e.target.value)}
                placeholder="https://www.diario.com/nota-hockey..."
              />
              <Button type="button" onClick={handleCargarPreview} disabled={loadingPreview || !urlPreview.trim()}>
                {loadingPreview ? "Cargando..." : "Cargar vista previa"}
              </Button>
            </div>
            {errorPreview && <p className={styles.urlExternaError}>{errorPreview}</p>}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.newsForm}>
          <div className={styles.inputGroup}>
            <label>Título</label>
            <input name="titulo" value={form.titulo} onChange={handleInput} required placeholder="Ej: Torneo relámpago en el Nahuel Huapi" />
          </div>

          <div className={styles.inputGroup}>
            <label>URL de Imagen</label>
            <input name="imagen_url" value={form.imagen_url} onChange={handleInput} placeholder="https://ejemplo.com/foto.jpg" />
          </div>

          <div className={styles.inputGroup}>
            <label>Epígrafe (Pie de foto)</label>
            <input name="epigrafe" value={form.epigrafe} onChange={handleInput} placeholder="Ej: Equipo local festejando" />
          </div>

          <div className={styles.inputGroup}>
            <label>{modoExterno ? "Descripción / Copete" : "Contenido de la Noticia"}</label>
            <textarea name="texto" value={form.texto} onChange={handleInput} required rows={5} placeholder="Escribe aquí los detalles..." />
          </div>

          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Publicar Noticia"}
          </Button>
        </form>
      </section>

      <section className={styles.previewSection}>
        <h2>👁️ Vista Previa</h2>
        <div className={styles.previewCard}>
          {form.imagen_url && <img src={form.imagen_url} alt="Preview" />}
          <div className={styles.previewContent}>
            {form.url_externa && (
              <span className={styles.previewBadge}>Nota de prensa</span>
            )}
            <h3>{form.titulo || "Título de la noticia"}</h3>
            <p>{form.texto || "Aquí se verá el contenido..."}</p>
            {form.epigrafe && <small className={styles.previewEpigrafe}>{form.epigrafe}</small>}
            {form.url_externa && (
              <a href={form.url_externa} target="_blank" rel="noopener noreferrer" className={styles.previewLinkExterno}>
                Ver nota original →
              </a>
            )}
          </div>
        </div>
      </section>

      <section className={styles.listSection}>
        <h2>Gestión de Noticias</h2>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>Título</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {noticias.map((n) => (
              <tr key={n.id_noticia}>
                <td>
                  {n.url_externa && <span className={styles.badgeExterno}>Prensa</span>}
                  {n.titulo}
                </td>
                <td>{new Date(n.creado_en).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleDelete(n.id_noticia)} className={styles.deleteBtn}>🗑️ Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
