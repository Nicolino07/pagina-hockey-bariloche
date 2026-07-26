// frontend/src/pages/admin/torneos/TorneosAdmin.tsx
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useCallback } from "react"
import Button from "../../../components/ui/button/Button"
import CrearTorneoForm from "./CrearTorneoForm"
import { listarTorneos } from "../../../api/torneos.api"
import type { Torneo } from "../../../types/torneo"

import styles from "./TorneosAdmin.module.css"

/**
 * Página administrativa de gestión de torneos.
 * Permite alternar entre torneos activos y finalizados,
 * crear nuevos torneos, y finalizar, reabrir o eliminar los existentes.
 */
export default function TorneosAdmin() {
  const navigate = useNavigate()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [verFinalizados, setVerFinalizados] = useState(false)
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [loading, setLoading] = useState(true)

  const cargarTorneos = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listarTorneos(!verFinalizados)
      // Si vemos finalizados, filtrar solo los inactivos
      setTorneos(verFinalizados ? data.filter(t => !t.activo) : data)
    } finally {
      setLoading(false)
    }
  }, [verFinalizados])

  useEffect(() => { cargarTorneos() }, [cargarTorneos])

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          {verFinalizados ? "Torneos finalizados" : "Torneos activos"}
        </h2>
        <div className={styles.botones}>
          {!verFinalizados && (
            <Button onClick={() => setMostrarForm(true)}>➕ Crear torneo</Button>
          )}
          <Button
            variant="secondary"
            onClick={() => { setVerFinalizados(v => !v); setMostrarForm(false) }}
          >
            {verFinalizados ? "Ver activos" : "Ver finalizados"}
          </Button>
          <Button onClick={() => navigate("/admin")}>← Volver</Button>
        </div>
      </header>

      {mostrarForm && (
        <CrearTorneoForm
          onCancel={() => setMostrarForm(false)}
          onSuccess={() => { setMostrarForm(false); cargarTorneos() }}
        />
      )}

      {loading ? (
        <p>Cargando torneos…</p>
      ) : torneos.length === 0 ? (
        <p>{verFinalizados ? "No hay torneos finalizados." : "No hay torneos activos."}</p>
      ) : (
        <ul className={styles.list}>
          {torneos.map(t => (
            <li
              key={t.id_torneo}
              className={`${styles.item} ${verFinalizados ? styles.itemFinalizado : ""}`}
              onClick={() => navigate(`/admin/torneos/${t.id_torneo}`)}
            >
              <div>
                <div className={styles.nombre}>{t.nombre}</div>
                <div className={styles.meta}>
                  <span className={styles.tagCategoria}>{t.categoria.replace(/_/g, " ")}</span>
                  {t.division && <span className={styles.tagDivision}>{t.division}</span>}
                  <span className={styles.tagGenero}>{t.genero}</span>
                </div>
                {verFinalizados && t.fecha_fin && (
                  <div className={styles.fechaFin}>Finalizado: {t.fecha_fin}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
