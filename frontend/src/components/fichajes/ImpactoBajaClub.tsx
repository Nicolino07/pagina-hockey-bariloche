import { useEffect, useState } from "react"
import {
  getPreviewBajaClub,
  type BajaClubPreview,
  type PlantelImpactadoBaja,
} from "../../api/fichajes.api"
import styles from "./ImpactoBajaClub.module.css"

interface ImpactoBajaClubProps {
  /** Club del que se va a dar de baja a la persona. */
  idClub: number
  /** Persona a dar de baja. */
  idPersona: number
  /**
   * Informa al contenedor si el preview terminó de cargar, para que habilite el
   * botón de confirmación recién cuando el usuario ya vio el impacto.
   */
  onCargado?: (preview: BajaClubPreview | null) => void
}

/**
 * Varios equipos de un mismo club pueden compartir nombre y distinguirse sólo
 * por categoría/división/género, así que lo armamos completo para que el
 * usuario sepa exactamente de cuál lo está sacando.
 */
function nombreEquipo(p: PlantelImpactadoBaja): string {
  const detalle = [p.equipo_categoria, p.equipo_division, p.equipo_genero]
    .filter(Boolean)
    .join(" ")
  return detalle ? `${p.equipo_nombre} (${detalle})` : p.equipo_nombre
}

/**
 * Muestra el impacto real de la baja general antes de confirmarla.
 *
 * La baja general cierra TODOS los roles vigentes de la persona en el club y,
 * por cascada, la saca de todos los planteles que dependen de esos roles, sin
 * importar el equipo ni el torneo. Este bloque lista rol por rol qué planteles
 * se van a cerrar, y aclara que para sacarla de un solo equipo hay que ir al
 * plantel de ese equipo.
 */
export default function ImpactoBajaClub({ idClub, idPersona, onCargado }: ImpactoBajaClubProps) {
  const [preview, setPreview] = useState<BajaClubPreview | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setError(null)
    setPreview(null)

    getPreviewBajaClub(idClub, idPersona)
      .then(data => {
        if (!vigente) return
        setPreview(data)
        onCargado?.(data)
      })
      .catch(() => {
        if (!vigente) return
        setError("No se pudo calcular el impacto de la baja.")
        onCargado?.(null)
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })

    return () => { vigente = false }
    // onCargado se omite a propósito: no queremos recargar si el padre lo redefine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idClub, idPersona])

  if (cargando) {
    return <p className={styles.cargando}>Calculando impacto de la baja…</p>
  }

  if (error || !preview) {
    return <p className={styles.error}>{error ?? "Sin datos de impacto."}</p>
  }

  const { roles, total_planteles: totalPlanteles, total_historial: totalHistorial } = preview

  return (
    <div className={styles.contenedor}>
      <div className={styles.encabezado}>
        <strong>{preview.persona_apellido}, {preview.persona_nombre}</strong>
        <span className={styles.meta}>DNI {preview.persona_documento} · {preview.club_nombre}</span>
      </div>

      <div className={styles.aviso}>
        <p className={styles.avisoTitulo}>⚠️ Baja general del club</p>
        <p>
          Se cierran <strong>todos</strong> sus roles en{" "}
          <strong>{preview.club_nombre}</strong> ({roles.length}) y se la saca de{" "}
          <strong>{totalPlanteles} plantel{totalPlanteles === 1 ? "" : "es"} abierto{totalPlanteles === 1 ? "" : "s"}</strong>,
          sin importar el equipo ni el torneo.
        </p>
        {totalHistorial > 0 && (
          <p className={styles.avisoHistorial}>
            Los {totalHistorial} plantel{totalHistorial === 1 ? "" : "es"} ya cerrado
            {totalHistorial === 1 ? "" : "s"} no se toca{totalHistorial === 1 ? "" : "n"}:
            son el historial del torneo y la persona sigue figurando ahí.
          </p>
        )}
        <p className={styles.avisoAlternativa}>
          Si sólo querés sacarla de <strong>un equipo</strong>, no uses esta baja:
          andá al plantel de ese equipo y dala de baja ahí.
        </p>
      </div>

      {roles.length === 0 ? (
        <p className={styles.vacio}>No tiene roles vigentes en este club.</p>
      ) : (
        roles.map(rol => (
          <div key={rol.id_fichaje_rol} className={styles.bloque}>
            <p className={styles.bloqueTitulo}>
              <span className={styles.rolBadge}>{rol.rol}</span>
              <span className={styles.bloqueResumen}>
                desde {rol.fecha_inicio} ·{" "}
                {rol.planteles.length === 0
                  ? "sin planteles abiertos"
                  : `sale de ${rol.planteles.length} plantel${rol.planteles.length === 1 ? "" : "es"}`}
              </span>
            </p>

            {rol.planteles.length > 0 && (
              <ul className={styles.lista}>
                {rol.planteles.map(p => (
                  <li key={p.id_plantel_integrante} className={styles.item}>
                    <span className={styles.itemEquipo}>{nombreEquipo(p)}</span>
                    <span className={styles.itemDetalle}>
                      {p.torneo_nombre ?? "Sin torneo"} · {p.rol_en_plantel}
                      {p.numero_camiseta !== null && ` · #${p.numero_camiseta}`}
                    </span>
                    <span className={styles.itemDesde}>desde {p.fecha_alta}</span>
                  </li>
                ))}
              </ul>
            )}

            {rol.planteles_historial.length > 0 && (
              <>
                <p className={styles.historialTitulo}>
                  Sigue activa en {rol.planteles_historial.length} plantel
                  {rol.planteles_historial.length === 1 ? " cerrado" : "es cerrados"} (historial)
                </p>
                <ul className={styles.lista}>
                  {rol.planteles_historial.map(p => (
                    <li key={p.id_plantel_integrante} className={styles.itemHistorial}>
                      <span className={styles.itemEquipo}>{nombreEquipo(p)}</span>
                      <span className={styles.itemDetalle}>
                        {p.torneo_nombre ?? "Sin torneo"} · {p.rol_en_plantel}
                      </span>
                      <span className={styles.itemDesde}>desde {p.fecha_alta}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))
      )}
    </div>
  )
}
