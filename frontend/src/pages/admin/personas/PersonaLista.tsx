import { usePersonasRoles } from "../../../hooks/usePersonaConRoles"

export const PersonasList = () => {
  const { data, loading, error } = usePersonasRoles()

  if (loading) return <p>Cargando personas...</p>
  if (error) return <p>{error}</p>

  return (
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Roles</th>
          <th>Club</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {data.map((persona) => {
          const rolPrincipal = persona.roles[0]

          return (
            <tr key={persona.id_persona}>
              <td>
                {persona.nombre} {persona.apellido}
              </td>

              <td>
                <strong>{rolPrincipal.rol}</strong>
                {persona.roles.length > 1 && (
                  <ul style={{ margin: 0 }}>
                    {persona.roles.slice(1).map((r) => (
                      <li key={r.rol}>{r.rol}</li>
                    ))}
                  </ul>
                )}
              </td>

              <td>
                {rolPrincipal.estado_fichaje === "FICHADO"
                  ? rolPrincipal.nombre_club
                  : "Sin fichar"}
              </td>

              <td>
                <button>Editar</button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
