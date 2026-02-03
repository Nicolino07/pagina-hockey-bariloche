import { useState } from "react"
import { crearPersona } from "../../../api/personas.api"
import type { TipoRolPersona } from "../../../constants/enums"

type Props = {
  plantelId: number
  onClose: () => void
  onSuccess: () => void
}

export default function AgregarPersonaModal({
  plantelId,
  onClose,
  onSuccess,
}: Props) {
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [dni, setDni] = useState("")

  const [rol, setRol] = useState<TipoRolPersona>(
    "JUGADOR"
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await crearPersona({
        nombre,
        apellido,
        dni,
        rol,
        id_plantel: plantelId,
      })

      onSuccess()
      onClose()
    } catch (err) {
      setError("Error al crear la persona")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nombre</label>
        <input
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Apellido</label>
        <input
          value={apellido}
          onChange={e => setApellido(e.target.value)}
          required
        />
      </div>

      <div>
        <label>DNI</label>
        <input
          value={dni}
          onChange={e => setDni(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Rol</label>
        <select
          value={rol}
          onChange={e =>
            setRol(e.target.value as TipoRolPersona)
          }
        >
          <option value="JUGADOR">Jugador</option>
          <option value="DT">DT</option>
          <option value="ARBITRO">Árbitro</option>
        </select>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginTop: 16 }}>
        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{ marginLeft: 8 }}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
