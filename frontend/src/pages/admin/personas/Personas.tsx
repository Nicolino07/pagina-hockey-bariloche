import { useNavigate } from "react-router-dom" // 1. Importar el hook
import styles from "./Personas.module.css"
import { Link } from "react-router-dom"
import { usePersonaConRoles } from "../../../hooks/usePersonaConRoles"

export default function Personas() {
  const { personas, loading, error } = usePersonaConRoles()
  const navigate = useNavigate() // 2. Inicializar navigate

  if (loading) return <p className={styles.loading}>Cargando personas...</p>
  if (error) return <p className={styles.error}>{error}</p>

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Personas</h1>
        <Link to="/admin/personas/nueva" className={styles.primaryButton}>
          + Nueva persona
        </Link>
      </header>

      <div className={styles.list}>
        {personas.map(persona => (
          /* 3. Evento onClick en la tarjeta */
          <div 
            key={persona.id_persona} 
            className={styles.personaCard}
            onClick={() => navigate(`/admin/personas/${persona.id_persona}`)}
            role="button"
            tabIndex={0}
          >
            <div className={styles.personaMain}>
              <span className={styles.iconUser}>👤</span>
              <h3>{persona.nombre} {persona.apellido}</h3>
            </div>

            <div className={styles.rolesContainer}>
              {persona.roles.map((rol, index) => (
                <div key={index} className={styles.rolRow}>
                  <span className={styles.rolName}>
                    {rol.rol === 'JUGADOR' ? '🏑' : '🏁'} {rol.rol}
                  </span>

                  <span className={`${styles.badge} ${styles[rol.estado_fichaje.toLowerCase().replace('_', '')]}`}>
                    {rol.estado_fichaje.replace('_', ' ')}
                  </span>

                  <span className={styles.clubName}>
                    🏢 {rol.clubes.length > 0 ? rol.clubes[0].nombre_club : '--'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}