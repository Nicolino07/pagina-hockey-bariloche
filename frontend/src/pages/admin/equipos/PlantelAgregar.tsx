import { useEffect, useState } from "react"
import styles from "./EquipoDetalle.module.css"

import { listarPersonas } from "../../../api/personas.api"
import { agregarIntegrante } from "../../../api/plantelIntegrantes.api"

import type { Persona } from "../../../types/persona"
import type { TipoRolPersona } from "../../../types/enums"
import type { PlantelIntegranteCreate } from "../../../types/plantelIntegrante"

type Props = {
  idPlantel: number
  onClose: () => void
  onSuccess: () => void
}

const ROLES_PLANTEL: TipoRolPersona[] = [
  "JUGADOR",
  "ENTRENADOR",
  "ASISTENTE",
  "PREPARADOR_FISICO",
  "MEDICO",
  "DELEGADO",
]

export default function PlantelAgregar({
  idPlantel,
  onSuccess,
  onClose,
}: Props) {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)

  const [idPersona, setIdPersona] = useState<number | "">("")
  const [rol, setRol] = useState<TipoRolPersona | "">("")
  const [numero, setNumero] = useState<number | "">("")

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listarPersonas()
      .then(setPersonas)
      .finally(() => setLoading(false))
  }, [])

  const submit = async () => {
    if (!idPersona || !rol) {
      setError("Persona y rol son obligatorios")
      return
    }

    const payload: PlantelIntegranteCreate = {
      id_persona: Number(idPersona),
      rol_en_plantel: rol as TipoRolPersona,
      numero_camiseta:
        rol === "JUGADOR" && numero ? Number(numero) : null,
    }

    try {
      setSubmitting(true)
      await agregarIntegrante(idPlantel, payload)
      onSuccess()
    } catch (e: any) {
      setError(e.message || "Error al agregar integrante")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p>Cargando personas…</p>

  return (
    <div className={styles.modal}>
      <h3>Agregar integrante</h3>

      {error && <p className={styles.error}>{error}</p>}

      <label>
        Persona
        <select
          value={idPersona}
          onChange={(e) => setIdPersona(Number(e.target.value))}
        >
          <option value="">Seleccionar…</option>
          {personas.map((p) => (
            <option key={p.id_persona} value={p.id_persona}>
              {p.apellido}, {p.nombre}
            </option>
          ))}
        </select>
      </label>

      <label>
        Rol en el plantel
        <select
          value={rol}
          onChange={(e) =>
            setRol(e.target.value as TipoRolPersona)
          }
        >
          <option value="">Seleccionar…</option>
          {ROLES_PLANTEL.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      {rol === "JUGADOR" && (
        <label>
          Nº de camiseta
          <input
            type="number"
            min={0}
            value={numero}
            onChange={(e) => setNumero(Number(e.target.value))}
          />
        </label>
      )}

      <div className={styles.modalActions}>
        <button onClick={onClose} disabled={submitting}>
          Cancelar
        </button>
        <button onClick={submit} disabled={submitting}>
          Agregar
        </button>
      </div>
    </div>
  )
}
