// frontend/src/pages/admin/torneos/TorneosAdmin.tsx
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useCallback } from "react"
import Button from "../../../components/ui/button/Button"
import CrearTorneoForm from "./CrearTorneoForm"
import {
  listarTorneos,
  eliminarTorneo,
  finalizarTorneo,
  reabrirTorneo,
} from "../../../api/torneos.api"
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
  const [torneoEditar, setTorneoEditar] = useState<Torneo | undefined>(undefined)
  const [verFinalizados, setVerFinalizados] = useState(false)
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [loading, setLoading] = useState(true)
  const [procesandoId, setProcesandoId] = useState<number | null>(null)

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

  /**
   * Solicita confirmación y elimina (oculta) un torneo.
   * @param id - ID del torneo a eliminar.
   * @param e - Evento de click para evitar propagación al item de la lista.
   */
  const handleEliminar = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("¿Eliminar torneo? Se ocultará pero no se borrará definitivamente.")) return
    try {
      setProcesandoId(id)
      await eliminarTorneo(id)
      await cargarTorneos()
    } finally {
      setProcesandoId(null)
    }
  }

  /**
   * Solicita confirmación y marca un torneo como finalizado.
   * @param id - ID del torneo a finalizar.
   * @param e - Evento de click para evitar propagación al item de la lista.
   */
  const handleFinalizar = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("¿Finalizar torneo?")) return
    try {
      setProcesandoId(id)
      await finalizarTorneo(id)
      await cargarTorneos()
    } finally {
      setProcesandoId(null)
    }
  }

  /**
   * Solicita confirmación y reactiva un torneo finalizado.
   * @param id - ID del torneo a reabrir.
   * @param e - Evento de click para evitar propagación al item de la lista.
   */
  const handleReabrir = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("¿Reabrir torneo? Volverá a estar activo.")) return
    try {
      setProcesandoId(id)
      await reabrirTorneo(id)
      await cargarTorneos()
    } finally {
      setProcesandoId(null)
    }
  }

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          {verFinalizados ? "Torneos finalizados" : "Torneos activos"}
        </h2>
        <div className={styles.botones}>
          {!verFinalizados && (
            <Button onClick={() => { setTorneoEditar(undefined); setMostrarForm(true) }}>➕ Crear torneo</Button>
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
          torneoEditar={torneoEditar}
          onCancel={() => { setMostrarForm(false); setTorneoEditar(undefined) }}
          onSuccess={() => { setMostrarForm(false); setTorneoEditar(undefined); cargarTorneos() }}
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
                <div className={styles.meta}>{t.categoria}{t.division ? ` ${t.division}` : ""} – {t.genero}</div>
                {verFinalizados && t.fecha_fin && (
                  <div className={styles.fechaFin}>Finalizado: {t.fecha_fin}</div>
                )}
              </div>

              <div className={styles.actions}>
                <Button
                  variant="secondary"
                  disabled={procesandoId === t.id_torneo}
                  onClick={(e) => { e.stopPropagation(); setTorneoEditar(t); setMostrarForm(true) }}
                >
                  ✏️ Editar
                </Button>
                {verFinalizados ? (
                  <Button
                    variant="secondary"
                    disabled={procesandoId === t.id_torneo}
                    onClick={(e) => handleReabrir(t.id_torneo, e)}
                  >
                    🔁 Reabrir
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    disabled={procesandoId === t.id_torneo}
                    onClick={(e) => handleFinalizar(t.id_torneo, e)}
                  >
                    🏁 Finalizar
                  </Button>
                )}
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
