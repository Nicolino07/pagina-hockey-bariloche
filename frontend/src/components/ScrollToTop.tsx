import { useEffect } from "react"
import { useLocation, useNavigationType } from "react-router-dom"

/**
 * Lleva la vista al tope en cada navegación nueva.
 *
 * React Router no toca el scroll al cambiar de ruta, así que al salir de una
 * página larga (por ejemplo la tabla anual de torneos) se caía en la siguiente
 * a media altura y se veía como un salto. El navegador hace esto solo en una
 * app tradicional; en una SPA hay que pedirlo.
 *
 * En una navegación POP — botón atrás o adelante — no se toca nada: ahí el
 * usuario espera volver a donde estaba.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType === "POP") return
    window.scrollTo({ top: 0, left: 0 })
  }, [pathname, navigationType])

  return null
}
