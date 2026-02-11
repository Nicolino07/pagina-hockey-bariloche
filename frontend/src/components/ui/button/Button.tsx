import type { ButtonHTMLAttributes, ReactNode } from "react"
import styles from "./Button.module.css"

type ButtonVariant = "primary" | "secondary" | "danger" | "outline"
type ButtonSize = "sm" | "md" | "lg" // <--- Nuevos tamaños

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize // <--- Prop opcional
}

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