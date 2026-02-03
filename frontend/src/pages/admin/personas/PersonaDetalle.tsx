import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import {
  getPersonaById,
  getRolesActivosPersona,
  quitarRolPersona,
} from "../../../api/personas.api"
import type { Persona } from "../../../types/persona"
import type { PersonaConRol } from "../../../types/vistas"
import style from "./PersonaDetalle.module.css"

export default function PersonaDetalle() {
  const { id_persona } = useParams<{ id_persona: string }>()

  const [persona, setPersona] = useState<Persona | null>(null)
  const [roles, setRoles] = useState<PersonaConRol[]>([])
  const [loading, setLoading] = useState(true)

  async function handleQuitarRol(id_persona_rol: number) {
    if (!confirm("¿Quitar este rol?")) return

    try {
      await quitarRolPersona(id_persona_rol)
      setRoles((prev) =>
        prev.filter((r) => r.id_persona_rol !== id_persona_rol)
      )
    } catch (error) {
      alert("No se pudo quitar el rol")
    }
  }

  console.log("PARAM:", id_persona)

  useEffect(() => {
    if (!id_persona) {
      setLoading(false)
      return
    }

    Promise.all([
      getPersonaById(Number(id_persona)),
      getRolesActivosPersona(Number(id_persona)),
    ])
      .then(([persona, roles]) => {
        setPersona(persona)
        setRoles(roles)
      })
      .finally(() => setLoading(false))
  }, [id_persona])

  if (loading) return <p>Cargando persona...</p>
  if (!persona) return <p>Persona no encontrada</p>

  return (
    <div>
      <h1>
        {persona.nombre} {persona.apellido}
      </h1>
      <p>DNI: {persona.documento}</p>

      <h2>Roles activos</h2>

      <button>+ Agregar rol</button>

      {roles.length === 0 ? (
        <p>La persona no tiene roles activos</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Rol</th>
              <th>Club</th>
              <th>Desde</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((rol) => (
              <tr key={rol.id_persona_rol}>
                <td>{rol.rol}</td>
                <td>{rol.nombre_club ?? "-"}</td>
                <td>{rol.fecha_desde ?? "-"}</td>
                <td>
                  <button onClick={() => handleQuitarRol(rol.id_persona_rol)}>
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
