
import type { ReactNode } from "react"
import styles from "./Modal.module.css"

interface ModalProps {
  /** Si es true, el modal es visible. */
  open: boolean
  /** Título que se muestra en el encabezado del modal. */
  title?: string
  /** Contenido del cuerpo del modal. */
  children: ReactNode
  /** Callback invocado al cerrar el modal (clic en overlay o botón ✕). */
  onClose: () => void
  /** Clase CSS adicional para personalizar el estilo del título. */
  titleClassName?: string
}

/**
 * Modal genérico reutilizable con overlay, título y botón de cierre.
 * Cierra al hacer clic fuera del contenido. No renderiza nada si `open` es false.
 */
export default function Modal({
  open,
  title,
  children,
  onClose,
  titleClassName, 
}: ModalProps) {
  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          {/* Combinamos la clase base con la que venga por prop */}
          <h3 className={`${styles.defaultTitle} ${titleClassName || ""}`}>
            {title}
          </h3>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </header>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}