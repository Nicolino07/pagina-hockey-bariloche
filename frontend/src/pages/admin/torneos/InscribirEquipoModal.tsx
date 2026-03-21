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

/**
 * Modal para inscribir equipos en un torneo.
 * Filtra los equipos disponibles por categoría y género del torneo,
 * e indica cuáles ya están inscriptos para evitar duplicados.
 * @param torneo - Torneo al que se inscribirán los equipos.
 * @param inscripciones - Inscripciones actuales para detectar duplicados.
 * @param onClose - Callback para cerrar el modal.
 * @param onInscripto - Callback invocado tras inscribir un equipo exitosamente.
 */
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
      (e.division ?? null) === (torneo.division ?? null) &&
      e.genero === torneo.genero
  )

  /**
   * Inscribe un equipo en el torneo y notifica al componente padre.
   * @param idEquipo - ID del equipo a inscribir.
   */
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
    <Modal 
      open={true} 
      title="Inscribir equipo" 
      onClose={onClose}
      titleClassName={styles.modalTitulo} 
    >
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
