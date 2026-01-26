
import type { ReactNode } from "react"
import styles from "./Modal.module.css"

interface ModalProps {
  open: boolean
  title?: string
  children: ReactNode
  onClose: () => void
}

export default function Modal({
  open,
  title,
  children,
  onClose,
}: ModalProps) {
  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h3>{title}</h3>
          <button onClick={onClose}>✕</button>
        </header>

        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  )
}
