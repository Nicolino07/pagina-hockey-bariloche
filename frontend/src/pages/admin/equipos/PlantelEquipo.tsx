// src/pages/admin/equipos/PlantelEquipo.tsx
import { usePlantelActivo } from "../../../hooks/usePlantelActivo"
import type { PlantelActivoIntegrante } from "../../../types/vistas"
import PlantelLista from "./PlantelLista"

interface Props {
  /** ID del equipo cuyo plantel activo se quiere mostrar. */
  id_equipo: number
}

/**
 * Componente que muestra el plantel activo de un equipo en modo solo lectura.
 * Delega la renderización de la lista al componente PlantelLista.
 */
export default function PlantelEquipo({ id_equipo }: Props) {
  const { integrantes, loading, error, hasPlantel } =
    usePlantelActivo(id_equipo)



  const handleEliminar = (i: PlantelActivoIntegrante) => {
    console.log("Eliminar integrante:", i)
    // acá después llamás a la API
  }

  if (loading) return <p>Cargando plantel…</p>
  if (error) return <p>{error}</p>
  if (!hasPlantel) return <p>Este equipo no tiene integrantes</p>

  return (
    <>
     

      <PlantelLista
        integrantes={integrantes}
        editable={false}
        onEliminar={handleEliminar}
      />
    </>
  )
}
