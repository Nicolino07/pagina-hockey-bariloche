import { usePersonaConRoles } from "../../../hooks/usePersonaConRoles";
import type { PersonaAgrupada } from "../../../types/persona";
import styles from "./PersonasList.module.css";

export const PersonasList = () => {
  const { personas, loading, error } = usePersonaConRoles();

  if (loading) return <p className={styles.loading}>Cargando personas...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!personas || personas.length === 0) return <p className={styles.empty}>No hay personas cargadas</p>;

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre y Apellido</th>
            <th>Roles</th>
            <th>Estado / Club</th>
            <th style={{ textAlign: "right" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {personas.map((persona: PersonaAgrupada) => {
            // El primer rol es el principal (los demás son adicionales)
            const [rolPrincipal, ...otrosRoles] = persona.roles;
            
            // Para mostrar el club, tomamos el primer club del rol principal
            const clubPrincipal = rolPrincipal?.clubes?.[0];

            return (
              <tr key={persona.id_persona}>
                <td className={styles.personaName}>
                  {persona.apellido}, {persona.nombre}
                  {persona.documento && (
                    <span className={styles.documento}> (DNI: {persona.documento})</span>
                  )}
                </td>

                <td className={styles.rolesCell}>
                  {rolPrincipal && (
                    <>
                      <span className={styles.primaryRol}>
                        {rolPrincipal.rol}
                      </span>
                      
                      {otrosRoles.length > 0 && (
                        <ul className={styles.extraRoles}>
                          {otrosRoles.map((rol) => (
                            <li key={rol.id_persona_rol}>
                              • {rol.rol}
                              {rol.clubes?.length > 0 && (
                                <span className={styles.clubExtra}>
                                  {' '}({rol.clubes[0].nombre_club})
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </td>

                <td className={styles.clubCell}>
                  {rolPrincipal?.estado_fichaje === "FICHADO" && clubPrincipal ? (
                    <div>
                      <span className={styles.fichado}>
                        {clubPrincipal.nombre_club}
                      </span>
                      {rolPrincipal.clubes && rolPrincipal.clubes.length > 1 && (
                        <span className={styles.multiClub}>
                          +{rolPrincipal.clubes.length - 1} clubes
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className={styles.libre}>Sin fichar</span>
                  )}
                </td>

                <td style={{ textAlign: "right" }}>
                  <button 
                    className={styles.editBtn}
                    onClick={() => {
                      // Aquí iría la navegación a edición
                      console.log("Editar persona:", persona.id_persona);
                    }}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};