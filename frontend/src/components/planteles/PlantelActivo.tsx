import { useEffect, useState } from "react"
import { getPlantelActivoPorEquipo } from "../../api/vistas/plantel.api"

interface Props {
  idEquipo: number
}

export default function PlantelActivo({ idEquipo }: Props) {
  const [integrantes, setIntegrantes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPlantelActivoPorEquipo(idEquipo)
        setIntegrantes(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [idEquipo])

  if (loading) return <p>Cargando plantel...</p>
  if (integrantes.length === 0)
    return <p>Este equipo no tiene integrantes activos</p>

  return (
    <ul>
      {integrantes.map((i) => (
        <li key={i.id_plantel_integrante}>
          <strong>{i.apellido}, {i.nombre}</strong>
          {" · "}
          {i.rol_en_plantel}
          {i.numero_camiseta && ` · #${i.numero_camiseta}`}
        </li>
      ))}
    </ul>
  )
}
