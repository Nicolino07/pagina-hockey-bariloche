import styles from "./ClubCard.module.css"
import type { Club } from "../../types/club"

interface Props {
  /** Club a mostrar en la tarjeta. */
  club: Club
  /** Callback invocado al hacer clic en la tarjeta. */
  onClick: (club: Club) => void
}

/**
 * Tarjeta visual que representa un club en el listado.
 * Muestra nombre y ciudad, y ejecuta el callback al ser clickeada.
 */
export default function ClubCard({ club, onClick }: Props) {
  return (
    <div
      className={styles.card}
      onClick={() => onClick(club)}
      role="button"
    >
      <div>
        <h3>{club.nombre}</h3>
        <span>{club.ciudad}</span>
      </div>

      <span className={styles.chevron}>›</span>
    </div>
  )
}
