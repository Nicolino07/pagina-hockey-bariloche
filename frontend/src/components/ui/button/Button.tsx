import type { ButtonHTMLAttributes, ReactNode } from "react"
import styles from "./Button.module.css"

/** Variante visual del botón que determina su color y estilo. */
type ButtonVariant = "primary" | "secondary" | "danger" | "outline"

/** Tamaño del botón que afecta padding y tipografía. */
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  /** Estilo visual del botón. Por defecto: "primary". */
  variant?: ButtonVariant
  /** Tamaño del botón. Por defecto: "md". */
  size?: ButtonSize
}

/**
 * Componente de botón reutilizable con soporte de variante y tamaño.
 * Acepta todas las props nativas de HTMLButtonElement.
 */
export default function Button({
  children,
  variant = "primary",
  size = "md", // Tamaño por defecto
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      // Combinamos: clase base + variante + tamaño + clases extras del padre
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
    >
      {children}
    </button>
  )
}