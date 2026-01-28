import { useParams } from "react-router-dom"
import { useInscripcionesTorneo } from "../../../hooks/useInscripcionesTorneo"
import InscripcionesTorneoLista from "./InscripcionesTorneoLista"
import { useTorneo } from "../../../hooks/useTorneo"

export default function TorneoDetalle() {
  const { idTorneo } = useParams<{ idTorneo: string }>()
  const torneoId = Number(idTorneo)

  const { torneo, loading: loadingTorneo } = useTorneo(torneoId)
  const {
    inscripciones,
    loading: loadingInscripciones,
    error,
    baja,
  } = useInscripcionesTorneo(torneoId)

  if (loadingTorneo || loadingInscripciones) return <p>Cargando…</p>
  if (error || !torneo) return <p>Error</p>

  return (
    <section>
      {/* HEADER */}
      <header>
        <h2>{torneo.nombre}</h2>
        <p>
          Categoría {torneo.categoria} – {torneo.genero} –{" "}
          {new Date(torneo.fecha_inicio).getFullYear()}
        </p>
      </header>

      {/* LISTA */}
      <InscripcionesTorneoLista
        inscripciones={inscripciones}
        onBaja={baja}
      />
    </section>
  )
}

