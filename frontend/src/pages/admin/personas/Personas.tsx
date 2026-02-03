import { Link } from "react-router-dom"
import { useState } from "react"
import styles from "./Personas.module.css"
import { getPersonas } from "../../../api/personas.api"
import type { Persona } from "../../../types/persona"
import style from "./Personas.module.css"

export default function Personas() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [buscado, setBuscado] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleBuscar() {
    setLoading(true)
    setBuscado(true)

    try {
      const data = await getPersonas()
      setPersonas(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* ================= HEADER ================= */}
      <header className={styles.header}>
        <h1>Personas</h1>

        <Link to="/admin/personas/nueva" className={styles.primaryButton}>
          + Nueva persona
        </Link>
      </header>

      {/* ================= OPCIONES ================= */}
      <section className={styles.actions}>
        <button
          onClick={handleBuscar}
          className={styles.secondaryButton}
          disabled={loading}
        >
          {loading ? "Buscando..." : "Ver personas"}
        </button>
      </section>

      {/* ================= CONTENIDO ================= */}
      <section className={styles.content}>
        {!buscado && (
          <p className={styles.emptyState}>
            Usá las opciones para buscar o crear personas.
          </p>
        )}

        {buscado && !loading && personas.length === 0 && (
          <p className={styles.emptyState}>
            No se encontraron personas.
          </p>
        )}

        {buscado && personas.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>DNI</th>
                <th>Email</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {personas.map((p) => (
                <tr key={p.id_persona}>
                  <td>
                    <Link
                      to={`/admin/personas/${p.id_persona}`}
                      className={styles.nameLink}
                      title="Ver detalle"
                    >
                      {p.nombre} {p.apellido}
                    </Link>
                  </td>
                  <td>{p.documento ?? "-"}</td>
                  <td>{p.email ?? "-"}</td>
                  <td>
                    <Link
                      to={`/admin/personas/${p.id_persona}/editar`}
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
