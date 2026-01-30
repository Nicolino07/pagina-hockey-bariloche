import { useParams } from "react-router-dom"
import { useState } from "react"
import { useInscripcionesTorneo } from "../../../hooks/useInscripcionesTorneo"
import InscripcionesTorneoLista from "./InscripcionesTorneoLista"
import { useTorneo } from "../../../hooks/useTorneo"
import Button from "../../../components/ui/button/Button"
import InscribirEquipoModal from "./InscribirEquipoModal"

import styles from "./TorneoDetalle.module.css"

export default function TorneoDetalle() {
  const { idTorneo } = useParams<{ idTorneo: string }>()
  const torneoId = Number(idTorneo)

  const { torneo, loading: loadingTorneo } = useTorneo(torneoId)
  const {
    inscripciones,
    loading: loadingInscripciones,
    error,
    baja,
    refetch,
  } = useInscripcionesTorneo(torneoId)

  const [open, setOpen] = useState(false)

  const handleInscripto = () => {
    refetch()
  }

  if (loadingTorneo || loadingInscripciones) return <p>Cargando…</p>
  if (error || !torneo) return <p>Error</p>

  return (
    <section className={styles.section}>
      {/* HEADER */}
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{torneo.nombre}</h2>
          <p className={styles.meta}>
            Categoría {torneo.categoria} – {torneo.genero} –{" "}
            {new Date(torneo.fecha_inicio).getFullYear()}
          </p>
        </div>

        <Button onClick={() => setOpen(true)}>
          ➕ Inscribir equipo
        </Button>
      </header>

      {/* LISTA */}
      <InscripcionesTorneoLista
        inscripciones={inscripciones}
        onBaja={baja}
      />

      {/* MODAL */}
      {open && (
        <InscribirEquipoModal
          torneo={torneo}
          inscripciones={inscripciones}
          onClose={() => setOpen(false)}
          onInscripto={handleInscripto}
        />
      )}
    </section>
  )
}
