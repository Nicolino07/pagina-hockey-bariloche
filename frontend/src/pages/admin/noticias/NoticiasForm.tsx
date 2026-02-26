import { useState, useEffect } from "react";
import { obtenerNoticiasRecientes, crearNoticia, eliminarNoticia } from "../../../api/noticias.api";
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
    creado_por: "Admin Local" // Esto idealmente vendría de tu contexto de Auth
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await crearNoticia(form);
      setForm({ titulo: "", imagen_url: "", epigrafe: "", texto: "", creado_por: "Admin Local" });
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
            <label>Contenido de la Noticia</label>
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
            <h3>{form.titulo || "Título de la noticia"}</h3>
            <p>{form.texto || "Aquí se verá el contenido..."}</p>
            {form.epigrafe && <small className={styles.previewEpigrafe}>{form.epigrafe}</small>}
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
                <td>{n.titulo}</td>
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