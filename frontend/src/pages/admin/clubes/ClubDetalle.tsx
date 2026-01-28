// src/pages/admin/clubes/ClubDetalle.tsx
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import styles from "./ClubDetalle.module.css"

import { getClubById } from "../../../api/clubes.api"
import { getEquiposByClub } from "../../../api/equipos.api"
import type { Club } from "../../../types/club"
import type { Equipo } from "../../../types/equipo"

import PlantelEquipo from "../equipos/PlantelEquipo"

export default function ClubDetalle() {
  const { id_club } = useParams<{ id_club: string }>()
  const navigate = useNavigate()

  const [club, setClub] = useState<Club | null>(null)
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)

  const [equipoAbierto, setEquipoAbierto] = useState<number | null>(null)

  useEffect(() => {
    if (!id_club) return

    setLoading(true)

    Promise.all([
      getClubById(Number(id_club)),
      getEquiposByClub(Number(id_club)),
    ])
      .then(([clubData, equiposData]) => {
        setClub(clubData)
        setEquipos(equiposData)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id_club])

  if (loading) {
    return (
      <section className={styles.container}>
        <p>Cargando club…</p>
      </section>
    )
  }

  if (!club) {
    return (
      <section className={styles.container}>
        <p>Club no encontrado</p>
      </section>
    )
  }

  return (
    <section className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate("/admin/clubes")}
        >
          ← Volver
        </button>

        <div className={styles.title}>
          <h1>{club.nombre}</h1>
          <span className={styles.city}>{club.ciudad}</span>
        </div>

        <div className={styles.actions}>
          <button className={styles.edit}>Editar</button>
          <button className={styles.delete}>Eliminar</button>
        </div>
      </header>

      {/* EQUIPOS */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Equipos</h2>
          <button>+ Nuevo equipo</button>
        </div>

        {equipos.length === 0 && (
          <div className={styles.empty}>
            Este club aún no tiene equipos
          </div>
        )}

        {equipos.length > 0 && (
          <ul className={styles.equiposList}>
            {equipos.map((equipo) => {
              const abierto = equipoAbierto === equipo.id_equipo

              return (
                <li
                  key={equipo.id_equipo}
                  className={styles.equipoItem}
                >
                  {/* HEADER EQUIPO */}
                  <div
                    className={styles.equipoHeader}
                    onClick={() =>
                      setEquipoAbierto(
                        abierto ? null : equipo.id_equipo
                      )
                    }
                  >
                    <div>
                      <strong>{equipo.nombre}</strong>
                      <div className={styles.equipoMeta}>
                        {equipo.categoria} · {equipo.genero}
                      </div>
                    </div>

                    <button
                      className={styles.edit}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(
                          `/admin/equipos/${equipo.id_equipo}`,
                          {
                            state: {
                              clubNombre: club.nombre,
                              clubId: club.id_club,
                              equipoNombre: equipo.nombre,
                              categoria: equipo.categoria,
                              generoEquipo: equipo.genero,
                             
                            },
                          }
                        )
                      }}
                    >
                      Editar
                    </button>
                  </div>

                  {/* PLANTEL */}
                  {abierto && (
                    <div className={styles.plantelWrapper}>
                      <PlantelEquipo id_equipo={equipo.id_equipo} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </section>
  )
}
