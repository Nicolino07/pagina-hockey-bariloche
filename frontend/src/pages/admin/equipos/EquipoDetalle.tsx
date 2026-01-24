import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"

import styles from "./EquipoDetalle.module.css"

import { getEquipoById } from "../../../api/equipos.api"
import {
  getPlantelActivoByEquipo,
  createPlantel,
  getIntegrantesByPlantel,
} from "../../../api/planteles.api"

import type { Equipo } from "../../../types/equipo"
import type { Plantel } from "../../../types/plantel"
import type { PlantelIntegrante } from "../../../types/plantelIntegrante"

export default function EquipoDetalle() {
  const { id_equipo } = useParams<{ id_equipo: string }>()
  const navigate = useNavigate()

  const [equipo, setEquipo] = useState<Equipo | null>(null)
  const [plantel, setPlantel] = useState<Plantel | null>(null)
  const [integrantes, setIntegrantes] = useState<PlantelIntegrante[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id_equipo) return

    const load = async () => {
      const eq = await getEquipoById(Number(id_equipo))
      setEquipo(eq)

      const pl = await getPlantelActivoByEquipo(eq.id_equipo)
      setPlantel(pl)

      if (pl) {
        const ints = await getIntegrantesByPlantel(pl.id_plantel)
        setIntegrantes(ints)
      }

      setLoading(false)
    }

    load()
  }, [id_equipo])

  if (loading) return <p>Cargando equipo…</p>
  if (!equipo) return <p>Equipo no encontrado</p>

  return (
    <section className={styles.container}>
      {/* ───────── HEADER ───────── */}
      <header className={styles.header}>
        <button onClick={() => navigate(-1)}>← Volver</button>
        <h1>{equipo.nombre}</h1>
        <span>
          {equipo.categoria} · {equipo.genero}
        </span>
      </header>

      {/* ───────── PLANTEL ───────── */}
      <section className={styles.section}>
        <h2>Plantel</h2>

        {!plantel && (
          <button
            className={styles.primary}
            onClick={async () => {
              const nuevo = await createPlantel(equipo.id_equipo)
              setPlantel(nuevo)
              setIntegrantes([])
            }}
          >
            Crear plantel
          </button>
        )}

        {plantel && integrantes.length === 0 && (
          <p className={styles.empty}>
            El plantel no tiene integrantes
          </p>
        )}

        {plantel && integrantes.length > 0 && (
          <ul className={styles.list}>
            {integrantes.map((i) => (
              <li key={i.id_plantel_integrante}>
                <strong>
                  {i.persona?.apellido}, {i.persona?.nombre}
                </strong>
                <span>{i.rol_en_plantel}</span>
              </li>
            ))}
          </ul>
        )}

        {plantel && (
          <button
            className={styles.secondary}
            onClick={() =>
              navigate(`/admin/planteles/${plantel.id_plantel}/agregar`)
            }
          >
            Agregar integrante
          </button>
        )}
      </section>
    </section>
  )
}
