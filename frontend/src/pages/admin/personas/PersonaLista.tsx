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
            const [rolPrincipal, ...otrosRoles] = persona.roles;
            const clubPrincipal = rolPrincipal?.clubes?.[0];

            return (
              <tr key={persona.id_persona}>
                {/* Agregamos data-label a cada td */}
                <td data-label="Nombre" className={styles.personaName}>
                  {persona.apellido}, {persona.nombre}
                  {persona.documento && (
                    <span className={styles.documento}> (DNI: {persona.documento})</span>
                  )}
                </td>

                <td data-label="Roles" className={styles.rolesCell}>
                  {rolPrincipal && (
                    <>
                      <span className={styles.primaryRol}>{rolPrincipal.rol}</span>
                      {otrosRoles.length > 0 && (
                        <ul className={styles.extraRoles}>
                          {otrosRoles.map((rol) => (
                            <li key={rol.id_persona_rol}>
                              • {rol.rol}
                              {rol.clubes?.length > 0 && (
                                <span className={styles.clubExtra}> ({rol.clubes[0].nombre_club})</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </td>

                <td data-label="Estado/Club" className={styles.clubCell}>
                  {rolPrincipal?.estado_fichaje === "FICHADO" && clubPrincipal ? (
                    <div>
                      <span className={styles.fichado}>{clubPrincipal.nombre_club}</span>
                      {rolPrincipal.clubes && rolPrincipal.clubes.length > 1 && (
                        <span className={styles.multiClub}>+{rolPrincipal.clubes.length - 1}</span>
                      )}
                    </div>
                  ) : (
                    <span className={styles.libre}>Sin fichar</span>
                  )}
                </td>

                <td data-label="Acción" style={{ textAlign: "right" }}>
                  <button className={styles.editBtn}>Editar</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};