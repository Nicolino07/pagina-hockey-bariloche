import { usePlantelActivo } from "../../../hooks/usePlantelActivo"
import PlantelLista from "../equipos/PlantelLista"

type Props = {
  id_equipo: number
}

export default function PlantelEquipo({ id_equipo }: Props) {
  const { integrantes, loading, error, hasData } =
    usePlantelActivo(id_equipo)

  if (loading) return <p>Cargando plantel…</p>
  if (error) return <p>{error}</p>
  if (!hasData) return <p>Este equipo no tiene integrantes</p>

  return <PlantelLista integrantes={integrantes} />
}
