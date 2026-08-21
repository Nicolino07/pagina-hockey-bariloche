import { useState } from "react"
import Button from "./Button"
import { generarPlanillaEnBlancoPDF } from "../../../services/PlanillaVacia.service"

interface BotonPlanillaEnBlancoProps {
  /** Estilo visual del botón. Por defecto: "outline". */
  variant?: "primary" | "secondary" | "danger" | "outline"
  /** Tamaño del botón. Por defecto: "md". */
  size?: "sm" | "md" | "lg"
  /** Texto del botón. Por defecto: "Planilla en blanco". */
  children?: React.ReactNode
  /** Cantidad de hojas a generar. Por defecto 1. */
  cantidad?: number
  className?: string
}

/**
 * Botón que descarga un PDF con planillas totalmente vacías para completar a mano.
 * No requiere torneo ni equipos seleccionados: se puede ubicar en cualquier pantalla.
 */
export default function BotonPlanillaEnBlanco({
  variant = "outline",
  size = "md",
  children = "Planilla en blanco",
  cantidad = 1,
  className,
}: BotonPlanillaEnBlancoProps) {
  const [generando, setGenerando] = useState(false)

  const handleClick = () => {
    setGenerando(true)
    try {
      generarPlanillaEnBlancoPDF({ cantidad })
    } catch (error) {
      console.error("Error generando planilla en blanco:", error)
      alert("Error al generar la planilla en blanco")
    } finally {
      setGenerando(false)
    }
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleClick} disabled={generando}>
      {generando ? "Generando..." : children}
    </Button>
  )
}
