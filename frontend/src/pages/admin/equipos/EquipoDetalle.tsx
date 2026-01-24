import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import styles from "./EquipoDetalle.module.css"

import { getEquipoById } from "../../../api/equipos.api"
import { getPlantelActivoByEquipo } from "../../../api/planteles.api"
import { getIntegrantesByPlantel } from "../../../api/plantelIntegrantes.api"

import type { Equipo } from "../../../types/equipo"
import type { Plantel } from "../../../types/plantel"
import type { PlantelIntegrante } from "../../../types/plantelIntegrante"

import PlantelLista from "./PlantelLista"
import PlantelAgregar from "./PlantelAgregar"

export default function EquipoDetalle() {
  const { idEquipo } = useParams<{ idEquipo: string }>()

  const [equipo, setEquipo] = useState<Equipo | null>(null)
  const [plantel, setPlantel] = useState<Plantel | null>(null)
  const [integrantes, setIntegrantes] = useState<PlantelIntegrante[]>([])
  const [mostrarAgregar, setMostrarAgregar] = useState(false)

  useEffect(() => {
    if (!idEquipo) return

    getEquipoById(Number(idEquipo)).then(setEquipo)

    getPlantelActivoByEquipo(Number(idEquipo)).then((p) => {
      setPlantel(p)
      if (p) {
        getIntegrantesByPlantel(p.id_plantel).then(setIntegrantes)
      }
    })
  }, [idEquipo])

  function recargarPlantel() {
    if (!plantel) return
    getIntegrantesByPlantel(plantel.id_plantel).then(setIntegrantes)
  }

  if (!equipo) return <p>Cargando equipo...</p>

  return (
    <div className={styles.container}>
      {/* 📌 Info del equipo */}
      <section className={styles.card}>
        <h2>{equipo.nombre}</h2>
        <p>Categoría: {equipo.categoria}</p>
        <p>Género: {equipo.genero}</p>
      </section>

      {/* 📋 Plantel */}
      <section className={styles.card}>
        <div className={styles.header}>
          <h3>Plantel</h3>

          {plantel && (
            <button onClick={() => setMostrarAgregar(true)}>
              ➕ Agregar integrante
            </button>
          )}
        </div>

        {!plantel && (
          <p>Este equipo aún no tiene plantel creado.</p>
        )}

        {plantel && (
          <PlantelLista integrantes={integrantes} />
        )}
      </section>

      {/* 🪟 Modal agregar */}
      {mostrarAgregar && plantel && (
        <PlantelAgregar
          idPlantel={plantel.id_plantel}
          onClose={() => setMostrarAgregar(false)}
          onSuccess={() => {
            setMostrarAgregar(false)
            recargarPlantel()
          }}
        />
      )}
    </div>
  )
}
