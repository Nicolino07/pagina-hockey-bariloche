import { useEffect, useState } from "react"
import { MOTIVOS_PUNTOS, etiquetaMotivoPuntos, type MotivoPuntos } from "../../constants/enums"
import styles from "./OtorgarPuntosModal.module.css"

interface OtorgarPuntosModalProps {
  isOpen: boolean
  equipoLocal: string
  equipoVisitante: string
  onConfirm: (
    golesLocal: number,
    golesVisitante: number,
    motivo: MotivoPuntos,
    descripcion: string,
    sinPuntos: boolean,
  ) => void
  onCancel: () => void
  loading?: boolean
}

/** Goles que corresponden a cada motivo, según la convención de 4-0. */
const GOLES_SUGERIDOS: Record<string, [number, number]> = {
  NO_PRESENTO_LOCAL: [0, 4],
  NO_PRESENTO_VISITANTE: [4, 0],
  NO_PRESENTARON_AMBOS: [0, 0],
  DESCALIFICADO_LOCAL: [0, 4],
  DESCALIFICADO_VISITANTE: [4, 0],
  OTRO: [0, 0],
}

export default function OtorgarPuntosModal({
  isOpen,
  equipoLocal,
  equipoVisitante,
  onConfirm,
  onCancel,
  loading = false,
}: OtorgarPuntosModalProps) {
  const [motivo, setMotivo] = useState<MotivoPuntos | "">("")
  const [golesLocal, setGolesLocal] = useState<number>(0)
  const [golesVisitante, setGolesVisitante] = useState<number>(0)
  const [descripcion, setDescripcion] = useState("")
  const [sinPuntos, setSinPuntos] = useState(false)

  // Al elegir el motivo, los goles se autocompletan con la convención. Igual
  // quedan editables por si un reglamento usa otro criterio.
  useEffect(() => {
    if (!motivo) return
    const [gl, gv] = GOLES_SUGERIDOS[motivo] ?? [0, 0]
    setGolesLocal(gl)
    setGolesVisitante(gv)
    if (motivo !== "NO_PRESENTARON_AMBOS") setSinPuntos(false)
  }, [motivo])

  useEffect(() => {
    if (!isOpen) {
      setMotivo("")
      setGolesLocal(0)
      setGolesVisitante(0)
      setDescripcion("")
      setSinPuntos(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const ambosAusentes = motivo === "NO_PRESENTARON_AMBOS"
  const descripcionRequerida = motivo === "OTRO" && !descripcion.trim()
  const puedeConfirmar = Boolean(motivo) && !descripcionRequerida && !loading

  const handleConfirm = () => {
    if (!motivo || descripcionRequerida) return
    onConfirm(golesLocal, golesVisitante, motivo, descripcion, sinPuntos)
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Otorgar Puntos</h2>
          <button className={styles.closeBtn} onClick={onCancel}>×</button>
        </div>

        <div className={styles.content}>
          <p className={styles.aviso}>
            ⚠️ Si el partido tiene goles cargados, <strong>se anulan</strong>. El
            resultado pasa a ser únicamente los goles por defecto, para que el
            marcador y la diferencia de gol no se cuenten dos veces.
          </p>

          <div className={styles.formGroup}>
            <label>Motivo <span className={styles.obligatorio}>*</span></label>
            <select
              value={motivo}
              onChange={e => setMotivo(e.target.value as MotivoPuntos)}
              disabled={loading}
            >
              <option value="">— Elegí el motivo —</option>
              {MOTIVOS_PUNTOS.map(m => (
                <option key={m} value={m}>
                  {etiquetaMotivoPuntos(m, equipoLocal, equipoVisitante)}
                </option>
              ))}
            </select>
            <small className={styles.ayuda}>
              Es lo que se muestra en el detalle público del partido.
            </small>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>{equipoLocal}</label>
              <input
                type="number"
                min="0"
                max="50"
                value={golesLocal}
                onChange={(e) => setGolesLocal(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={loading || sinPuntos}
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
                disabled={loading || sinPuntos}
              />
            </div>
          </div>

          {ambosAusentes && (
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={sinPuntos}
                onChange={e => setSinPuntos(e.target.checked)}
                disabled={loading}
              />
              <span>
                No otorgar puntos a ninguno de los dos
                <small>
                  Sin esto, un 0-0 les daría 1 punto a cada uno por la regla del
                  empate. Marcado, el partido cuenta como jugado y perdido para
                  los dos, con 0 puntos y 0 goles.
                </small>
              </span>
            </label>
          )}

          <div className={styles.formGroup}>
            <label>
              Descripción {motivo === "OTRO" ? <span className={styles.obligatorio}>*</span> : <small>(opcional)</small>}
            </label>
            <textarea
              rows={2}
              maxLength={500}
              value={descripcion}
              placeholder="Aclaración interna: número de acta, resolución, etc."
              onChange={e => setDescripcion(e.target.value)}
              disabled={loading}
            />
            <small className={styles.ayuda}>
              Uso administrativo. No se publica en el sitio.
            </small>
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
              disabled={!puedeConfirmar}
            >
              {loading ? "Guardando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
