import styles from "./Modal.module.css"

type Props = {
  isOpen: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ isOpen, title, onClose, children }: Props) {
  if (!isOpen) return null

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <header className={styles.header}>
          {title && <h2>{title}</h2>}
          <button onClick={onClose}>✕</button>
        </header>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
