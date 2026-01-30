import Button from "../../../components/ui/button/Button"
import Modal from "../../../components/ui/modal/Modal"
import { useEquipos } from "../../../hooks/useEquipos"
import { inscribirEquipoTorneo } from "../../../api/torneos.api"

import type { Torneo } from "../../../types/torneo"
import type { InscripcionTorneoDetalle } from "../../../types/inscripcion"
import type { Equipo } from "../../../types/equipo"

import styles from "./InscribirEquipoModal.module.css"

interface Props {
  torneo: Torneo
  inscripciones: InscripcionTorneoDetalle[]
  onClose: () => void
  onInscripto: () => void
}

export default function InscribirEquipoModal({
  torneo,
  inscripciones,
  onClose,
  onInscripto,
}: Props) {
  const { equipos, loading } = useEquipos()

  const equiposFiltrados = equipos.filter(
    (e: Equipo) =>
      e.categoria === torneo.categoria &&
      e.genero === torneo.genero
  )

  const handleInscribir = async (idEquipo: number) => {
    try {
      await inscribirEquipoTorneo(torneo.id_torneo, idEquipo)
      onInscripto()
    } catch (e: any) {
      alert(e.response?.data?.message ?? "Error al inscribir")
    }
  }

  if (loading) return <p>Cargando equipos…</p>

  return (
    <Modal open={true} title="Inscribir equipo" onClose={onClose}>
      <ul className={styles.list}>
        {equiposFiltrados.map((e: Equipo) => {
          const yaInscripto = inscripciones.some(
            insc =>
              insc.id_equipo === e.id_equipo &&
              insc.fecha_baja === null
          )

          return (
            <li key={e.id_equipo} className={styles.item}>
              <span className={styles.nombre}>{e.nombre}</span>

              <Button
                disabled={yaInscripto}
                onClick={() => handleInscribir(e.id_equipo)}
              >
                {yaInscripto ? "Inscripto" : "Inscribir"}
              </Button>
            </li>
          )
        })}
      </ul>

      <div className={styles.footer}>
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  )
}
