// frontend/src/pages/admin/torneos/TorneosAdmin.tsx
import { useTorneosActivos } from "../../../hooks/useTorneosActivos"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import Button from "../../../components/ui/button/Button"
import CrearTorneoForm from "./CrearTorneoForm"
import {
  eliminarTorneo,
  finalizarTorneo
} from "../../../api/torneos.api"

import styles from "./TorneosAdmin.module.css"

export default function TorneosAdmin() {
  const { torneos, loading, error, refetch } = useTorneosActivos()
  const navigate = useNavigate()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [procesandoId, setProcesandoId] = useState<number | null>(null)

  if (loading) return <p>Cargando torneos…</p>
  if (error) return <p>{error}</p>

  const handleEliminar = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("¿Eliminar torneo? Se ocultará pero no se borrará definitivamente.")) {
      return
    }

    try {
      setProcesandoId(id)
      await eliminarTorneo(id)
      await refetch()
    } finally {
      setProcesandoId(null)
    }
  }

  const handleFinalizar = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("¿Finalizar torneo? No podrá modificarse luego.")) {
      return
    }

    try {
      setProcesandoId(id)
      await finalizarTorneo(id)
      await refetch()
    } finally {
      setProcesandoId(null)
    }
  }

  return (
    <section className={styles.section}>
      <header className={styles.header}>

        <h2 className={styles.title}>Torneos activos</h2>

        <div className={styles.botones}>
          <Button onClick={() => setMostrarForm(true)}>
            ➕ Crear torneo
          </Button>
          <Button onClick={() => navigate("/admin")}>← Volver</Button>
        </div>

      </header>

      {mostrarForm && (
        <CrearTorneoForm
          onCancel={() => setMostrarForm(false)}
          onSuccess={() => setMostrarForm(false)}
        />
      )}

      {torneos.length === 0 ? (
        <p>No hay torneos activos</p>
      ) : (
        <ul className={styles.list}>
          {torneos.map(t => (
            <li
              key={t.id_torneo}
              className={styles.item}
              onClick={() => navigate(`/admin/torneos/${t.id_torneo}`)}
            >
              <div className={styles.nombre}>{t.nombre}</div>
              <div className={styles.meta}>
                {t.categoria} – {t.genero}
              </div>

              <div className={styles.actions}>
                <Button
                  variant="secondary"
                  disabled={procesandoId === t.id_torneo}
                  onClick={(e) => handleFinalizar(t.id_torneo, e)}
                >
                  🏁 Finalizar
                </Button>

                <Button
                  variant="danger"
                  disabled={procesandoId === t.id_torneo}
                  onClick={(e) => handleEliminar(t.id_torneo, e)}
                >
                  🗑 Eliminar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
