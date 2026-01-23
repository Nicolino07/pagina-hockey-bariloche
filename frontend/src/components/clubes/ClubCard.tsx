import styles from "./ClubCard.module.css"
import type { Club } from "../../types/club"

type Props = {
  club: Club
  onClick: (club: Club) => void
}

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
