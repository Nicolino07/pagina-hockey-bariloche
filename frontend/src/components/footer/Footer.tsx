import styles from "./Footer.module.css"

/** Pie de página global con información de autoría y contacto. */
export default function Footer() {
  return (
    <footer className={styles.footer}>
      © 2026 Hockey Bariloche — Desarrollado por{" "}
      <a
        href="mailto:elias.nicolas.vargas@gmail.com"
        className={styles.author}
      >
        NicolinoloccheV
      </a>
    </footer>
  )
}
