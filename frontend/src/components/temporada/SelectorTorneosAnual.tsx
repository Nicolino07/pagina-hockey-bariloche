import { useState, useEffect } from "react"
import type { SelectorTablaAnual } from "../../types/temporada"
import styles from "./SelectorTorneosAnual.module.css"

interface Props {
  datos: SelectorTablaAnual
  /** Se dispara al confirmar; el padre refresca la tabla con lo que devuelva. */
  onRegenerar: (idTorneos: number[]) => Promise<void>
  disabled?: boolean
}

const TIPO_LABEL: Record<string, string> = {
  LIGA: "Liga",
  COPA: "Copa",
  PLAYOFF: "Playoff",
}

/**
 * Selector de qué torneos suman a la tabla anual de una liga.
 *
 * Muestra todos los torneos de la categoría en el año — activos y terminados,
 * ligas y copas — y se manda el estado final de los tildes de una sola vez, no
 * altas y bajas sueltas. Así lo que se ve es lo que queda.
 */
export default function SelectorTorneosAnual({ datos, onRegenerar, disabled }: Props) {
  const inicial = new Set(datos.torneos.filter(t => t.computa).map(t => t.id_torneo))
  const [seleccion, setSeleccion] = useState<Set<number>>(inicial)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Al cambiar de categoría el componente se reusa: hay que reseguir los datos.
  useEffect(() => {
    setSeleccion(new Set(datos.torneos.filter(t => t.computa).map(t => t.id_torneo)))
    setError(null)
  }, [datos])

  const original = new Set(datos.torneos.filter(t => t.computa).map(t => t.id_torneo))
  const hayCambios =
    seleccion.size !== original.size ||
    [...seleccion].some(id => !original.has(id))

  function alternar(id: number) {
    setSeleccion(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  async function regenerar() {
    setGuardando(true)
    setError(null)
    try {
      await onRegenerar([...seleccion])
    } catch {
      setError("No se pudo regenerar la tabla. Probá de nuevo.")
    } finally {
      setGuardando(false)
    }
  }

  if (datos.torneos.length === 0) {
    return (
      <div className={styles.card}>
        <h4 className={styles.titulo}>Torneos de la tabla anual</h4>
        <p className={styles.vacio}>
          Esta categoría no tiene ningún torneo que empiece en {datos.anio}.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <h4 className={styles.titulo}>
        Seleccioná los torneos que suman a la tabla anual
      </h4>
      <p className={styles.ayuda}>
        Se listan únicamente los torneos cuya <strong>fecha de inicio cae en {datos.anio}</strong>,
        dentro de esta categoría. Los tildados acumulan sus puntos en la tabla de
        ese año; dejá afuera copas y relámpagos, que definen un campeón pero no
        suman. Los playoffs no aparecen: son la fase final de una liga que ya
        está sumando.
      </p>

      <ul className={styles.lista}>
        {datos.torneos.map(t => (
          <li key={t.id_torneo}>
            <label className={styles.fila}>
              <input
                type="checkbox"
                checked={seleccion.has(t.id_torneo)}
                onChange={() => alternar(t.id_torneo)}
                disabled={disabled || guardando}
              />
              <span className={styles.nombre}>{t.nombre}</span>
              <span className={styles.tipo}>{TIPO_LABEL[t.tipo] ?? t.tipo}</span>
              {!t.activo && <span className={styles.finalizado}>finalizado</span>}
            </label>
          </li>
        ))}
      </ul>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.acciones}>
        <button
          type="button"
          className={styles.boton}
          onClick={regenerar}
          disabled={disabled || guardando || !hayCambios}
        >
          {guardando ? "Regenerando…" : "Regenerar tabla anual"}
        </button>
        {hayCambios && !guardando && (
          <span className={styles.pendiente}>Hay cambios sin aplicar</span>
        )}
      </div>
    </div>
  )
}
