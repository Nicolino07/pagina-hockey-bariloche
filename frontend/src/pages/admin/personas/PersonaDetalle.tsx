import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"

import {
  getPersonaById,
  getPersonasConRolesActivos,
  quitarRolPersona,
} from "../../../api/personas.api"

import type { Persona } from "../../../types/persona"
import type { PersonaRolVista } from "../../../types/vistas"

export default function PersonaDetalle() {
  const { id_persona } = useParams<{ id_persona: string }>()

  const [persona, setPersona] = useState<Persona | null>(null)
  const [roles, setRoles] = useState<PersonaRolVista[]>([])
  const [loading, setLoading] = useState(true)

  async function handleQuitarRol(id_persona_rol: number) {
    if (!confirm("¿Quitar este rol?")) return

    await quitarRolPersona(id_persona_rol)

    setRoles((prev) =>
      prev.filter((r) => r.id_persona_rol !== id_persona_rol)
    )
  }

  useEffect(() => {
    if (!id_persona) {
      setLoading(false)
      return
    }

    Promise.all([
      getPersonaById(Number(id_persona)),
      getPersonasConRolesActivos({ idPersona: Number(id_persona) }),
    ])
      .then(([persona, personasConRoles]) => {
        setPersona(persona)
        setRoles(personasConRoles[0]?.roles ?? [])
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

      <h2>Roles activos</h2>

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
                <td>{rol.fecha_desde}</td>
                <td>
                  <button
                    onClick={() => {
                      void handleQuitarRol(rol.id_persona_rol as number)
                    }}
                  >
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
