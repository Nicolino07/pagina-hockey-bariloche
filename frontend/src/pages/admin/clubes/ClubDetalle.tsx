// src/pages/admin/clubes/ClubDetalle.tsx
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import styles from "./ClubDetalle.module.css"
import Modal from "../../../components/ui/modal/Modal"
import Button from "../../../components/ui/button/Button"

import { crearEquipo } from "../../../api/equipos.api"
import { getClubById } from "../../../api/clubes.api"
import { getEquiposByClub } from "../../../api/equipos.api"

import type { Club } from "../../../types/club"
import type { Equipo, EquipoCreate } from "../../../types/equipo"

import PlantelEquipo from "../equipos/PlantelEquipo"

import {
  GENEROS,
  CATEGORIAS,
} from "../../../constants/enums"

export default function ClubDetalle() {
  const { id_club } = useParams<{ id_club: string }>()
  const navigate = useNavigate()

  const [club, setClub] = useState<Club | null>(null)
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<EquipoCreate>({
    nombre: "",
    categoria: "",
    genero: "",
    id_club: Number(id_club),
  })

  const [equipoAbierto, setEquipoAbierto] =
    useState<number | null>(null)

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateEquipo = async () => {
    if (
      !form.nombre.trim() ||
      !form.categoria ||
      !form.genero
    ) {
      alert("Nombre, categoría y género son obligatorios")
      return
    }

    try {
      setSaving(true)

      const nuevoEquipo = await crearEquipo(form)

      setEquipos((prev) => [...prev, nuevoEquipo])
      setShowModal(false)

      setForm({
        nombre: "",
        categoria: "",
        genero: "",
        id_club: Number(id_club),
      })
    } catch (err) {
      console.error(err)
      alert("Error al crear equipo")
    } finally {
      setSaving(false)
    }
  }

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
      .finally(() => setLoading(false))
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
      {/* HEADER CLUB */}
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
      </header>

      {/* EQUIPOS */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Equipos</h2>
          <Button onClick={() => setShowModal(true)}>
            + Nuevo equipo
          </Button>
        </div>

        {equipos.length === 0 && (
          <div className={styles.empty}>
            Este club aún no tiene equipos
          </div>
        )}

        {equipos.length > 0 && (
          <ul className={styles.equiposList}>
            {equipos.map((equipo) => {
              const abierto =
                equipoAbierto === equipo.id_equipo

              return (
                <li
                  key={equipo.id_equipo}
                  className={styles.equipoItem}
                >
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

                    {abierto && (
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
                        Gestionar
                      </button>
                    )}
                  </div>

                  {abierto && (
                    <div className={styles.plantelWrapper}>
                      <PlantelEquipo
                        id_equipo={equipo.id_equipo}
                      />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* MODAL CREAR EQUIPO */}
      <Modal
        open={showModal}
        title="Crear equipo"
        onClose={() => setShowModal(false)}
      >
        <div className={styles.form}>
          <div className={styles.field}>
            <label>Nombre</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label>Categoría</label>
            <select
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
            >
              <option value="">Seleccionar</option>
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Género</label>
            <select
              name="genero"
              value={form.genero}
              onChange={handleChange}
            >
              <option value="">Seleccionar</option>
              {GENEROS.map((gen) => (
                <option key={gen} value={gen}>
                  {gen}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancel}
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </button>

            <button
              type="button"
              className={styles.submit}
              onClick={handleCreateEquipo}
              disabled={saving}
            >
              {saving ? "Creando…" : "Crear equipo"}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
