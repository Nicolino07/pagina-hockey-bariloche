import { usePlantelActivo } from "../../../hooks/usePlantelActivo"
import PlantelLista from "../equipos/PlantelLista"

type Props = {
  equipoId: number
}

export default function PlantelEquipo({ equipoId }: Props) {
  const { integrantes, loading, error, hasData } =
    usePlantelActivo(equipoId)

  if (loading) return <p>Cargando plantel…</p>
  if (error) return <p>{error}</p>
  if (!hasData) return <p>Este equipo no tiene integrantes</p>

  return <PlantelLista integrantes={integrantes} />
}
