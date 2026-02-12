
import type { ReactNode } from "react"
import styles from "./Modal.module.css"

interface ModalProps {
  open: boolean
  title?: string
  children: ReactNode
  onClose: () => void
  titleClassName?: string 
}

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