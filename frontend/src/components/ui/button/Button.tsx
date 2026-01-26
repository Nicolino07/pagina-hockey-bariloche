import type { ButtonHTMLAttributes, ReactNode } from "react"
import styles from "./Button.module.css"

type ButtonVariant = "primary" | "secondary" | "danger"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
}

export default function Button({
  children,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`${styles.button} ${styles[variant]}`}
    >
      {children}
    </button>
  )
}
