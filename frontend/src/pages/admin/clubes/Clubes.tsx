
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import styles from "./Clubes.module.css"

import Button from "../../../components/ui/button/Button"
import Modal from "../../../components/ui/modal/Modal"
import ClubCard from "../../../components/clubes/ClubCard"

import { getClubes, crearClub } from "../../../api/clubes.api"
import type { Club, ClubCreate } from "../../../types/club"

export default function Clubes() {
  // ======================
  // State
  // ======================
  const [clubes, setClubes] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<ClubCreate>({
    nombre: "",
    provincia: "",
    ciudad: "",
    direccion: "",
    telefono: "",
    email: "",
  })

  const navigate = useNavigate()

  // ======================
  // Effects
  // ======================
  useEffect(() => {
    const loadClubes = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await getClubes()
        setClubes(data)
      } catch (err: any) {
        setError(
          err?.response?.data?.message ??
            "Error al cargar clubes"
        )
      } finally {
        setLoading(false)
      }
    }

    loadClubes()
  }, [])

  // ======================
  // Handlers
  // ======================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCreateClub = async () => {
    if (
      !form.nombre.trim() ||
      !form.provincia.trim() ||
      !form.ciudad.trim()
    ) {
      alert("Nombre, provincia y ciudad son obligatorios")
      return
    }

    try {
      setSaving(true)

      const nuevoClub = await crearClub(form)

      setClubes((prev) => [...prev, nuevoClub])
      setShowModal(false)

      setForm({
        nombre: "",
        provincia: "",
        ciudad: "",
        direccion: "",
        telefono: "",
        email: "",
      })
    } catch (err) {
      console.error(err)
      alert("Error al crear club")
    } finally {
      setSaving(false)
    }
  }

  // ======================
  // Render
  // ======================
  if (loading) {
    return <p>Cargando clubes…</p>
  }

  if (error) {
    return (
      <section className={styles.container}>
        <header className={styles.header}>
          <h1>Clubes</h1>
          <Button
            className={styles.primaryButton}
            onClick={() => setShowModal(true)}
          >
            + Nuevo club
          </Button>
        </header>

        <p className={styles.error}>{error}</p>
      </section>
    )
  }

  return (
    <>
      <section className={styles.container}>
        <header className={styles.header}>
          <h1>Clubes</h1>
          <Button
            className={styles.primaryButton}
            onClick={() => setShowModal(true)}
          >
            + Nuevo club
          </Button>
        </header>

        <div className={styles.list}>
          {clubes.length === 0 && (
            <p className={styles.empty}>
              No hay clubes cargados
            </p>
          )}

          {clubes.map((club) => (
            <ClubCard
              key={club.id_club}
              club={club}
              onClick={() =>
                navigate(`/admin/clubes/${club.id_club}`)
              }
            />
          ))}
        </div>
      </section>

      {/* ================= MODAL NUEVO CLUB ================= */}
          <Modal
            open={showModal}
            title="Crear club"
            onClose={() => setShowModal(false)}
          >
            <form
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault()
                handleCreateClub()
              }}
            >
              <div className={styles.field}>
                <label>Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label>Provincia</label>
                <input
                  type="text"
                  name="provincia"
                  value={form.provincia}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label>Ciudad</label>
                <input
                  type="text"
                  name="ciudad"
                  value={form.ciudad}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label>Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={form.direccion ?? ""}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.field}>
                <label>Teléfono</label>
                <input
                  type="text"
                  name="telefono"
                  value={form.telefono ?? ""}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.field}>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email ?? ""}
                  onChange={handleChange}
                />
              </div>

              <footer className={styles.actions}>
                <button
                  type="button"
                  className={styles.cancel}
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className={styles.submit}
                  disabled={saving}
                >
                  {saving ? "Creando…" : "Crear club"}
                </button>
              </footer>
            </form>
          </Modal>


     
    </>
  )
}
