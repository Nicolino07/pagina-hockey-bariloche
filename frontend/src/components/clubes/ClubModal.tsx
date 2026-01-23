// src/components/clubes/ClubModal.tsx
import { useEffect, useState } from "react"
import styles from "./ClubModal.module.css"
import type { Club, ClubCreate } from "../../types/club"

type Props = {
  open: boolean
  club: Club | null
  onClose: () => void
  onSave: (data: ClubCreate) => void
}

export default function ClubModal({
  open,
  club,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<ClubCreate>({
    nombre: "",
    provincia: "",
    ciudad: "",
    direccion: "",
    telefono: "",
    email: "",
  })

  useEffect(() => {
    if (club) {
      setForm({
        nombre: club.nombre,
        provincia: club.provincia,
        ciudad: club.ciudad,
        direccion: club.direccion ?? "",
        telefono: club.telefono ?? "",
        email: club.email ?? "",
      })
    } else {
      setForm({
        nombre: "",
        provincia: "",
        ciudad: "",
        direccion: "",
        telefono: "",
        email: "",
      })
    }
  }, [club])

  if (!open) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <h2>{club ? "Editar club" : "Nuevo club"}</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            name="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={handleChange}
            required
          />

          <input
            name="provincia"
            placeholder="Provincia"
            value={form.provincia}
            onChange={handleChange}
            required
          />

          <input
            name="ciudad"
            placeholder="Ciudad"
            value={form.ciudad}
            onChange={handleChange}
            required
          />

          <input
            name="direccion"
            placeholder="Dirección"
            value={form.direccion}
            onChange={handleChange}
          />

          <input
            name="telefono"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={handleChange}
          />

          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />

          <div className={styles.actions}>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit">
              {club ? "Guardar cambios" : "Crear club"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
