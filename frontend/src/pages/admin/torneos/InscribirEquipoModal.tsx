import { useEffect, useState } from "react"
import Button from "../../../components/ui/button/Button"
import Modal from "../../../components/ui/modal/Modal"
import { useEquipos } from "../../../hooks/useEquipos"
import { inscribirEquipoTorneo, listarInscripcionesTorneo } from "../../../api/torneos.api"

import type { Torneo } from "../../../types/torneo"
import type { InscripcionTorneoDetalle } from "../../../types/inscripcion"
import type { Equipo } from "../../../types/equipo"

import styles from "./InscribirEquipoModal.module.css"

interface Props {
  torneo: Torneo
  inscripciones: InscripcionTorneoDetalle[]
  onClose: () => void
  onInscripto: () => void | Promise<void>
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

  // Equipo cuya inscripción está en curso: evita el doble clic y da feedback
  // mientras se recarga la lista del torneo.
  const [inscribiendo, setInscribiendo] = useState<number | null>(null)

  const esPostemporada = torneo.tipo === "PLAYOFF" || torneo.tipo === "COPA" || !torneo.tipo

  // Con torneo base solo se pueden inscribir equipos que jugaron ese torneo.
  const conBase = !!torneo.torneo_base_id
  const [idsBase, setIdsBase] = useState<Set<number> | null>(null)

  useEffect(() => {
    if (!torneo.torneo_base_id) {
      setIdsBase(null)
      return
    }
    listarInscripcionesTorneo(torneo.torneo_base_id)
      .then(insc => setIdsBase(new Set(insc.map(i => i.id_equipo))))
      .catch(() => setIdsBase(new Set()))
  }, [torneo.torneo_base_id])

  const equiposFiltrados = equipos.filter(
    (e: Equipo) =>
      e.categoria === torneo.categoria &&
      (esPostemporada || (e.division ?? null) === (torneo.division ?? null)) &&
      e.genero === torneo.genero &&
      (!conBase || (idsBase?.has(e.id_equipo) ?? false))
  )

  /**
   * Inscribe un equipo en el torneo y notifica al componente padre.
   * @param idEquipo - ID del equipo a inscribir.
   */
  const handleInscribir = async (idEquipo: number) => {
    setInscribiendo(idEquipo)
    try {
      await inscribirEquipoTorneo(torneo.id_torneo, idEquipo)
      // Se espera la recarga: hasta que no vuelva, la prop `inscripciones`
      // sigue vieja y el botón mostraría "Inscribir" sobre un equipo ya anotado.
      await onInscripto()
    } catch (e: any) {
      alert(e.response?.data?.detail ?? e.response?.data?.message ?? "Error al inscribir")
    } finally {
      setInscribiendo(null)
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
      {conBase && (
        <p className={styles.nota}>
          Solo se pueden inscribir equipos que jugaron el torneo base.
        </p>
      )}
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
                disabled={yaInscripto || inscribiendo !== null}
                onClick={() => handleInscribir(e.id_equipo)}
              >
                {inscribiendo === e.id_equipo
                  ? "Inscribiendo…"
                  : yaInscripto
                    ? "Inscripto"
                    : "Inscribir"}
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
