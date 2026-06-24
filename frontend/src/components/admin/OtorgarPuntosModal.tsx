import { useState } from "react"
import styles from "./OtorgarPuntosModal.module.css"

interface OtorgarPuntosModalProps {
  isOpen: boolean
  equipoLocal: string
  equipoVisitante: string
  onConfirm: (golesLocal: number, golesVisitante: number) => void
  onCancel: () => void
  loading?: boolean
}

export default function OtorgarPuntosModal({
  isOpen,
  equipoLocal,
  equipoVisitante,
  onConfirm,
  onCancel,
  loading = false,
}: OtorgarPuntosModalProps) {
  const [golesLocal, setGolesLocal] = useState<number>(0)
  const [golesVisitante, setGolesVisitante] = useState<number>(0)

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm(golesLocal, golesVisitante)
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Otorgar Puntos</h2>
          <button className={styles.closeBtn} onClick={onCancel}>×</button>
        </div>

        <div className={styles.content}>
          <p className={styles.subtitle}>
            Ingresa los goles por defecto (descalificación, no presentación, etc.)
          </p>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>{equipoLocal}</label>
              <input
                type="number"
                min="0"
                max="50"
                value={golesLocal}
                onChange={(e) => setGolesLocal(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={loading}
              />
            </div>

            <div className={styles.vs}>VS</div>

            <div className={styles.formGroup}>
              <label>{equipoVisitante}</label>
              <input
                type="number"
                min="0"
                max="50"
                value={golesVisitante}
                onChange={(e) => setGolesVisitante(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button
              className={styles.btnCancel}
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              className={styles.btnConfirm}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? "Guardando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
