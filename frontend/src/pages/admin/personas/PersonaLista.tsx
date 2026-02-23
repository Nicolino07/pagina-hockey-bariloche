import { usePersonasRoles } from "../../../hooks/usePersonaConRoles";
import styles from "./PersonasList.module.css";

export const PersonasList = () => {
  const { data, loading, error } = usePersonasRoles();

  if (loading) return <p className={styles.loading}>Cargando personas...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

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
          {data.map((persona) => {
            const rolPrincipal = persona.roles[0];

            return (
              <tr key={persona.id_persona}>
                <td className={styles.personaName}>
                  {persona.apellido}, {persona.nombre}
                </td>

                <td className={styles.rolesCell}>
                  <span className={styles.primaryRol}>{rolPrincipal.rol}</span>
                  {persona.roles.length > 1 && (
                    <ul className={styles.extraRoles}>
                      {persona.roles.slice(1).map((r) => (
                        <li key={r.rol}>• {r.rol}</li>
                      ))}
                    </ul>
                  )}
                </td>

                <td className={styles.clubCell}>
                  {rolPrincipal.estado_fichaje === "FICHADO" ? (
                    <span className={styles.fichado}>{rolPrincipal.nombre_club}</span>
                  ) : (
                    <span className={styles.libre}>Sin fichar</span>
                  )}
                </td>

                <td style={{ textAlign: "right" }}>
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